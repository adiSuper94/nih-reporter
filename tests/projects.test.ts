import { describe, test, before } from "node:test";
import assert from "node:assert";
import { NIHProject, NIHProjectQuery } from "../lib/index.js";

describe("Project: Pinaki 2020", async () => {
  const query = new NIHProjectQuery();
  let projects: NIHProject[] = [];
  before(async () => {
    const data = await query
      .setPIProfileIds([10936793])
      .setFiscalYears([2020, 2021])
      .setUseRelevance(true)
      .setExcludeFields(["PrefTerms", "Terms", "AbstractText"])
      .execute();
    projects = data;
  });

  test("Award count", () => {
    assert.equal(projects.length, 9);
  });

  test("Iterator test", async () => {
    let iter = query.iterator();
    let result = await iter.next();
    assert.equal(result.done, false);
    assert.equal(result.value?.applId, 11049028);
    result = await iter.next();
    assert.equal(result.done, false);
    assert.equal(result.value?.applId, 10228110);
  });

  test("Iterator safe test", async () => {
    let iterSafe = query.safeIterator();
    let { value, done } = await iterSafe.next();
    assert.equal(done, false);
    let [result, _err] = value;
    assert.equal(result?.applId, 11049028);
    ({ value, done } = await iterSafe.next());
    assert.equal(done, false);
    [result, _err] = value;
    assert.equal(result?.applId, 10228110);
  });
});
