import { Schema, Effect, Schedule, Stream, Option } from "effect";
import { HttpClient, HttpClientRequest, HttpBody } from "effect/unstable/http";
import { ParseError, ApiError } from "./errors.js";
import type { NihApiError } from "./errors.js";
import { NihQueryBuilder } from "../query-builder.js";
import { NIHProject, NIHProjectSchema, ProjectQueryBody } from "./schema.js";
import { throttle, updateRateLimitState } from "./rate-limiter.js";

type ProjectQueryBodyType = {
  criteria: {
    use_relevance: boolean;
    fiscal_years: number[];
    include_active_projects: boolean;
    pi_profile_ids: number[];
  };
  exclude_fields?: string[];
  offset: number;
  limit: number;
  sort_order?: "asc" | "desc";
  sort_field?: string;
};

function isRetryableStatus(status: number): boolean {
  return (status >= 500 && status < 600) || status === 429;
}

const retrySchedule = Schedule.exponential("1 minutes", 1.5).pipe(Schedule.compose(Schedule.recurs(3)));

function isRetriable(error: ApiError): boolean {
  return error.isRetriable;
}
class Page<T> {
  result: ReadonlyArray<T>;
  nextOffset: Option.Option<number>;
  constructor(result: readonly T[], nextOffset: Option.Option<number>) {
    this.result = result;
    this.nextOffset = nextOffset;
  }
}

class NIHProjectQuery extends NihQueryBuilder {
  execute(): Stream.Stream<NIHProject, NihApiError, HttpClient.HttpClient> {
    return Stream.fromIterableEffect(
      Effect.gen({ self: this }, function* () {
        const page = yield* this._execute();
        return page.result;
      })
    );
  }

  private _execute(): Effect.Effect<Page<NIHProject>, NihApiError, HttpClient.HttpClient> {
    const body = this.buildQueryBody();
    const queryBody: ProjectQueryBodyType = {
      criteria: body.criteria,
      exclude_fields: body.exclude_fields as string[] | undefined,
      offset: body.offset,
      limit: body.limit,
      sort_order: body.sort_order as "asc" | "desc" | undefined,
      sort_field: body.sort_field as string | undefined,
    };

    return Effect.gen(function* () {
      yield* throttle();
      const client = yield* HttpClient.HttpClient;
      const request = HttpClientRequest.post("https://api.reporter.nih.gov/v2/projects/search", {
        body: HttpBody.jsonUnsafe(queryBody),
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      });

      const response = yield* client.execute(request).pipe(
        Effect.mapError((e): ApiError => {
          let status = e.response?.status ?? 0;
          return new ApiError({
            status,
            statusText: `${e._tag}: ${e.message}`,
            isRetriable: isRetryableStatus(status),
            cause: e,
          });
        }),
        Effect.retry({ schedule: retrySchedule, while: isRetriable })
      );

      const responseText = yield* response.text.pipe(
        Effect.mapError(
          (e): ApiError =>
            new ApiError({
              status: 0,
              statusText: "Failed to read response body",
              isRetriable: false,
              cause: e,
            })
        )
      );
      const data = yield* Schema.decodeUnknownEffect(
        Schema.fromJsonString(Schema.Struct({ results: Schema.Array(NIHProjectSchema) }))
      )(responseText).pipe(
        Effect.mapError(
          (e): ParseError =>
            new ParseError({
              rawInput: responseText,
              schemaErrors: String(e),
              cause: e,
            })
        )
      );
      yield* updateRateLimitState(response.headers);
      if (data.results.length < queryBody.limit) {
        return new Page(data.results, Option.none());
      }
      return new Page(data.results, Option.some(queryBody.offset + queryBody.limit));
    });
  }

  stream(offset = 0): Stream.Stream<NIHProject, NihApiError, HttpClient.HttpClient> {
    return Stream.paginate(offset, (offset) =>
      Effect.gen({ self: this }, function* () {
        const page = yield* this.setOffset(offset)._execute();
        return [page.result, page.nextOffset];
      })
    );
  }
}

export { ProjectQueryBody, NIHProjectQuery };
export type { ProjectQueryBodyType, NihApiError };
