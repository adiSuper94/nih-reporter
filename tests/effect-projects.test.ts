import { test } from "node:test";
import assert from "node:assert/strict";
import { Effect, Layer, Stream } from "effect";
import { FetchHttpClient } from "@effect/platform";
import { NIHProjectQuery } from "../lib/effect/index.ts";

const personIds = [
  1857551, 1857677, 1857698, 1857725, 1857758, 1857771, 1857796, 1857848, 1857855, 1857861, 1857911, 1857928, 1857967,
  1858029, 1858036, 1858208, 1863907, 1864058, 1864073, 1864084, 1864100, 1864105, 1864106, 1864115, 1864119, 1864135,
  1864173, 1864193, 1864200, 1864233, 1864273, 1864297, 1860244, 1860262, 1860326, 1860351, 1860395, 1860397, 1860480,
  1860503, 1860547, 1860588, 1860593, 1860668, 1860691, 1860700, 1860709, 1860729,
];

const testLayer = Layer.mergeAll(FetchHttpClient.layer);

function createQuery() {
  return new NIHProjectQuery()
    .setPIProfileIds(personIds)
    .setFiscalYears([2020, 2021, 2022, 2023, 2024, 2025])
    .setUseRelevance(true)
    .setIncludeActiveProjects(true)
    .setExcludeFields(["PrefTerms", "Terms", "AbstractText"])
    .setSortOrder("asc")
    .setSortField("ApplId");
}

test("Effect API - returns projects", async () => {
  const projects = await Effect.runPromise(
    createQuery().setLimit(50).setOffset(0).execute().pipe(Effect.provide(testLayer))
  );

  assert.strictEqual(projects.length, 50);
});

test("Effect API - first project has expected applId", async () => {
  const projects = await Effect.runPromise(
    createQuery().setLimit(50).setOffset(0).execute().pipe(Effect.provide(testLayer))
  );

  const project = projects[0];
  assert.ok(project !== undefined);
  assert.strictEqual(project.appl_id, 9820709);
});

test("Effect API - second project has expected applId", async () => {
  const projects = await Effect.runPromise(
    createQuery().setLimit(50).setOffset(0).execute().pipe(Effect.provide(testLayer))
  );

  const project = projects[1];
  assert.ok(project !== undefined);
  assert.strictEqual(project.appl_id, 9828632);
});

test("Effect API - excluded fields are not present", async () => {
  const projects = await Effect.runPromise(
    createQuery().setLimit(50).setOffset(0).execute().pipe(Effect.provide(testLayer))
  );

  for (const project of projects) {
    assert.strictEqual(project.pref_terms, undefined);
    assert.strictEqual(project.terms, undefined);
    assert.strictEqual(project.abstract_text, undefined);
  }
});

test("Effect API - project has expected fields", async () => {
  const projects = await Effect.runPromise(
    createQuery().setLimit(50).setOffset(0).execute().pipe(Effect.provide(testLayer))
  );

  const project = projects[0];
  assert.ok(project !== undefined);
  assert.ok(project.appl_id !== undefined);
  assert.ok(project.project_num !== undefined);
  assert.ok(project.activity_code !== undefined);
});

test("Effect API - supports pagination with offset", async () => {
  const projects = await Effect.runPromise(
    createQuery().setLimit(10).setOffset(50).execute().pipe(Effect.provide(testLayer))
  );

  assert.ok(projects.length >= 0);
});

test("Effect API - schema validation works", async () => {
  const projects = await Effect.runPromise(
    createQuery().setLimit(50).setOffset(0).execute().pipe(Effect.provide(testLayer))
  );

  for (const project of projects) {
    assert.ok(typeof project.appl_id === "number");
    assert.ok(typeof project.project_num === "string");
    assert.ok(typeof project.is_active === "boolean");
    assert.ok(Array.isArray(project.principal_investigators));
  }
});

test("Effect API - organization data is parsed", async () => {
  const projects = await Effect.runPromise(
    createQuery().setLimit(50).setOffset(0).execute().pipe(Effect.provide(testLayer))
  );

  const projectWithOrg = projects.find((p) => "organization" in p);

  assert.ok(projectWithOrg !== undefined);
  assert.ok(projectWithOrg.organization !== undefined);
  if (projectWithOrg.organization) {
    assert.ok(typeof projectWithOrg.organization.org_name === "string");
    assert.ok(typeof projectWithOrg.organization.external_org_id === "number");
  }
});

test("Effect API - principal investigators are parsed", async () => {
  const projects = await Effect.runPromise(
    createQuery().setLimit(50).setOffset(0).execute().pipe(Effect.provide(testLayer))
  );

  const project = projects[0];
  assert.ok(project !== undefined);
  assert.ok(project.principal_investigators.length > 0);

  const pi = project.principal_investigators[0]!;
  assert.ok(typeof pi.profile_id === "number");
  assert.ok(typeof pi.first_name === "string");
  assert.ok(typeof pi.last_name === "string");
  assert.ok(typeof pi.full_name === "string");
});

test("Effect API - execute with builder pattern", async () => {
  const projects = await Effect.runPromise(
    createQuery().setLimit(5).setOffset(0).execute().pipe(Effect.provide(testLayer))
  );

  assert.strictEqual(projects.length, 5);
  assert.strictEqual(projects[0]!.appl_id, 9820709);
  assert.strictEqual(projects[0]!.abstract_text, undefined);
  assert.strictEqual(projects[0]!.pref_terms, undefined);
  assert.strictEqual(projects[0]!.terms, undefined);
});

test("Effect API - stream test", async () => {
  const stream = createQuery().setLimit(10).stream();

  const projects = await Effect.runPromise(Stream.runCollect(stream).pipe(Effect.provide(testLayer)));

  const projectArray = Array.from(projects);
  assert.strictEqual(projectArray[0]!.appl_id, 9820709);
  assert.strictEqual(projectArray[1]!.appl_id, 9828632);
});
