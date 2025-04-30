import { assertEquals } from "@std/assert";
import { NIHProjectQuery } from "../lib/index.ts";

const query = new NIHProjectQuery();
const projects = await query
  .setPIProfileIds([10936793])
  .setFiscalYears([2020, 2021])
  .setUseRelevance(true)
  .setExcludeFields(["PrefTerms", "Terms", "AbstractText"])
  .execute();

Deno.test("Award count", () => {
  assertEquals(projects.length, 9);
});

Deno.test("Excluded fields not present", () => {
  for (const project of projects) {
    assertEquals(project.prefTerms, undefined);
    assertEquals(project.terms, undefined);
    assertEquals(project.abstractText, undefined);
  }
});

Deno.test("Iterator test", async () => {
  const iter = query.iterator();
  let result = await iter.next();
  assertEquals(result.done, false);
  assertEquals(result.value?.applId, 11049028);
  result = await iter.next();
  assertEquals(result.done, false);
  assertEquals(result.value?.applId, 10228110);
});

Deno.test("Iterator safe test", async () => {
  const iterSafe = query.safeIterator();
  let { value, done } = await iterSafe.next();
  assertEquals(done, false);
  let [result, _err] = value;
  assertEquals(result?.applId, 11049028);
  ({ value, done } = await iterSafe.next());
  assertEquals(done, false);
  [result, _err] = value;
  assertEquals(result?.applId, 10228110);
});

Deno.test("Totally consumed iterator", async () => {
  const iter = query.iterator();
  for (let i = 0; i < projects.length; i++) {
    await iter.next();
  }
  const { value, done } = await iter.next();
  assertEquals(done, true);
  assertEquals(value, undefined);
});

Deno.test("Totally consumed safe iterator", async () => {
  const iterSafe = query.safeIterator();
  for (let i = 0; i < projects.length; i++) {
    await iterSafe.next();
  }
  const { value, done } = await iterSafe.next();
  assertEquals(done, true);
  const [result, err] = value;
  assertEquals(result, undefined);
  assertEquals(err, undefined);
});
