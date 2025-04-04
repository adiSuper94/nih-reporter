import { describe, it, before } from "node:test";
import assert from "node:assert";
import { NIHProject, NIHProjectQuery } from "../lib/index.js";

describe("Project: Pinaki 2020", async () => {
  let projects: NIHProject[] = [];
  before(async () => {
    const nihProjectQuery = new NIHProjectQuery();
    const [data, _err] = await nihProjectQuery
      .setPIProfileIds([10936793])
      .setFiscalYears([2020, 2021])
      .setUseRelevance(true)
      .setExcludeFields(["PrefTerms", "Terms", "AbstractText"])
      .execute();
    projects = data;
  });

  it("Award count", () => {
    assert.equal(projects.length, 9);
  });
});
