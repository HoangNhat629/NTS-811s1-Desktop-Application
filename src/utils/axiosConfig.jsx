export const config = {
  headers: {
    Accept: "application/json",
  },
};

export let baseURL = "";

try {
  const stored = localStorage.getItem("apiBase");
  if (stored) baseURL = stored;
} catch (e) {
  // ignore (e.g., not in browser env during SSR)
}

export function setBaseURL(url) {
  baseURL = url;
  try {
    localStorage.setItem("apiBase", url);
  } catch (e) {
  // ignore (e.g., not in browser env during SSR)
  }
}
