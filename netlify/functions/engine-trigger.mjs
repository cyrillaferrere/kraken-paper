/**
 * Déclencheur horaire du moteur Kraken Paper.
 *
 * Chaque heure (minute 9 UTC, légèrement après le cron GitHub de la minute 7),
 * cette fonction demande à GitHub de lancer le workflow engine.yml sur main.
 * Le cron GitHub reste en secours. Le moteur est idempotent (rejeu des bougies
 * déjà traitées ignoré, décisions déjà appliquées ignorées), et le workflow a
 * un groupe de concurrence kraken-paper-engine (cancel-in-progress: false) :
 * un second déclenchement n'exécute pas deux cycles en parallèle et ne compte
 * jamais une bougie deux fois.
 *
 * Netlify n'exécute les fonctions planifiées que sur le déploiement de
 * production publié. Un déploiement préprod / alias sert à vérifier que la
 * fonction est bien listée, pas à la faire tourner.
 *
 * Ne jamais journaliser GITHUB_DISPATCH_TOKEN ni l'en-tête Authorization.
 */
export const config = { schedule: "9 * * * *" };

export const REPO = "cyrillaferrere/kraken-paper";
export const WORKFLOW = "engine.yml";
export const REF = "main";

export function githubHeaders(token) {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "kraken-paper-engine-trigger",
  };
}

export async function hasActiveEngineRun(fetchImpl, token) {
  const headers = githubHeaders(token);
  for (const status of ["in_progress", "queued"]) {
    const url = `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/runs?status=${status}&per_page=1`;
    const res = await fetchImpl(url, { headers });
    if (!res.ok) {
      return { checked: false, active: false, status: res.status };
    }
    const data = await res.json();
    const count = Number(data.total_count) || (data.workflow_runs || []).length;
    if (count > 0) {
      return { checked: true, active: true, status: res.status };
    }
  }
  return { checked: true, active: false, status: 200 };
}

export async function dispatchEngine(fetchImpl, token) {
  const url = `https://api.github.com/repos/${REPO}/actions/workflows/${WORKFLOW}/dispatches`;
  const res = await fetchImpl(url, {
    method: "POST",
    headers: { ...githubHeaders(token), "Content-Type": "application/json" },
    body: JSON.stringify({ ref: REF }),
  });
  return { status: res.status };
}

export async function runTrigger(fetchImpl, env, log = console) {
  const token = env && env.GITHUB_DISPATCH_TOKEN;
  if (!token) {
    log.error("GITHUB_DISPATCH_TOKEN manquant");
    return { statusCode: 500, body: "missing GITHUB_DISPATCH_TOKEN" };
  }

  const check = await hasActiveEngineRun(fetchImpl, token);
  if (check.active) {
    log.log("skip: un cycle engine est déjà in_progress ou queued");
    return { statusCode: 200, body: "skipped: already running" };
  }
  if (!check.checked) {
    log.log(`controle des runs HTTP ${check.status}, dispatch quand même`);
  }

  const { status } = await dispatchEngine(fetchImpl, token);
  log.log(`dispatch HTTP ${status}`);
  if (status === 204) {
    return { statusCode: 200, body: "dispatch 204" };
  }
  return { statusCode: status >= 400 ? status : 200, body: `dispatch ${status}` };
}

export async function handler() {
  return runTrigger(fetch, process.env, console);
}

export default async function engineTrigger() {
  const result = await handler();
  return new Response(result.body, { status: result.statusCode });
}
