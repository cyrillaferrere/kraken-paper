const test = require('node:test');
const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const path = require('node:path');

const script = path.join(__dirname, '../../scripts/netlify-ignore-build.sh');
function check(context, branch) {
  const env = { PATH: process.env.PATH, CONTEXT: context, BRANCH: branch };
  return spawnSync('sh', [script], { env, encoding: 'utf8' });
}

test('production Git build is skipped', () => {
  const result = check('production', 'main');
  assert.equal(result.status, 0, result.stderr);
});
test('main is skipped even with unexpected context', () => {
  const result = check('branch-deploy', 'main');
  assert.equal(result.status, 0, result.stderr);
});
test('deploy-preview remains enabled', () => {
  const result = check('deploy-preview', 'feature/test');
  assert.equal(result.status, 1, result.stderr);
});
test('preprod without comparison SHAs still builds', () => {
  const result = check('branch-deploy', 'preprod');
  assert.equal(result.status, 1, result.stderr);
});
