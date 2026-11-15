const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const workflow = fs.readFileSync(path.join(__dirname, "../../.github/workflows/deploy-production-controlled.yml"), "utf8");

test("production workflow is triggered only by a targeted request push", () => {
  assert.match(workflow, /^on:\s*\n\s*push:\s*\n\s*branches:\s*\[deploy\/prod-request\]\s*\n\s*paths:\s*\[\.github\/prod-release-request\.json\]/m);
  assert.doesNotMatch(workflow, /^\s*workflow_dispatch\s*:/m);
  assert.doesNotMatch(workflow, /^\s*pull_request\s*:/m);
});

test("production workflow keeps environment, approved SHA, tests and post-deploy verification", () => {
  assert.match(workflow, /^\s*environment: production\s*$/m);
  assert.match(workflow, /secrets\.NETLIFY_AUTH_TOKEN/);
  assert.match(workflow, /APPROVED_SHA/);
  assert.match(workflow, /RELEASE_VERSION/);
  assert.match(workflow, /python3 -m unittest -q/);
  assert.match(workflow, /node --test tests\/site\/\*\.test\.js/);
  assert.match(workflow, /version\.json/);
});
