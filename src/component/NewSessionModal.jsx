import { useState } from "react";
import "../assets/css/NewSessionModal.css";
import { useTranslation } from "react-i18next";

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

export default function NewSessionModal({ onCancel, onConnect }) {
  const { t } = useTranslation();

  const [host, setHost] = useState("");
  const [port, setPort] = useState("8080");
  const [error, setError] = useState("");

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
