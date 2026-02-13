import { Schema } from "effect";
import { HttpClient, HttpClientRequest, HttpBody } from "@effect/platform";
import { Effect, Schedule, Stream } from "effect";
import { ParseError, ApiError } from "./errors.ts";
import type { NihApiError } from "./errors.ts";
import { NihQueryBuilder } from "../query-builder.ts";

const NIHPerson = Schema.Struct({
  profile_id: Schema.Number,
  first_name: Schema.String,
  last_name: Schema.String,
  middle_name: Schema.String,
  full_name: Schema.String,
  is_contact_pi: Schema.Boolean,
  title: Schema.NullishOr(Schema.String),
});

const NIHOrg = Schema.Struct({
  org_name: Schema.String,
  city: Schema.NullishOr(Schema.String),
  country: Schema.NullishOr(Schema.String),
  org_city: Schema.NullishOr(Schema.String),
  org_state: Schema.NullishOr(Schema.String),
  org_country: Schema.NullishOr(Schema.String),
  org_state_name: Schema.NullishOr(Schema.String),
  org_zip_code: Schema.NullishOr(Schema.String),
  org_fips: Schema.NullishOr(Schema.String),
  org_ipf_code: Schema.NullishOr(Schema.String),
  external_org_id: Schema.Number,
  dept_type: Schema.NullishOr(Schema.String),
  fips_county_code: Schema.NullishOr(Schema.String),
  org_duns: Schema.NullishOr(Schema.Array(Schema.String)),
  org_ueis: Schema.NullishOr(Schema.Array(Schema.String)),
  primary_duns: Schema.NullishOr(Schema.String),
  primary_uei: Schema.NullishOr(Schema.String),
});

const NIHProjectSchema = Schema.Struct({
  appl_id: Schema.Number,
  subproject_id: Schema.NullishOr(Schema.String),
  project_num: Schema.String,
  project_serial_num: Schema.NullishOr(Schema.String),
  award_type: Schema.NullishOr(Schema.String),
  activity_code: Schema.String,
  award_amount: Schema.NullishOr(Schema.Number),
  direct_cost_amt: Schema.NullishOr(Schema.Number),
  indirect_cost_amt: Schema.NullishOr(Schema.Number),
  is_active: Schema.Boolean,
  cong_district: Schema.NullishOr(Schema.String),
  project_start_date: Schema.NullishOr(Schema.String),
  project_end_date: Schema.NullishOr(Schema.String),
  budget_start: Schema.NullishOr(Schema.String),
  budget_end: Schema.NullishOr(Schema.String),
  principal_investigators: Schema.Array(NIHPerson),
  date_added: Schema.String,
  agency_code: Schema.String,
  arra_funded: Schema.String,
  opportunity_number: Schema.NullishOr(Schema.String),
  is_new: Schema.Boolean,
  core_project_num: Schema.String,
  mechanism_code_dc: Schema.String,
  project_title: Schema.String,
  covid_response: Schema.NullishOr(Schema.Array(Schema.String)),
  cfda_code: Schema.NullishOr(Schema.String),
  organization: NIHOrg,
  spending_categories: Schema.NullishOr(Schema.Array(Schema.Number)),
  spending_categories_desc: Schema.NullishOr(Schema.String),
  terms: Schema.NullishOr(Schema.String),
  pref_terms: Schema.NullishOr(Schema.String),
  abstract_text: Schema.NullishOr(Schema.String),
});

type NIHProject = typeof NIHProjectSchema.Type;

const ProjectQueryCriteria = Schema.Struct({
  use_relevance: Schema.Boolean,
  fiscal_years: Schema.Array(Schema.Number),
  include_active_projects: Schema.Boolean,
  pi_profile_ids: Schema.Array(Schema.Number),
});

const ProjectQueryBody = Schema.Struct({
  criteria: ProjectQueryCriteria,
  exclude_fields: Schema.optional(Schema.Array(Schema.String)),
  offset: Schema.Number,
  limit: Schema.Number,
  sort_order: Schema.optional(Schema.Union(Schema.Literal("asc"), Schema.Literal("desc"))),
  sort_field: Schema.optional(Schema.String),
});

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

const retrySchedule = Schedule.exponential("32 seconds").pipe(
  Schedule.whileInput(() => true),
  Schedule.compose(Schedule.recurs(3))
);

function isRetriable(error: ApiError): boolean {
  return error.isRetriable;
}

class NIHProjectQuery extends NihQueryBuilder {
  execute(): Effect.Effect<readonly NIHProject[], NihApiError, HttpClient.HttpClient> {
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
      const client = yield* HttpClient.HttpClient;
      const request = HttpClientRequest.post("https://api.reporter.nih.gov/v2/projects/search", {
        body: HttpBody.unsafeJson(queryBody),
        headers: { "Content-Type": "application/json", Accept: "application/json" },
      });

      const response = yield* client.execute(request).pipe(
        Effect.mapError((e): ApiError => {
          const status = e._tag === "ResponseError" ? e.response.status : 0;
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

      const data = yield* Schema.decodeUnknown(
        Schema.parseJson(Schema.Struct({ results: Schema.Array(NIHProjectSchema) }))
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

      return data.results;
    });
  }

  stream(offset = 0): Stream.Stream<NIHProject, NihApiError, HttpClient.HttpClient> {
    return Stream.flatMap(this.setOffset(offset).execute(), (projects: readonly NIHProject[]) => {
      if (projects.length < this.limit) {
        return Stream.fromIterable(projects) as Stream.Stream<NIHProject, NihApiError, HttpClient.HttpClient>;
      }
      return Stream.concat(
        Stream.fromIterable(projects) as Stream.Stream<NIHProject, NihApiError, HttpClient.HttpClient>,
        this.stream(offset + this.limit)
      );
    });
  }
}

export { ProjectQueryBody, ProjectQueryCriteria, NIHProjectQuery };
export type { ProjectQueryBodyType, NihApiError };
