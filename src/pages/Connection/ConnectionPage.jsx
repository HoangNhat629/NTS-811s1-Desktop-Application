import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setBaseURL } from "../../utils/axiosConfig";
import { NewSessionModal } from "../../component/NewSessionModal";
import AllSessionsModal from "../../component/AllSessionsModal";
import Viettel_logo from "../../assets/Images/viettel_logo_1.png";
import { CustomOclock } from "../../component/CustomOclock";
import { MdDeleteOutline, MdLogout } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useOutletDisable } from "../../context/OutletDisableContext";
import { useConnection } from "../../context/ConnectionContext";
import { electronAPI } from "../../tauri-shim";

export default function ConnectionPage() {
  const {
    sessions,
    activeSession,
    showModal,
    setShowModal,
    handleConnect,
    deleteHost,
    stopCurrentActive,
  } = useConnection();  
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { disableOutlets } = useOutletDisable();
  
  const [showAllModal, setShowAllModal] = useState(false);
  
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
          loading="eager"
          decoding="async"
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
