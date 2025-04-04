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

  export { parseNIHProject, NIHProjectFields, NIHProject };
