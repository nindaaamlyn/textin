/* Keeps this browser and the student's account in step: who is signed in, the test they are in
   the middle of, and their latest result. The browser copy makes the pages fast and survives a
   reload; the server copy follows the account to any device and wins when the two disagree. */
import { S, save, setUser, sessionExpired, answered, total } from "./state.js";
import { api } from "./api.js";

const count = (answers) => Object.keys(answers).length;

/** Take over what the server knows. Called on page load and right after signing in. */
export function applyState(state) {
  if (!state.user) {
    // signed out on the server (expired, or signed out elsewhere): keep the test for its owner
    if (S.user) sessionExpired();
    return;
  }
  setUser(state.user);
  const progress = state.progress;
  const latest = state.result;
  if (progress && (S.result || count(progress.answers) >= answered())) {
    // a test is under way on the server, at least as far along as the one here
    S.answers = progress.answers;
    S.pos = progress.pos;
    S.plan = progress.plan;
    S.result = null;
  } else if (progress) {
    pushProgress(0); // this browser is further along: tell the server
  } else if (answered() === total() && !S.result) {
    // all answered, waiting on the summary page: nothing to take over
  } else {
    // no test under way on the server, so one half done here was finished or restarted elsewhere
    const sameResult =
      S.result && latest && S.result.result_id === latest.result_id;
    if (!sameResult) S.answers = {};
    if (!sameResult) S.pos = 0;
    S.result = latest;
    S.feedbackSent = Boolean(latest && latest.feedback_given);
  }
  save();
}

export const loadState = async () => applyState(await api("/api/state"));

let timer = null;

/** Send the test in progress to the server: at most once per `delay`, and always the latest state. */
export function pushProgress(delay = 700) {
  if (!S.user) return;
  if (delay === 0) clearTimeout(timer);
  else if (timer) return; // one is already on its way
  timer = setTimeout(() => {
    timer = null;
    if (!S.user) return;
    api(
      "/api/progress",
      { answers: S.answers, pos: S.pos, plan: S.plan },
      "PUT",
    ).catch(() => {}); // the browser copy still holds it; the next change tries again
  }, delay);
}

/** The test is finished: nothing more to send. */
export const stopProgress = () => {
  clearTimeout(timer);
  timer = null;
};
