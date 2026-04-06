import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import { setBaseURL } from "../utils/axiosConfig";
import { persistHelper } from "../helper/hostHelper";
import { electronAPI } from "../tauri-shim";

const ConnectionContext = createContext(null);

export const ConnectionProvider = ({ children }) => {
  const navigate = useNavigate();

  const lastOnlineRef = useRef(new Map());
  const activeSessionRef = useRef(null);

  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(null);

  useEffect(() => {
    activeSessionRef.current = activeSession;
  }, [activeSession]);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem("recentSessions") || "[]");

      setSessions(
        saved.map((s) => ({
          host: s.host,
          port: s.port,
          online: s.online,
          lastChecked: s.lastChecked || null,
          status: s.status || "idle",
        }))
      );
    } catch {}

    try {
      const active = JSON.parse(localStorage.getItem("activeHost") || "null");

      if (active?.host) {
        setActiveSession(active);
      }
    } catch {}
  }, []);

  useEffect(() => {
    const handler = (data) => {
      const key = `${data.host}:${data.port}`;
      const wasOnline = lastOnlineRef.current.get(key);
      const isOnline = data.online;

      lastOnlineRef.current.set(key, isOnline);

      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.host === data.host && Number(s.port) === Number(data.port)) {
            return {
              ...s,
              online: isOnline,
              lastChecked: data.timestamp,
              status: isOnline ? "online" : "offline",
            };
          }
          return s;
        });

        persistHelper(next);
        return next;
      });

      try {
        const stored = JSON.parse(localStorage.getItem("activeHost") || "null");

        if (
          stored &&
          stored.host === data.host &&
          Number(stored.port) === Number(data.port)
        ) {
          localStorage.setItem(
            "activeHost",
            JSON.stringify({
              ...stored,
              status: isOnline ? "online" : "offline",
            })
          );
        }
      } catch {}

      const active = activeSessionRef.current;
      if (!active) return;

      const isActive =
        active.host === data.host && Number(active.port) === Number(data.port);

      if (!isActive) return;

      if (isOnline && !wasOnline) {
        setShouldNavigate({
          host: data.host,
          port: data.port,
        });
      }
    };

    electronAPI?.ipcRenderer?.on("ping:status", handler);
    return () =>
      electronAPI?.ipcRenderer?.removeListener("ping:status", handler);
  }, []);

  useEffect(() => {
    if (!shouldNavigate) return;

    const { host, port } = shouldNavigate;
    const url = `http://${host}:${port}`;

    setBaseURL?.(url);
    localStorage.setItem("apiBase", url);

    navigate("/setting", {
      replace: true,
      state: { host, port },
    });

    setShouldNavigate(null);
  }, [shouldNavigate, navigate]);

  const stopCurrentActive = useCallback(() => {
    const active = activeSessionRef.current;
    if (!active) return;

    electronAPI?.ipcRenderer?.send("ping:stop", active);

    setSessions((prev) => {
      const next = prev.map((s) => ({
        ...s,
        status: "idle",
        online: undefined,
      }));
      persistHelper(next);
      return next;
    });

    lastOnlineRef.current.clear();

    localStorage.removeItem("activeHost");
    localStorage.removeItem("apiBase");

    setBaseURL?.("");
    setActiveSession(null);
  }, []);

  const deleteHost = useCallback(
    (host, port) => {
      const active = activeSessionRef.current;

      if (active?.host === host && active?.port === port) {
        stopCurrentActive();
      }

      setSessions((prev) => {
        const updated = prev.filter(
          (s) => !(s.host === host && s.port === port)
        );
        persistHelper(updated);
        return updated;
      });
    },
    [stopCurrentActive]
  );

  const handleConnect = useCallback(
    async (session) => {
      const active = activeSessionRef.current;

      if (
        active &&
        active.host === session.host &&
        active.port === session.port
      ) {
        stopCurrentActive();
        setShowModal(false);
        return;
      }

      const checkingSession = {
        ...session,
        status: "checking",
        online: undefined,
      };

      const next = [
        checkingSession,
        ...sessions.filter(
          (s) => s.host !== session.host || s.port !== session.port
        ),
      ].map((s) =>
        s.host === session.host && s.port === session.port
          ? s
          : { ...s, status: "disabled" }
      );

      setSessions(next);
      persistHelper(next);
      setShowModal(false);

      try {
        electronAPI?.ipcRenderer?.send("ping:start", session);

        setActiveSession(session);

        localStorage.setItem(
          "activeHost",
          JSON.stringify({
            ...session,
            status: "checking",
          })
        );
      } catch (e) {
        console.error("ping:start failed", e);
      }
    },
    [sessions, stopCurrentActive]
  );

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
