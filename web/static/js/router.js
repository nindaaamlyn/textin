/* Hash routes: "#/hasil", "#/karier/15-2051.00". main.js registers the function that draws the page. */
let draw = () => {};
export const onRender = (fn) => {
  draw = fn;
};
export const render = () => draw();
/** `replace` keeps the current page out of the Back history (used for pages that only pass through). */
export const go = (route, replace = false) => {
  if (replace) return location.replace("#/" + route);
  location.hash = "#/" + route;
};
export const currentRoute = () => location.hash.replace(/^#\/?/, "").split("/");
