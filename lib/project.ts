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

  setPIProfileIds(piProfileIds: number[]): NIHProjectQuery {
    this.piProfileIds = piProfileIds;
    return this;
  }

  setFiscalYears(fiscalYears: number[]): NIHProjectQuery {
    this.fiscalYears = fiscalYears;
    return this;
  }

  setUseRelevance(useRelevance: boolean): NIHProjectQuery {
    this.useRelavance = useRelevance;
    return this;
  }

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

  async execute(): Promise<[NIHProject[], Error | null]> {
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
      return [[], new Error(`NIH API err_msg: ${errMsg}`)];
    }
    const projects: NIHProject[] = results.map((raw: any) => parseNIHProject(raw));
    return [projects, null];
  }

  iterator() {
    let done = false;
    let buffer: NIHProject[] = [];
    let idx = 0;
    const iterator = {
      next: async (): Promise<[NIHProject?, Error?]> => {
        if (done) {
          return [undefined, undefined];
        }
        if (idx >= buffer.length) {
          const [projects, err] = await this.execute();
          this.offset += this.limit;
          this.setOffset(this.offset);
          if (err) {
            done = true;
            return [undefined, err];
          }
          buffer = projects;
          idx = 0;
        }
        return [buffer[idx], undefined];
      },
    };
    return iterator;
  }
}
export { NIHProjectQuery, NIHProject };
