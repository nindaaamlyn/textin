/* What the app knows: the server's configuration, who is signed in, and the test in progress.
   The account and the history live on the server. The test in progress and the last result are
   kept in this browser (localStorage) so a reload does not lose them. */
const KEY = "texin-v1";

export let CONFIG = null;
export const setConfig = (config) => {
  CONFIG = config;
};

const blank = () => ({
  user: null,
  owner: null, // id of the account the test below belongs to
  plan: 0,
  answers: {},
  pos: 0,
  result: null,
  feedbackSent: false,
});
export let S = blank();
try {
  S = Object.assign(blank(), JSON.parse(localStorage.getItem(KEY) || "{}"));
  delete S.history; // kept in the browser by an earlier version; now on the server
} catch (e) {
  /* private window */
}
export const save = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(S));
  } catch (e) {
    /* not available */
  }
};

/** Who the server says is signed in ({id, name, email} or null). A test in progress belongs to
    whoever started it, so it is dropped when someone else signs in on this browser. */
export function setUser(user) {
  if (!user || S.owner !== user.id) S = blank();
  S.user = user;
  S.owner = user ? user.id : null;
  save();
}

/** The login ended without the student signing out. The test stays here for when its owner
    signs in again; anyone else signing in starts clean. */
export function sessionExpired() {
  S.user = null;
  save();
}

export function clearTest() {
  S.answers = {};
  S.pos = 0;
  S.result = null;
  S.feedbackSent = false;
  save();
}

export const NEEDS_RESULT = ["hasil", "karier", "jaringan", "feedback"];
export const answered = () => Object.keys(S.answers).length;
export const total = () => CONFIG.items.length;
export const hasResult = () =>
  Boolean(S.result && S.result.cards && S.result.cards.length);
export const typeLabel = (type) => {
  const t = CONFIG.types.find((x) => x.type === type);
  return `${t.label} (${t.nickname})`;
};
