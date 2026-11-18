/* Détection des sessions Grok depuis décisions/heartbeat, sans état simulé. */
const test = require("node:test");
const assert = require("node:assert/strict");
const L = require("../../site/lib.js");

test("heartbeat le plus récent actualise la dernière session et ajoute exactement cinq heures", () => {
  const old = { id:"D1", timestamp:"2026-11-17T22:09:00+01:00", rationale:"ancienne décision", actions:[] };
  const beat = { id:"heartbeat-20261118-030900", type:"heartbeat", timestamp:"2026-11-18T03:09:00+01:00", note:"RAS", actions:[] };
  const latest = L.latestSession([old,beat],old);
  assert.equal(latest.id, beat.id);
  assert.equal(latest.kind,"heartbeat");
  const now = Date.parse("2026-11-18T07:54:00+01:00");
  const next = L.nextSession(latest.ms, now);
  assert.equal(next.at, Date.parse("2026-11-18T08:09:00+01:00"));
  assert.equal(next.overdue,false);
  assert.equal(next.inMs, 15*60*1000);
});

test("sans heartbeat, pas de fausse session déduite de l'heure du cycle", () => {
  const decision = { id:"D1", timestamp:"2026-11-17T22:09:00+01:00" };
  const latest = L.latestSession([],decision);
  assert.equal(latest.id,"D1");
  assert.equal(latest.kind,"decision");
  assert.equal(L.latestSession([],null),null);
});

test("plus ancien heartbeat n'écrase pas une décision récente", () => {
  const beat={id:"HB",type:"heartbeat",timestamp:"2026-11-17T22:09:00+01:00",note:"RAS",actions:[]};
  const decision={id:"D2",timestamp:"2026-11-18T03:09:00+01:00",actions:[]};
  assert.equal(L.latestSession([beat,decision],beat).id,"D2");
});

test("heartbeat malformé ou sans date valide ignoré pour le calendrier", () => {
  const malformed={id:"HB",type:"heartbeat",timestamp:"2026-11-18T03:09:00+01:00",actions:[{type:"market_buy"}],note:"RAS"};
  assert.equal(L.latestSession([malformed],null),null);
  assert.equal(L.latestSession([{id:"X",timestamp:"n'importe quoi"}],null),null);
});
