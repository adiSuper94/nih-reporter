import { assertEquals } from "@std/assert";
import { NIHProjectQuery } from "../lib/index.ts";

const query = new NIHProjectQuery();
const personIds = [
  1857551,
  1857677,
  1857698,
  1857725,
  1857758,
  1857771,
  1857796,
  1857848,
  1857855,
  1857861,
  1857911,
  1857928,
  1857967,
  1858029,
  1858036,
  1858208,
  1863907,
  1864058,
  1864073,
  1864084,
  1864100,
  1864105,
  1864106,
  1864115,
  1864119,
  1864135,
  1864173,
  1864193,
  1864200,
  1864233,
  1864273,
  1864297,
  1860244,
  1860262,
  1860326,
  1860351,
  1860395,
  1860397,
  1860480,
  1860503,
  1860547,
  1860588,
  1860593,
  1860668,
  1860691,
  1860700,
  1860709,
  1860729,
];
const projects = await query
  .setPIProfileIds(personIds)
  .setFiscalYears([2020, 2021, 2022, 2023, 2024, 2025]).setSortOrder("asc")
  .setUseRelevance(true)
  .setExcludeFields(["PrefTerms", "Terms", "AbstractText"]).setSortField("ApplId").setSortOrder("asc")
  .execute();

Deno.test("Award count", () => {
  assertEquals(projects.length, 50);
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
  assertEquals(result.value?.applId, 9820709);
  result = await iter.next();
  assertEquals(result.done, false);
  assertEquals(result.value?.applId, 9828632);
});

Deno.test("Iterator safe test", async () => {
  const iterSafe = query.safeIterator();
  let { value, done } = await iterSafe.next();
  assertEquals(done, false);
  let [result, _err] = value;
  assertEquals(result?.applId, 9820709);
  ({ value, done } = await iterSafe.next());
  assertEquals(done, false);
  [result, _err] = value;
  assertEquals(result?.applId, 9828632);
});

Deno.test("Totally consumed iterator", async () => {
  const iter = query.iterator();
  for await (const _ of iter) {
    // no-op
  }
  const { value, done } = await iter.next();
  assertEquals(done, true);
  assertEquals(value, undefined);
});

Deno.test("Totally consumed safe iterator", async () => {
  const iterSafe = query.safeIterator();
  for await (const _ of iterSafe) {
    // no-op
  }
  const { value, done } = await iterSafe.next();
  assertEquals(done, true);
  assertEquals(value, undefined);
});
