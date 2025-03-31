import { NIHProjectQuery } from "./mod.ts";

Deno.test("NIHProjectQuery", async () => {
  const nihProjectQuery = new NIHProjectQuery();
  const [data, _err] = await nihProjectQuery
    .setPIProfileIds([10936793])
    .setFiscalYears([2020, 2021])
    .setUseRelevance(true)
    .setExcludeFields(["PrefTerms", "Terms", "AbstractText"])
    .execute();
  console.log(JSON.stringify(data, null, 2));
});
