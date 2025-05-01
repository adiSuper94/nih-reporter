import { type NIHProject, type NIHProjectFields, parseNIHProject } from "./types.ts";

/**
 * NIHProjectQuery class to query the NIH Reporter API for projects
 * All methods follow the builder pattern (are chainable) and return the same instance of the class
 */
class NIHProjectQuery {
  private useRelavance: boolean;
  private fiscalYears: number[];
  private includeActiveProjects: boolean;
  private piProfileIds: number[];
  private excludeFields: NIHProjectFields[];
  private offset: number;
  private limit: number;

  constructor() {
    this.useRelavance = false;
    this.fiscalYears = [];
    this.includeActiveProjects = true;
    this.piProfileIds = [];
    this.excludeFields = [];
    this.offset = 0;
    this.limit = 50;
  }

  /**
   * Set query params to return projects associated with "ANY" of the PI profile IDs passed
   * @param piProfileIds - The PI profile IDs to filter the projects by
   */
  setPIProfileIds(piProfileIds: number[]): NIHProjectQuery {
    this.piProfileIds = piProfileIds;
    return this;
  }

  /**
   * Sets query params return projects that started in "ANY" of the fiscal years entered
   * @param fiscalYears - The fiscal years to filter the projects by
   */
  setFiscalYears(fiscalYears: number[]): NIHProjectQuery {
    this.fiscalYears = fiscalYears;
    return this;
  }

  /**
   * If sets true, it will bring the most closely matching records with the search criteria on top
   * @param useRelevance - If true, use relevance scoring for the results, default is false
   */
  setUseRelevance(useRelevance: boolean): NIHProjectQuery {
    this.useRelavance = useRelevance;
    return this;
  }

  /**
   * Return the result with active projects if set to true
   * @param includeActiveProjects - If true, include active projects in the result, default is false
   */
  setIncludeActiveProjects(includeActiveProjects: boolean): NIHProjectQuery {
    this.includeActiveProjects = includeActiveProjects;
    return this;
  }

  /**
   * Set the fields to exclude from the result
   * @param excludeFields - The fields to exclude from the result
   */
  setExcludeFields(excludeFields: NIHProjectFields[]): NIHProjectQuery {
    this.excludeFields = excludeFields;
    return this;
  }

  /**
   * Add a field to exclude from the result
   * @param excludeField - The field to exclude from the result
   */
  addExcludeField(excludeField: NIHProjectFields): NIHProjectQuery {
    if (!this.excludeFields.includes(excludeField)) {
      this.excludeFields.push(excludeField);
    }
    return this;
  }

  /**
   * Remove a field to exclude from the result.
   * @param excludeField - The field to remove from the exclude list
   */
  removeExcludeField(excludeField: string): NIHProjectQuery {
    this.excludeFields = this.excludeFields.filter((field) => field !== excludeField);
    return this;
  }

  /**
   * Set the number of records to return
   * @param limit - The number of records to return, default is 50
   */
  setLimit(limit: number): NIHProjectQuery {
    if (limit <= 0) {
      this.limit = 50;
    } else if (limit > 14999) {
      this.limit = 14999;
    } else {
      this.limit = limit;
    }
    return this;
  }

  /**
   * Set the offset for the records to return
   * @param offset - The offset for the records to return, default is 0
   */
  setOffset(offset: number): NIHProjectQuery {
    if (offset < 0) {
      this.offset = 0;
    } else {
      this.offset = offset;
    }
    return this;
  }

  /**
   * Execute the query and return the results
   * @returns - The results of the query
   * @throws - Error if the NIH Reporter API call fails
   */
  async execute(): Promise<NIHProject[]> {
    const resp = await fetch("https://api.reporter.nih.gov/v2/projects/search", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        criteria: {
          use_relevance: this.useRelavance,
          fiscal_years: this.fiscalYears,
          include_active_projects: this.includeActiveProjects,
          pi_profile_ids: this.piProfileIds,
        },
        exclude_fields: this.excludeFields,
        offset: this.offset,
        limit: this.limit,
      }),
    });
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
  }

  /**
   * Creates an async iterator that will yield NIHProject objects queried from the NIH Reporter API
   * @param offset to start from, by default it is 0
   * @returns an async iterator that will yield NIHProject objects
   * @throws Error if the NIH Reporter API call fails
   */
  async *iterator(offset = 0): AsyncGenerator<NIHProject, void, void> {
    let buffer: NIHProject[] = [];
    let idx = 0;
    while (true) {
      if (idx >= buffer.length) {
        if (buffer.length != 0 && buffer.length < this.limit) {
          return;
        }
        this.setOffset(offset);
        const projects = await this.execute();
        offset += this.limit;
        buffer = projects;
        idx = 0;
      }
      if (idx >= buffer.length) {
        return;
      }
      yield buffer[idx++];
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
