import { useRef } from "react";
import { MdApps } from "react-icons/md";
import HeaderComponent from "../../component/HeaderComponent";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "../../component/Sidebar";
import { OutletWrapper } from "./OutletWrapper";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { baseURL, setBaseURL } from "../../utils/axiosConfig";
import { DefaultDataProvider } from "../../context/DefaultDataContext";
import { EditingExportProvider } from "../../context/EditingExportContext";
import { SaveAllProvider } from "../../context/SaveAllContext";
import { SaveAllProgressProvider } from "../../context/SaveAllProgressContext";
import { PageNotFound } from "./PageNotFound";
import { useOutletDisable } from "../../context/OutletDisableContext";
import axios from "axios";
import { electronAPI } from "../../tauri-shim";

const SettingPageInner = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { disableOutlets, enableOutlets } = useOutletDisable();
  const [serverOK, setServerOK] = useState(null);
  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const flagClickRef = useRef(false);
  const titleMap = {
    radio: "RADIO",
    freq: "FREQ TABLE",
    crypto: "CRYPTOGRAPHIC TABLE",
  };

  const getTitle = () => {
    const matched = Object.entries(titleMap).find(([key]) =>
      location.pathname.includes(key)
    );
    return `${t("config").toUpperCase()} / ${matched ? matched[1] : ""}`;
  };

  const checkHealth = async () => {
    if (new URL(baseURL).hostname === "0.0.0.0") {
      enableOutlets();
      return true;
    }
    try {
      await axios.get(`${baseURL}/api/health`, {
        timeout: 3000,
      });
      return true;
    } catch {
      return false;
    }
  };

  useEffect(() => {
    disableOutlets();
  }, [disableOutlets]);

  useEffect(() => {
    const check = async () => {
      const ok = await checkHealth();
      setServerOK(ok);
      if (ok && location.pathname === "/setting") {
        navigate("/setting/radio", { replace: true });
      }
    };
    check();
  }, [location.pathname, navigate]);

  const handleIconClick = () => {
    if (!serverOK) {
      return;
    }

    clickCountRef.current += 1;

    if (clickTimerRef.current) {
      clearTimeout(clickTimerRef.current);
    }

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1500);

    if (clickCountRef.current === 10) {
      enableOutlets();
      clickCountRef.current = 0;
      flagClickRef.current = true;
    }
  };

  const handleDisable = () => {
    if (!serverOK) return;

    if (!flagClickRef.current) return;

    disableOutlets();
    flagClickRef.current = false;
    clickCountRef.current = 0;
  };

  if (serverOK === null) return null;
  return (
    <div className="setting-page">
      <HeaderComponent
        title={getTitle()}
        icon={
          <MdApps
            style={{ fontSize: "30px", marginRight: "10px" }}
            onClick={handleIconClick}
            onDoubleClick={handleDisable}
          />
        }
        check_health={serverOK}
      />
      {serverOK ? (
        <div className="d-flex flex-row h-100 main-content-page">
          <Sidebar />
          <main className="w-100 ms-2">
            <OutletWrapper />
          </main>
        </div>
      ) : (
        <main className="w-100 h-100 d-flex align-items-center justify-content-center">
          <PageNotFound />
        </main>
      )}
    </div>
  );
};

const SettingPageContent = () => {
  return (
    <DefaultDataProvider>
      <EditingExportProvider>
        <SaveAllProvider>
          <SaveAllProgressProvider>
            <SettingPageInner />
          </SaveAllProgressProvider>
        </SaveAllProvider>
      </EditingExportProvider>
    </DefaultDataProvider>
  );
};

const handlePingStatus = (navigate) => (data) => {
  const activeRaw = localStorage.getItem("activeHost");
  if (!activeRaw) return;

  const { host: aHost, port: aPort } = JSON.parse(activeRaw);
  const dataPort = Number(data.port);
  if (
    data.host !== aHost ||
    dataPort !== Number(aPort) ||
    data.online !== false
  )
    return;

  electronAPI.ipcRenderer
    .send("ping:stop", { host: aHost, port: aPort })
    .catch(() => {});

  try {
    setBaseURL("");
  } catch {
    localStorage.removeItem("apiBase");
  }

  try {
    const arr = JSON.parse(localStorage.getItem("recentSessions") || "[]");
    const next = arr.map((s) =>
      s.host === aHost && s.port === aPort
        ? {
            ...s,
            status: "offline",
            online: false,
            lastChecked: data.timestamp,
          }
        : s
    );
    localStorage.setItem("recentSessions", JSON.stringify(next));
  } catch {}

  localStorage.removeItem("activeHost");
  navigate("/connection", { replace: true });
  if (!window.location.hash.includes("/connection")) {
    window.location.hash = "#/connection";
  }
};

function WrappedSettingPage(props) {
  const navigate = useNavigate();

  useEffect(() => {
    const handler = handlePingStatus(navigate);
    electronAPI.ipcRenderer.on("ping:status", handler);
    return () => {
      electronAPI.ipcRenderer.removeListener("ping:status", handler);
    };
  }, [navigate]);

  return <SettingPageContent {...props} />;
}

export const SettingPage = WrappedSettingPage;
