import { useEffect, useState } from "react";
import "../assets/css/NewSessionModal.css";
import { useTranslation } from "react-i18next";
import { MdDeleteOutline } from "react-icons/md";
import AllSessionsModal from "./AllSessionsModal";
function sanitizeHost(input) {
  if (!input) return "";

  return input
    .replace(/\u00A0/g, " ") // non-breaking space
    .replace(/\u200B/g, "") // zero width space
    .trim();
}

function extractHostname(value) {
  const cleaned = sanitizeHost(value);

  try {
    return new URL(cleaned).hostname;
  } catch {
    return cleaned;
  }
}

function isValidHost(host) {
  const domainRegex =
    /^(?=.{1,253}$)(?!-)[a-zA-Z0-9-]{1,63}(?<!-)(\.[a-zA-Z]{2,})+$/;

  const ipv4Regex =
    /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;

  return host === "localhost" || domainRegex.test(host) || ipv4Regex.test(host);
}

function isValidPort(port) {
  const num = Number(port);
  return Number.isInteger(num) && num > 0 && num <= 65535;
}

export function NewSessionModal({ onCancel, onConnect }) {
  const { t } = useTranslation();

  const [host, setHost] = useState("");
  const [port, setPort] = useState("8080");
  const [error, setError] = useState("");

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter") {
        handleConnect();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [host, port]);

  const handleHostBlur = () => {
    const extracted = extractHostname(host);
    setHost(extracted);

    if (!isValidHost(extracted) && host) {
      setError(t("invalidHost"));
      return;
    } else {
      setError("");
    }
  };

  const handlePortBlur = () => {
    if (!isValidPort(port) && port) {
      setError(t("invalidPort"));
      return;
    } else {
      setError("");
    }
  };

  const handleConnect = () => {
    const cleanHost = extractHostname(host);

    if (!isValidHost(cleanHost)) {
      setError(t("invalidHost"));
      return;
    }

    if (!isValidPort(port)) {
      setError(t("invalidPort"));
      return;
    }

    setError("");
    onConnect({ host: cleanHost, port: port.trim() });
  };

  return (
    <div className="connection-modal-backdrop">
      <div className="connection-modal">
        <h3>{t("connect_to_host")}</h3>

        <label>{t("host")}</label>
        <input
          value={host}
          onChange={(e) => setHost(e.target.value)}
          onBlur={handleHostBlur}
          placeholder="127.0.0.1"
        />

        <label>{t("port")}</label>
        <input
          value={port}
          onChange={(e) => setPort(e.target.value.replace(/\D/g, ""))}
          placeholder="8080"
          onBlur={handlePortBlur}
        />
        {error && (
          <div className="ns-modal__error" role="alert" aria-live="assertive">
            {error}
          </div>
        )}
        <div className="connection-modal-actions">
          <button className="btn secondary" onClick={onCancel}>
            {t("cancel")}
          </button>
          <button
            className="btn primary"
            onClick={handleConnect}
            disabled={!host || !port || !!error}
          >
            {t("connect")}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ConnectDeviceModal({
  onCancel,
  onConnect,
  onDelete,
  sessions,
  activeSession,
}) {
  const { t } = useTranslation();

  const [host, setHost] = useState("");
  const [port, setPort] = useState("8080");
  const [error, setError] = useState("");
  const [showAllModal, setShowAllModal] = useState(false);

  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Enter") {
        handleLeftConnect();
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [host, port]);

  const handleHostBlur = () => {
    const extracted = extractHostname(host);
    setHost(extracted);

    if (!isValidHost(extracted) && host) {
      setError(t("invalidHost"));
      return;
    } else {
      setError("");
    }
  };

  const handlePortBlur = () => {
    if (!isValidPort(port) && port) {
      setError(t("invalidPort"));
      return;
    } else {
      setError("");
    }
  };

  const handleLeftConnect = () => {
    const cleanHost = extractHostname(host);

    if (!isValidHost(cleanHost)) {
      setError(t("invalidHost"));
      return;
    }

    if (!isValidPort(port)) {
      setError(t("invalidPort"));
      return;
    }

    setError("");
    onConnect({ host: cleanHost, port: port.trim() });
  };

  return (
    <div className="connection-root p-0">
      {showAllModal ? (
        <AllSessionsModal
          sessions={sessions}
          activeSession={activeSession}
          onClose={() => setShowAllModal(false)}
          onSelect={(s) => {
            onConnect(s);
            setShowAllModal(false);
          }}
        />
      ) : (
        <div className="connection-modal-backdrop">
          <div className="connection-modal w-50 d-flex justify-content-center gap-5 align-items-center">
            <div className="left-panel-modal w-50">
              <h3>{t("connect_to_host")}</h3>

              <label>{t("host")}</label>
              <input
                value={host}
                onChange={(e) => setHost(e.target.value)}
                onBlur={handleHostBlur}
                placeholder="127.0.0.1"
              />

              <label>{t("port")}</label>
              <input
                value={port}
                onChange={(e) => setPort(e.target.value.replace(/\D/g, ""))}
                placeholder="8080"
                onBlur={handlePortBlur}
              />
              {error && (
                <div
                  className="ns-modal__error"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </div>
              )}
              <div className="connection-modal-actions">
                <button className="btn secondary" onClick={onCancel}>
                  {t("cancel")}
                </button>
                <button
                  className="btn primary"
                  onClick={handleLeftConnect}
                  disabled={!host || !port || !!error}
                >
                  {t("connect")}
                </button>
              </div>
            </div>

            <div className="connection-column right-panel-modal w-50">
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
                      onClick={() => onConnect(s)}
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
                        onDelete(s.host, s.port);
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
          </div>
        </div>
      )}
    </div>
  );
}
