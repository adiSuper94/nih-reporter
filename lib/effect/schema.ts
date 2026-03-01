import { Schema } from "effect";

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
  org_zipcode: Schema.NullishOr(Schema.String),
  org_fips: Schema.NullishOr(Schema.String),
  org_ipf_code: Schema.NullishOr(Schema.String),
  external_org_id: Schema.Number,
  dept_type: Schema.NullishOr(Schema.String),
  fips_country_code: Schema.NullishOr(Schema.String),
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
  cong_dist: Schema.NullishOr(Schema.String),
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
  terms: Schema.optional(Schema.String),
  pref_terms: Schema.optional(Schema.String),
  abstract_text: Schema.optional(Schema.String),
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
  sort_order: Schema.optional(Schema.Literals(["asc", "desc"])),
  sort_field: Schema.optional(Schema.String),
});

export { NIHProjectSchema, ProjectQueryBody };
export type { NIHProject };
