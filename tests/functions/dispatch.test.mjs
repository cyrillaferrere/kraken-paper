// Tests de la fonction planifiée Netlify (déclenchement du workflow engine),
// sans réseau : node --test tests/functions/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import {
  REPO, WORKFLOW, REF, runTrigger,
} from "../../netlify/functions/engine-trigger.mjs";

const SECRET = "TEST_SECRET_VALUE_NEVER_LOG";

function jsonResponse(status, body) {
  return {
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
    text: async () => JSON.stringify(body),
  };
}

function logger() {
  const lines = [];
  return {
    lines,
    log: (...a) => lines.push(a.map(String).join(" ")),
    error: (...a) => lines.push(a.map(String).join(" ")),
  };
}

function assertNoSecret(lines) {
  const all = lines.join("\n");
  assert.ok(!all.includes(SECRET), "le jeton ne doit jamais apparaître dans les logs");
  assert.ok(!all.includes("Bearer "), "l'en-tête Authorization ne doit pas être loggé");
}

test("refuse sans jeton et n'appelle pas fetch", async () => {
  const log = logger();
  let called = false;
  const res = await runTrigger(async () => { called = true; throw new Error("inattendu"); }, {}, log);
  assert.equal(res.statusCode, 500);
  assert.match(res.body, /missing GITHUB_DISPATCH_TOKEN/);
  assert.equal(called, false);
  assert.ok(log.lines.some((l) => l.includes("manquant")));
});

test("skip si un run est déjà in_progress", async () => {
  const log = logger();
  const calls = [];
  const fetchImpl = async (url, opts) => {
    calls.push({ url, method: (opts && opts.method) || "GET" });
    if (String(url).includes("status=in_progress")) {
      return jsonResponse(200, { total_count: 1, workflow_runs: [{ id: 42, status: "in_progress" }] });
    }
    throw new Error("dispatch ne doit pas être appelé");
  };
  const res = await runTrigger(fetchImpl, { GITHUB_DISPATCH_TOKEN: SECRET }, log);
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /skipped: already running/);
  assert.ok(calls.every((c) => c.method === "GET"));
  assert.ok(log.lines.some((l) => l.includes("déjà in_progress") || l.includes("skip:")));
  assertNoSecret(log.lines);
});

test("skip si un run est déjà queued (pas in_progress)", async () => {
  const log = logger();
  const fetchImpl = async (url, opts) => {
    if (String(url).includes("status=in_progress")) {
      return jsonResponse(200, { total_count: 0, workflow_runs: [] });
    }
    if (String(url).includes("status=queued")) {
      return jsonResponse(200, { total_count: 1, workflow_runs: [{ id: 7, status: "queued" }] });
    }
    throw new Error(`inattendu: ${opts && opts.method} ${url}`);
  };
  const res = await runTrigger(fetchImpl, { GITHUB_DISPATCH_TOKEN: SECRET }, log);
  assert.equal(res.statusCode, 200);
  assert.match(res.body, /skipped/);
  assertNoSecret(log.lines);
});

test("dispatch 204 en succès, ref main, bon dépôt / workflow", async () => {
  const log = logger();
  let posted = null;
  const fetchImpl = async (url, opts) => {
    if (String(url).includes("/runs")) {
      return jsonResponse(200, { total_count: 0, workflow_runs: [] });
    }
    posted = { url, method: opts.method, body: JSON.parse(opts.body), auth: opts.headers.Authorization };
    assert.equal(opts.headers.Accept, "application/vnd.github+json");
    return { ok: true, status: 204, json: async () => ({}), text: async () => "" };
  };
  const res = await runTrigger(fetchImpl, { GITHUB_DISPATCH_TOKEN: SECRET }, log);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body, "dispatch 204");
  assert.equal(posted.method, "POST");
  assert.equal(posted.body.ref, REF);
  assert.equal(REF, "main");
  assert.ok(posted.url.includes(`/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`));
  assert.equal(posted.auth, `Bearer ${SECRET}`);
  assert.ok(log.lines.some((l) => l === "dispatch HTTP 204"));
  assertNoSecret(log.lines);
});

test("propage une erreur GitHub sans logger le jeton", async () => {
  const log = logger();
  const fetchImpl = async (url) => {
    if (String(url).includes("/runs")) {
      return jsonResponse(200, { total_count: 0, workflow_runs: [] });
    }
    return { ok: false, status: 403, json: async () => ({ message: "Forbidden" }), text: async () => "Forbidden" };
  };
  const res = await runTrigger(fetchImpl, { GITHUB_DISPATCH_TOKEN: SECRET }, log);
  assert.equal(res.statusCode, 403);
  assert.equal(res.body, "dispatch 403");
  assert.ok(log.lines.some((l) => l === "dispatch HTTP 403"));
  assertNoSecret(log.lines);
});

test("si le contrôle des runs échoue, on dispatch quand même", async () => {
  const log = logger();
  let posted = false;
  const fetchImpl = async (url, opts) => {
    if (String(url).includes("/runs")) {
      return { ok: false, status: 502, json: async () => ({}), text: async () => "" };
    }
    posted = opts.method === "POST";
    return { ok: true, status: 204, json: async () => ({}), text: async () => "" };
  };
  const res = await runTrigger(fetchImpl, { GITHUB_DISPATCH_TOKEN: SECRET }, log);
  assert.equal(posted, true);
  assert.equal(res.statusCode, 200);
  assert.ok(log.lines.some((l) => l.includes("controle des runs HTTP 502")));
  assertNoSecret(log.lines);
});
