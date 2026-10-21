// Hash router แบบเรียบง่าย: #/path/:param?query=1
const routes = [];

export function route(path, handler) {
  const keys = [];
  const re = new RegExp('^' + path.replace(/:[^/]+/g, (m) => { keys.push(m.slice(1)); return '([^/]+)'; }) + '$');
  routes.push({ re, keys, handler });
}

export function currentLocation() {
  const raw = location.hash.slice(1) || '/';
  const [path, qs] = raw.split('?');
  return { path: path || '/', query: Object.fromEntries(new URLSearchParams(qs || '')) };
}

export function resolveRoute() {
  const { path, query } = currentLocation();
  for (const r of routes) {
    const m = path.match(r.re);
    if (m) {
      const params = {};
      r.keys.forEach((k, i) => (params[k] = decodeURIComponent(m[i + 1])));
      return { handler: r.handler, params, query, path };
    }
  }
  return { handler: null, params: {}, query, path };
}

export const navigate = (hash) => { location.hash = hash; };
