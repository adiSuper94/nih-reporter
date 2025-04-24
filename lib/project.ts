import { NIHProject, NIHProjectFields, parseNIHProject } from "./types.js";

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
   * When executed, this will return projects associated with "ANY" of the PI profile IDs passed
   */
  setPIProfileIds(piProfileIds: number[]): NIHProjectQuery {
    this.piProfileIds = piProfileIds;
    return this;
  }

  /**
   * When executed, this will return projects that started in "ANY" of the fiscal years entered
   */
  setFiscalYears(fiscalYears: number[]): NIHProjectQuery {
    this.fiscalYears = fiscalYears;
    return this;
  }

  /**
   * If sets true, it will bring the most closely matching records with the search criteria on top
   * Default is false
   */
  setUseRelevance(useRelevance: boolean): NIHProjectQuery {
    this.useRelavance = useRelevance;
    return this;
  }

  /**
   * Return the result with active projects if set to true
   * Default is false
   */
  setIncludeActiveProjects(includeActiveProjects: boolean): NIHProjectQuery {
    this.includeActiveProjects = includeActiveProjects;
    return this;
  }

  setExcludeFields(excludeFields: NIHProjectFields[]): NIHProjectQuery {
    this.excludeFields = excludeFields;
    return this;
  }

  addExcludeField(excludeField: NIHProjectFields): NIHProjectQuery {
    if (!this.excludeFields.includes(excludeField)) {
      this.excludeFields.push(excludeField);
    }
    return this;
  }

  removeExcludeField(excludeField: string): NIHProjectQuery {
    this.excludeFields = this.excludeFields.filter((field) => field !== excludeField);
    return this;
  }

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

  setOffset(offset: number): NIHProjectQuery {
    if (offset < 0) {
      this.offset = 0;
    } else {
      this.offset = offset;
    }
    return this;
  }

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
    const projects: NIHProject[] = results.map((raw: any) => parseNIHProject(raw));
    return projects;
  }

  /**
   * @param offset to start from, by default it is 0
   * @returns an async iterator that will yield NIHProject objects
   * @throws Error if the NIH Reporter API call fails
   */
  async *iterator(offset = 0): AsyncGenerator<NIHProject, void, void> {
    let buffer: NIHProject[] = [];
    let idx = 0;
    while (true) {
      if (idx >= buffer.length) {
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
   * @param offset to start from, by default it is 0
   * @returns a safe async iterator that will yield NIHProject objects in Golang style (value, error) tuple
   */
  async *safeIterator(offset = 0): AsyncGenerator<[NIHProject?, Error?], [undefined, undefined], void> {
    let buffer: NIHProject[] = [];
    let idx = 0;
    try {
      while (true) {
        if (idx >= buffer.length) {
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
export { NIHProjectQuery, NIHProject };
