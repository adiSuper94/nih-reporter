import { z } from "@zod/mini";
z.config(z.locales.en());

const NIHPersonSchema = z.pipe(
  z.interface({
    profile_id: z.number(),
    first_name: z.string(),
    last_name: z.string(),
    middle_name: z.string(),
    full_name: z.string(),
    is_contact_pi: z.boolean(),
    title: z.optional(z.string()),
  }),
  z.transform((p) => {
    return {
      nihPersonId: p.profile_id,
      firstName: p.first_name,
      lastName: p.last_name,
      middleName: p.middle_name,
      fullName: p.full_name,
      isContactPI: p.is_contact_pi,
      title: p.title ?? undefined,
    };
  }),
);

interface NIHPerson extends z.infer<typeof NIHPersonSchema> {}

const NIHOrgSchema = z.pipe(
  z.interface({
    org_name: z.string(),
    city: z.nullable(z.string()),
    country: z.nullable(z.string()),
    org_city: z.string(),
    org_state: z.string(),
    org_country: z.string(),
    org_state_name: z.nullable(z.string()),
    org_zipcode: z.string(),
    org_fips: z.string(),
    org_ipf_code: z.string(),
    external_org_id: z.coerce.number(),
    dept_type: z.string(),
    fips_county_code: z.nullish(z.string()),
    org_duns: z.array(z.string()),
    org_ueis: z.array(z.string()),
    primary_duns: z.string(),
    primary_uei: z.string(),
  }),
  z.transform((o) => {
    return {
      orgName: o.org_name,
      city: o.city ?? null,
      country: o.country ?? null,
      orgCity: o.org_city,
      orgState: o.org_state,
      orgCountry: o.org_country ?? null,
      orgStateName: o.org_state_name ?? null,
      deptType: o.dept_type,
      orgDuns: o.org_duns,
      orgUeis: o.org_ueis,
      primaryDuns: o.primary_duns,
      primaryUei: o.primary_uei,
      orgFips: o.org_fips,
      orgIPFCode: o.org_ipf_code,
      externalOrgId: o.external_org_id,
      fipsCountyCode: o.fips_county_code ?? null,
    };
  }),
);

interface NIHOrg extends z.infer<typeof NIHOrgSchema> {}

const NIHProjectSchema = z.pipe(
  z.interface({
    appl_id: z.number(),
    subproject_id: z.nullish(z.string()),
    fiscal_year: z.number(),
    project_num: z.string(),
    project_serial_num: z.string(),
    award_type: z.string(),
    activity_code: z.string(),
    award_amount: z.number(),
    direct_cost_amt: z.number(),
    indirect_cost_amt: z.number(),
    is_active: z.boolean(),
    cong_district: z.optional(z.string()),
    project_start_date: z.string(),
    project_end_date: z.string(),
    budget_start: z.string(),
    budget_end: z.string(),
    principal_investigators: z.array(NIHPersonSchema),
    date_added: z.string(),
    agency_code: z.string(),
    arra_funded: z.string(),
    opportunity_number: z.string(),
    is_new: z.boolean(),
    core_project_num: z.string(),
    mechanism_code_dc: z.string(),
    project_title: z.string(),
    covid_response: z.nullish(z.string()),
    cfda_code: z.string(),
    organization: NIHOrgSchema,
    spending_categories: z.nullish(z.array(z.coerce.number())),
    spending_categories_desc: z.nullish(z.string()),
    terms: z.nullish(z.string()),
    pref_terms: z.nullish(z.string()),
    abstract_text: z.nullish(z.string()),
  }),
  z.transform((p) => {
    const org: NIHOrg = p.organization;
    const pis: NIHPerson[] = p.principal_investigators;
    return {
      applId: p.appl_id,
      subProjectId: p.subproject_id,
      fiscalYear: p.fiscal_year,
      projectNum: p.project_num,
      projectSerialNum: p.project_serial_num,
      awardType: p.award_type,
      activityCode: p.activity_code,
      awardAmount: p.award_amount,
      directCost: p.direct_cost_amt,
      indirectCost: p.indirect_cost_amt,
      isActive: p.is_active,
      congDistrict: p.cong_district,
      projectStartDate: new Date(p.project_start_date),
      projectEndDate: new Date(p.project_end_date),
      budgetStartDate: new Date(p.budget_start),
      budgetEndDate: new Date(p.budget_end),
      principalInvestigators: pis,
      dateAdded: new Date(p.date_added),
      agencyCode: p.agency_code,
      arraFunded: p.arra_funded,
      oppurtunityNumber: p.opportunity_number,
      isNew: p.is_new,
      coreProjectNum: p.core_project_num,
      mechanismCodeDc: p.mechanism_code_dc,
      projectTitle: p.project_title,
      covidResponse: p.covid_response ?? undefined,
      cfdaCode: p.cfda_code,
      org: org,
      spendingCategories: typeof p.spending_categories === "object" ? (p.spending_categories as number[]) : undefined,
      terms: typeof p.terms === "string"
        ? (p.terms.match(/<([^>]+)>/g)?.map((tag) => tag.slice(1, -1)) || [])
        : undefined,
      spendingCategoriesDesc: typeof p.spending_categories_desc === "string"
        ? (p.spending_categories_desc.split(";") as string[])
        : undefined,
      prefTerms: typeof p.pref_terms === "string" ? (p.pref_terms.split(";") as string[]) : undefined,
      abstractText: p.abstract_text,
    };
  }),
);

/**
 * NIH Project/Award object
 */
interface NIHProject extends z.infer<typeof NIHProjectSchema> {}

type NIHProjectFields =
  | "SpendingCategories"
  | "SpendingCategoriesDesc"
  | "ProgramOfficers"
  | "AbstractText"
  | "Terms"
  | "PrefTerms"
  | "CovidResponse"
  | "SubprojectId";

export function parseNIHProject(obj: unknown): [NIHProject, undefined] | [undefined, Error] {
  const result = NIHProjectSchema.safeParse(obj);
  if (result.success) {
    return [result.data, undefined];
  } else {
    return [undefined, result.error];
  }
}

export type { NIHProject, NIHProjectFields };
