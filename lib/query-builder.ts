import type { ExcludeNIHProjectFields, NIHProjectFields } from "./types.ts";

export interface ProjectQueryBody {
  criteria: {
    use_relevance: boolean;
    fiscal_years: number[];
    include_active_projects: boolean;
    pi_profile_ids: number[];
  };
  exclude_fields: ExcludeNIHProjectFields[];
  offset: number;
  limit: number;
  sort_order?: "asc" | "desc";
  sort_field?: NIHProjectFields;
}

/**
 * NihQueryBuilder abstract class to query the NIH Reporter API for projects
 * All methods follow the builder pattern (are chainable) and return the same instance of the class
 */
abstract class NihQueryBuilder {
  protected useRelevance: boolean = false;
  protected fiscalYears: number[] = [];
  protected includeActiveProjects: boolean = true;
  protected piProfileIds: number[] = [];
  protected excludeFields: ExcludeNIHProjectFields[] = [];
  protected sortOrder?: "asc" | "desc";
  protected sortField?: NIHProjectFields;
  protected offset: number = 0;
  protected limit: number = 50;

  /**
   * Set query params to return projects associated with "ANY" of the PI profile IDs passed
   * @param piProfileIds - The PI profile IDs to filter the projects by
   */
  setPIProfileIds(piProfileIds: number[]): this {
    this.piProfileIds = piProfileIds;
    return this;
  }

  /**
   * Sets query params return projects that started in "ANY" of the fiscal years entered
   * @param fiscalYears - The fiscal years to filter the projects by
   */
  setFiscalYears(fiscalYears: number[]): this {
    this.fiscalYears = fiscalYears;
    return this;
  }

  /**
   * If sets true, it will bring the most closely matching records with the search criteria on top
   * @param useRelevance - If true, use relevance scoring for the results, default is false
   */
  setUseRelevance(useRelevance: boolean): this {
    this.useRelevance = useRelevance;
    return this;
  }

  /**
   * Return the result with active projects if set to true
   * @param includeActiveProjects - If true, include active projects in the result, default is false
   */
  setIncludeActiveProjects(includeActiveProjects: boolean): this {
    this.includeActiveProjects = includeActiveProjects;
    return this;
  }

  /**
   * Set the fields to exclude from the result
   * @param excludeFields - The fields to exclude from the result
   */
  setExcludeFields(excludeFields: ExcludeNIHProjectFields[]): this {
    this.excludeFields = excludeFields;
    return this;
  }

  /**
   * Add a field to exclude from the result
   * @param excludeField - The field to exclude from the result
   */
  addExcludeField(excludeField: ExcludeNIHProjectFields): this {
    if (!this.excludeFields.includes(excludeField)) {
      this.excludeFields.push(excludeField);
    }
    return this;
  }

  /**
   * Remove a field to exclude from the result.
   * @param excludeField - The field to remove from the exclude list
   */
  removeExcludeField(excludeField: string): this {
    this.excludeFields = this.excludeFields.filter((field) => field !== excludeField);
    return this;
  }

  /**
   * Set the number of records to return
   * @param limit - The number of records to return, default is 50
   */
  setLimit(limit: number): this {
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
  setOffset(offset: number): this {
    if (offset < 0) {
      this.offset = 0;
    } else {
      this.offset = offset;
    }
    return this;
  }

  /**
   * Set the sort order for the results
   * @param sortOrder - The sort order for the results, either "asc" or "desc"
   */
  setSortOrder(sortOrder: "asc" | "desc"): this {
    this.sortOrder = sortOrder;
    return this;
  }

  /**
   * Set the field to sort the results by
   * @param sortField - The field to sort the results by
   */
  setSortField(sortField: NIHProjectFields): this {
    this.sortField = sortField;
    return this;
  }

  protected buildQueryBody(): ProjectQueryBody {
    const body: ProjectQueryBody = {
      criteria: {
        use_relevance: this.useRelevance,
        fiscal_years: this.fiscalYears,
        include_active_projects: this.includeActiveProjects,
        pi_profile_ids: this.piProfileIds,
      },
      exclude_fields: this.excludeFields,
      offset: this.offset,
      limit: this.limit,
    };

    if (this.sortField) {
      body.sort_order = this.sortOrder ?? "asc";
      body.sort_field = this.sortField;
    }

    return body;
  }

  abstract execute(): unknown;
}

export { NihQueryBuilder };
