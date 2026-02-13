import { parseNIHProject } from "./types.ts";
import type { NIHProject } from "./types.ts";
import { NihQueryBuilder } from "./query-builder.ts";

class NIHProjectQuery extends NihQueryBuilder {
  private retryCount: number;

  constructor(retryCount = 2) {
    super();
    this.retryCount = retryCount;
  }

  private isRetryableError(resp: Response): boolean {
    if (resp.status >= 500 && resp.status < 600) {
      return true;
    }
    if (resp.status === 429) {
      return true;
    }
    return false;
  }

  async execute(): Promise<NIHProject[]> {
    let resp: Response;
    let tryCount = 0;
    do {
      const queryBody = this.buildQueryBody();
      resp = await fetch("https://api.reporter.nih.gov/v2/projects/search", {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },

        body: JSON.stringify(queryBody),
      });
      if (!resp.ok) {
        if (this.isRetryableError(resp)) {
          await resp.body?.cancel();
          continue;
        }
      }
      const data = await resp.json();
      const results = data.results;
      if (typeof results != "object") {
        const errMsg = data[0];
        throw new Error(`NIH API err_msg: ${errMsg}`);
      }
      const projects: NIHProject[] = results.map((p: unknown) => {
        const [project, err] = parseNIHProject(p);
        if (err) {
          throw new Error(`NIH API parse err_msg: ${JSON.stringify(err, null, 1)}`);
        }
        return project;
      });
      return projects;
    } while (this.retryCount > ++tryCount);
    // deno-lint-ignore no-unreachable -- this is reachable, bug in deno lint
    throw new Error(`NIH API HTTP error: ${resp.status} ${resp.statusText}`);
  }

  /**
   * Creates an async iterator that will yield NIHProject objects queried from the NIH Reporter API
   * @param offset to start from, by default it is 0
   * @returns an async iterator that will yield NIHProject objects
   * @throws Error if the NIH Reporter API call fails
   */
  async *iterator(offset = 0): AsyncGenerator<NIHProject, void, void> {
    while (true) {
      this.setOffset(offset);
      const projects = await this.execute();
      offset += this.limit;
      for (const project of projects) {
        yield project;
      }
      if (projects.length < this.limit) {
        return;
      }
    }
  }

  /**
   * Creates a safe async iterator that will yield NIHProject objects queried from the NIH Reporter API
   * @param offset to start from, by default it is 0
   * @returns a safe async iterator that will yield NIHProject objects in Golang style (value, error) tuple
   */
  async *safeIterator(offset = 0): AsyncGenerator<[NIHProject?, Error?], [undefined, undefined], void> {
    let buffer: NIHProject[] = [];
    let idx = 0;
    try {
      while (true) {
        if (idx >= buffer.length) {
          if (buffer.length != 0 && buffer.length < this.limit) {
            return [undefined, undefined];
          }
          this.setOffset(offset);
          const projects = await this.execute();
          offset += this.limit;
          buffer = projects;
          idx = 0;
        }
        if (idx >= buffer.length) {
          return [undefined, undefined];
        }
        yield [buffer[idx++], undefined];
      }
    } catch (err) {
      if (err instanceof Error) {
        yield [undefined, err];
      } else {
        yield [undefined, new Error(String(err))];
      }
    }
    return [undefined, undefined];
  }
}
export { type NIHProject, NIHProjectQuery };
