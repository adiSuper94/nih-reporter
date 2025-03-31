// deno-lint-ignore-file no-explicit-any
type NIHProject = {
  applId: number;
  subProjectId?: string;
  fiscalYear: number;
  projectNum: string;
  projectSerialNum: string;
  awardType: string;
  activityCode: string;
  awardAmount: number;
  directCost: number;
  indirectCost: number;
  isActive: boolean;
  congDistrict: string;
  projectStartDate: Date;
  projectEndDate: Date;
  budgetStartDate: Date;
  budgetEndDate: Date;
  principalInvestigators: NIHPerson[];
  dateAdded: Date;
  agencyCode: string;
  arraFunded: string;
  oppurtunityNumber: string;
  isNew: boolean;
  coreProjectNum: string;
  mechanismCodeDc: string;
  projectTitle: string;
  covidResponse?: string;
  cfdaCode: string;
  org: NIHOrg;
  spendingCategories?: number[];
  terms?: string[];
  prefTerms?: string[];
  abstractText?: string;
};

type NIHPerson = {
  eraId: number;
  firstName: string;
  lastName: string;
  middleName: string;
  fullName: string;
  isContactPI: boolean;
  title?: string;
};

type NIHOrg = {
  orgName: string;
  city?: string;
  country?: string;
  orgCity: string;
  orgState: string;
  orgCountry?: string;
  orgStateName?: string;
  orgZipCode: string;
  orgFips: string;
  orgIPFCode: string;
  externalOrgId: string;
  deptType: string;
  fipsCountyCode?: string;
  orgDuns: string[];
  orgUeis: string[];
  primaryDuns: string;
  primaryUei: string;
};

function parseNIHPerson(raw: any): NIHPerson {
  return {
    eraId: raw.profile_id,
    firstName: raw.first_name,
    lastName: raw.last_name,
    middleName: raw.middle_name,
    fullName: raw.full_name,
    isContactPI: raw.is_contact_pi,
    title: raw.title || undefined,
  };
}
function parseNIHOrg(raw: any): NIHOrg {
  return {
    orgName: raw.org_name,
    city: raw.city ?? undefined,
    country: raw.country ?? undefined,
    orgCity: raw.org_city,
    orgState: raw.org_state,
    orgCountry: raw.org_country ?? undefined,
    orgStateName: raw.org_state_name ?? undefined,
    deptType: raw.dept_type,
    orgDuns: raw.org_duns,
    orgUeis: raw.org_ueis,
    primaryDuns: raw.primary_duns,
    primaryUei: raw.primary_uei,
    orgFips: raw.org_fips,
    orgIPFCode: raw.org_ipf_code,
    orgZipCode: raw.org_zipcode,
    externalOrgId: raw.external_org_id,
    fipsCountyCode: raw.fips_county_code ?? undefined,
  };
}

function parseNIHProject(raw: any): NIHProject {
  let pis: NIHPerson[] = [];
  if (raw.principal_investigators) {
    pis = raw.principal_investigators.map((pi: any) => parseNIHPerson(pi));
  }
  const org = parseNIHOrg(raw.organization);
  return {
    applId: Number(raw.appl_id),
    subProjectId: raw.subproject_id ?? undefined,
    fiscalYear: Number(raw.fiscal_year),
    projectNum: raw.project_num,
    projectSerialNum: raw.project_serial_num,
    awardType: raw.award_type,
    activityCode: raw.activity_code,
    awardAmount: Number(raw.award_amount),
    isActive: Boolean(raw.is_active),
    congDistrict: raw.cong_district,
    projectStartDate: new Date(raw.project_start_date),
    projectEndDate: new Date(raw.project_end_date),
    principalInvestigators: pis,
    budgetStartDate: new Date(raw.budget_start),
    budgetEndDate: new Date(raw.budget_end),
    directCost: Number(raw.direct_cost_amt),
    indirectCost: Number(raw.indirect_cost_amt),
    agencyCode: raw.agency_code,
    arraFunded: raw.arra_funded,
    dateAdded: new Date(raw.date_added),
    coreProjectNum: raw.core_project_num,
    oppurtunityNumber: raw.opportunity_number,
    isNew: Boolean(raw.is_new),
    mechanismCodeDc: raw.mechanism_code_dc,
    projectTitle: raw.project_title,
    covidResponse: raw.covid_response ?? undefined,
    org: org,
    cfdaCode: raw.cfda_code,
    prefTerms: raw.pref_terms ? raw.pref_terms.split(";") : undefined,
    terms: raw.terms ? raw.terms.match(/<([^>]+)>/g)?.map((tag: string) => tag.slice(1, -1)) || [] : undefined,
    spendingCategories: raw.spending_categories ? raw.spending_categories.map((cat: any) => Number(cat)) : undefined,
  };
}

type NIHProjectFields =
  | "SpendingCategories"
  | "SpendingCategoriesDesc"
  | "ProgramOfficers"
  | "AbstractText"
  | "Terms"
  | "PrefTerms"
  | "CovidResponse"
  | "SubprojectId";

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
      return [[], new Error("Invalid response")];
    }
    const projects: NIHProject[] = results.map((raw: any) => parseNIHProject(raw));
    return [projects, null];
  }

  iterator() {
    let done = false;
    const iterator = {
      next: async (): Promise<[NIHProject[], Error | null]> => {
        if (done) {
          return [[], null];
        }
        const [projects, err] = await this.execute();
        if (err) {
          return [[], err];
        }
        if (projects.length < this.limit) {
          done = true;
        }
        this.offset += this.limit;
        this.setOffset(this.offset);
        return [projects, null];
      },
    };
    return iterator;
  }
}

export { NIHProjectQuery };
