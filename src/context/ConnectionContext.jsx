import {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { setBaseURL } from "../utils/axiosConfig";
import { persistHelper } from "../helper/hostHelper";
import { electronAPI } from "../tauri-shim";

const ConnectionContext = createContext(null);

export const ConnectionProvider = ({ children }) => {
  const navigate = useNavigate();

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(null);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("recentSessions") || "[]");
    const norm = saved.map((s) => ({
      host: s.host,
      port: s.port,
      online: typeof s.online !== "undefined" ? s.online : undefined,
      lastChecked: s.lastChecked || null,
      status: s.status || "idle",
    }));
    setSessions(norm);
  }, []);

  useEffect(() => {
    const handler = (data) => {
      console.log("Received ping:status event:", data);
      setSessions((prev) => {
        const next = prev.map((s) => {
          const sPort = Number(s.port);
          const dataPort = Number(data.port);

          if (s.host === data.host && sPort === dataPort) {
            console.log(
              `Updating session ${s.host}:${sPort} - online: ${data.online}`
            );

            try {
              const stored = JSON.parse(
                localStorage.getItem("activeHost") || "{}"
              );

              if (stored.host) {
                localStorage.setItem(
                  "activeHost",
                  JSON.stringify({
                    ...stored,
                    status: data.online ? "online" : "offline",
                  })
                );
              }
            } catch {}

            return {
              ...s,
              online: data.online,
              lastChecked: data.timestamp,
              status: data.online ? "online" : "offline",
            };
          }
          return s;
        });

        persistHelper(next);
        return next;
      });

      if (
        data.online &&
        activeSession &&
        activeSession.host === data.host &&
        Number(activeSession.port) === Number(data.port)
      ) {
        console.log("Navigating to settings page");
        setShouldNavigate({
          host: data.host,
          port: data.port,
        });
      }
    };

    console.log("Registering ping:status listener");
    electronAPI.ipcRenderer.on("ping:status", handler);
    return () => {
      console.log("Removing ping:status listener");
      electronAPI.ipcRenderer.removeListener("ping:status", handler);
    };
  }, [activeSession]);

  useEffect(() => {
    if (!shouldNavigate) return;

    const { host, port } = shouldNavigate;
    const url = `http://${host}:${port}`;

    try {
      setBaseURL(url);
    } catch {
      localStorage.setItem("apiBase", url);
    }

    navigate("/setting", {
      replace: true,
      state: { host, port },
    });

    setShouldNavigate(null);
  }, [shouldNavigate, navigate]);

  const deleteHost = (host, port) => {
    if (activeSession?.host === host && activeSession?.port === port) {
      stopCurrentActive();
    }

    setSessions((prev) => {
      const updated = prev.filter((s) => !(s.host === host && s.port === port));
      persistHelper(updated);
      return updated;
    });
  };

  const stopCurrentActive = () => {
    if (!activeSession) return;
    try {
      electronAPI.ipcRenderer.send("ping:stop", {
        host: activeSession.host,
        port: activeSession.port,
      });
    } catch (e) {
      console.error("Failed to request ping:stop for previous", e);
    }

    setSessions((prev) => {
      const next = prev.map((s) => ({ ...s, status: "idle" }));
      persistHelper(next);
      return next;
    });

    try {
      localStorage.removeItem("activeHost");
      try {
        setBaseURL("");
      } catch (e) {
        localStorage.removeItem("apiBase");
      }
    } catch (e) {
      // ignore (e.g., not in browser env during SSR)
    }

    setActiveSession(null);
  };

  const handleConnect = async (session) => {
    const existing = sessions.find(
      (s) => s.host === session.host && s.port === session.port
    );

    if (existing && existing.status === "disabled") return;

    if (
      activeSession &&
      activeSession.host === session.host &&
      activeSession.port === session.port
    ) {
      stopCurrentActive();
      setShowModal(false);
      return;
    }

    const moved = [
      { ...session, status: "checking", online: undefined },
      ...sessions.filter(
        (s) => s.host !== session.host || s.port !== session.port
      ),
    ];
    const disabledOthers = moved.map((s) =>
      s.host === session.host && s.port === session.port
        ? s
        : { ...s, status: "disabled" }
    );

    setSessions(disabledOthers);
    persistHelper(disabledOthers);

    setShowModal(false);
    try {
      console.log("Calling ping:start for:", session.host, session.port);
      await electronAPI.ipcRenderer.send("ping:start", {
        host: session.host,
        port: session.port,
      });
      console.log("ping:start succeeded");
      setActiveSession({ host: session.host, port: session.port });
      try {
        localStorage.setItem(
          "activeHost",
          JSON.stringify({ host: session.host, port: session.port })
        );
      } catch (e) {
        // ignore (e.g., not in browser env during SSR)
      }
    } catch (e) {
      console.error("Failed to request ping:start", e);
    }
  };

  return (
    <ConnectionContext.Provider
      value={{
        sessions,
        activeSession,

        showModal,
        setShowModal,

        handleConnect,
        deleteHost,
        stopCurrentActive,
      }}
    >
      {children}
    </ConnectionContext.Provider>
  );
};

export const useConnection = () => {
  const ctx = useContext(ConnectionContext);
  if (!ctx) throw new Error("useConnection must be inside ConnectionProvider");
  return ctx;
};
