import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { setBaseURL } from "../../utils/axiosConfig";
import { NewSessionModal } from "../../component/NewSessionModal";
import AllSessionsModal from "../../component/AllSessionsModal";
import Viettel_logo from "../../assets/Images/viettel_logo_1.png";
import { CustomOclock } from "../../component/CustomOclock";
import { persistHelper } from "../../helper/hostHelper";
import { MdDeleteOutline, MdLogout } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useOutletDisable } from "../../context/OutletDisableContext";
import { electronAPI } from "../../tauri-shim";

export default function WelcomePage() {
  const [showModal, setShowModal] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [showAllModal, setShowAllModal] = useState(false);
  const [shouldNavigate, setShouldNavigate] = useState(null);

  const navigate = useNavigate();
  const { t } = useTranslation();
  const { disableOutlets } = useOutletDisable();

  const handleLogout = () => {
    if (activeSession) {
      stopCurrentActive();
    }

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
      }
      try {
        setBaseURL("");
      } catch (e) {}
    } catch (e) {}

    disableOutlets();
    const keys = ["outletDisableState", "token_access", "apiBase"];
    keys.forEach(localStorage.removeItem.bind(localStorage));
    navigate("/");
  };

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

  const handleQuickStart = () => {
    if (activeSession) {
      stopCurrentActive();
    }

    const host = "0.0.0.0";
    const port = 3000;

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
  };

  return (
    <div className="connection-root">
      <div className="connection-column">
        <h2>{t("start")}</h2>
        <div className="d-flex flex-column">
          <button
            className="link-btn"
            onClick={() => {
              if (activeSession) {
                stopCurrentActive();
              }
              setShowModal(true);
            }}
          >
            {t("New_Session")}
          </button>
          <button className="link-btn" onClick={handleQuickStart}>
            {t("Quick_Start")}
          </button>
          <button className="link-btn" onClick={handleLogout}>
            <MdLogout style={{ fontSize: "16px" }} />
            {t("logout")}
          </button>
        </div>
      </div>
      <div className="connection-column">
        <h2> {t("Recent")}</h2>
        {sessions.length === 0 && (
          <p className="muted">{t("no_recent_sessions")}</p>
        )}

        {(() => {
          const list = sessions.slice(0, 5);
          return list.map((s, i) => (
            <div
              key={i}
              className="recent-item-wrapper d-flex justify-content-between align-items-center gap-2"
              style={{ position: "relative" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                className="recent-connection-item w-100"
                onClick={() => handleConnect(s)}
                onContextMenu={(e) => {
                  e.preventDefault();
                }}
                style={{
                  opacity: s.status === "disabled" ? 0.6 : 1,
                  cursor: s.status === "disabled" ? "default" : "pointer",
                  position: "relative",
                }}
              >
                <div className="connection-title">
                  {s.host}:{s.port}
                  <span
                    title={
                      s.status === "online"
                        ? "Online"
                        : s.status === "offline"
                        ? "Offline"
                        : s.status === "checking"
                        ? "Checking"
                        : s.status === "disabled"
                        ? "Disabled"
                        : "Idle"
                    }
                    style={{
                      marginLeft: 8,
                      display: "inline-block",
                      width: 10,
                      height: 10,
                      borderRadius: 6,
                      backgroundColor:
                        s.status === "online"
                          ? "#28a745"
                          : s.status === "offline"
                          ? "#dc3545"
                          : s.status === "checking"
                          ? "#999"
                          : s.status === "disabled"
                          ? "#ddd"
                          : "#bbb",
                    }}
                  />
                </div>
                <div className="connection-subtitle">TCP Session</div>
              </div>

              <MdDeleteOutline
                onClick={(e) => {
                  e.stopPropagation();
                  deleteHost(s.host, s.port);
                }}
                className="delete-icon-btn"
                title="Delete host"
                size={16}
              />
            </div>
          ));
        })()}

        {sessions.length > 5 && (
          <div
            className="recent-connection-item"
            onClick={() => setShowAllModal(true)}
          >
            <div className="connection-title">{t("more")}</div>
            <div className="connection-subtitle">
              {t("show_all_recent_hosts")}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <NewSessionModal
          onCancel={() => setShowModal(false)}
          onConnect={handleConnect}
        />
      )}
      {showAllModal && (
        <AllSessionsModal
          sessions={sessions}
          activeSession={activeSession}
          onClose={() => setShowAllModal(false)}
          onSelect={(s) => {
            handleConnect(s);
            setShowAllModal(false);
          }}
        />
      )}
      <CustomOclock />
      <div className="viettel_logo">
        <img
          src={Viettel_logo}
          aria-hidden="true"
          alt="Viettel Logo"
          className="img-fluid mx-auto position-absolute bottom-0"
          loading="lazy"
          style={{
            left: 50,
            width: "12vw",
            objectFit: "cover",
          }}
        />
      </div>
    </div>
  );
}
