import { describe, test, before } from "node:test";
import assert from "node:assert";
import { NIHProject, NIHProjectQuery } from "../lib/index.js";

describe("Project: Pinaki 2020", async () => {
  let projects: NIHProject[] = [];
  let iter: AsyncGenerator<NIHProject>;
  before(async () => {
    const nihProjectQuery = new NIHProjectQuery();
    const data = await nihProjectQuery
      .setPIProfileIds([10936793])
      .setFiscalYears([2020, 2021])
      .setUseRelevance(true)
      .setExcludeFields(["PrefTerms", "Terms", "AbstractText"])
      .execute();
    projects = data;
    iter = nihProjectQuery.iterator();
  });

  test("Award count", () => {
    assert.equal(projects.length, 9);
  });

  test("Iterator test", async () => {
    let result = await iter.next();
    assert.equal(result.done, false);
    assert.equal(result.value?.applId, 11049028);
    result = await iter.next();
    assert.equal(result.done, false);
    assert.equal(result.value?.applId, 10228110);
  });
});
