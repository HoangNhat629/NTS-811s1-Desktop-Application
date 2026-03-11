import { useTranslation } from "react-i18next";

export default function AllSessionsModal({
  sessions,
  onClose,
  onSelect,
  activeSession,
}) {
  const { t } = useTranslation();
  return (
    <div className="connection-modal-backdrop custom-scroll">
      <div className="connection-modal">
        <h3>{t("allSessions")}</h3>
        <div style={{ maxHeight: 400, overflowY: "auto" }}>
          {sessions.map((s, i) => {
            const isActive =
              activeSession &&
              activeSession.host === s.host &&
              activeSession.port === s.port;
            const disabled = s.status === "disabled" && !isActive;

            const title =
              s.status === "idle"
                ? "Idle"
                : s.status === "checking"
                ? "Checking"
                : s.status === "online"
                ? "Online"
                : s.status === "offline"
                ? "Offline"
                : "Disabled";

            return (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 4px",
                  opacity: disabled ? 0.5 : 1,
                  cursor: disabled ? "default" : "pointer",
                }}
                onClick={() => {
                  if (disabled) return;
                  onSelect(s);
                }}
              >
                <div>
                  <strong>
                    {s.host}:{s.port}
                  </strong>
                  <div style={{ fontSize: 12, color: "#666" }}>{title}</div>
                </div>
                <div style={{ display: "flex", alignItems: "center" }}>
                  <div
                    style={{
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
                          : "#bbb",
                      marginRight: 8,
                    }}
                  />
                  {isActive && (
                    <span style={{ fontSize: 12, color: "#333" }}>Active</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 12, textAlign: "right" }}>
          <button className="btn secondary" onClick={onClose}>
            {t("close")}
          </button>
        </div>
      </div>
    </div>
  );
}
