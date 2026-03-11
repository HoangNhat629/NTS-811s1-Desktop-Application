import { electronAPI } from "../tauri-shim";

export const disconnectHostHelper = () => {
  try {
    const raw = localStorage.getItem("activeHost");
    if (raw) {
      const a = JSON.parse(raw);
      try {
        electronAPI.ipcRenderer.send("ping:stop", {
          host: a.host,
          port: a.port,
        });
      } catch (e) {}
      try {
        const rsRaw = localStorage.getItem("recentSessions") || "[]";
        const arr = JSON.parse(rsRaw);
        const next = arr.map((s) => {
          if (s.host === a.host && s.port === a.port) {
            return {
              ...s,
              status: "idle",
              online: undefined,
            };
          }
          return { ...s, status: "idle" };
        });
        localStorage.setItem("recentSessions", JSON.stringify(next));
      } catch (e) {}
    }
    try {
      setBaseURL("");
    } catch (e) {}
    localStorage.removeItem("activeHost");
  } catch (e) {}
};

export const persistHelper = (arr) => {
  localStorage.setItem("recentSessions", JSON.stringify(arr));
};