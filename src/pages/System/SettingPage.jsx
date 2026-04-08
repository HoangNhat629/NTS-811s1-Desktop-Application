import { useRef, useEffect, useState, useCallback, useMemo } from "react";
import { MdApps } from "react-icons/md";
import HeaderComponent from "../../component/HeaderComponent";
import { useNavigate, useLocation } from "react-router-dom";
import { Sidebar } from "../../component/Sidebar";
import { OutletWrapper } from "./OutletWrapper";
import { useTranslation } from "react-i18next";
import axios from "axios";

import { baseURL, setBaseURL } from "../../utils/axiosConfig";
import { DefaultDataProvider } from "../../context/DefaultDataContext";
import { EditingExportProvider } from "../../context/EditingExportContext";
import { SaveAllProvider } from "../../context/SaveAllContext";
import { SaveAllProgressProvider } from "../../context/SaveAllProgressContext";

import { PageNotFound } from "./PageNotFound";
import { useOutletDisable } from "../../context/OutletDisableContext";
import { electronAPI } from "../../tauri-shim";
import { useConnectionStatus } from "../../hooks/useConnectionStatus";
import { readFileDraft } from "../../helper/settingHelper";

//////////////////////////////////////////////////////////
// SettingPageInner
//////////////////////////////////////////////////////////

const SettingPageInner = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { disableOutlets, enableOutlets } = useOutletDisable();
  const { connected } = useConnectionStatus();

  const [serverOK, setServerOK] = useState(null);

  const clickCountRef = useRef(0);
  const clickTimerRef = useRef(null);
  const unlockedRef = useRef(false);

  //////////////////////////////////////////////////////////
  // TITLE
  //////////////////////////////////////////////////////////

  const titleMap = useMemo(
    () => ({
      radio: "RADIO",
      freq: t("freq_table").toUpperCase(),
      crypto: t("cryptographic_table").toUpperCase(),
    }),
    [t]
  );

  const title = useMemo(() => {
    const matched = Object.entries(titleMap).find(([key]) =>
      location.pathname.includes(key)
    );
    return `${t("config").toUpperCase()} / ${matched?.[1] ?? ""}`;
  }, [location.pathname, titleMap, t]);

  //////////////////////////////////////////////////////////
  // HEALTH CHECK
  //////////////////////////////////////////////////////////

  const isLocalModeAvailable = useCallback(async () => {
    try {
      const draft = await readFileDraft();
      return Boolean(draft?.isExist);
    } catch {
      return false;
    }
  }, []);

  const checkHealth = useCallback(async () => {
    if (!connected) {
      enableOutlets();
      return true;
    }

    try {
      await axios.get(`${baseURL}/api/health`, { timeout: 3000 });
      return true;
    } catch {
      return false;
    }
  }, [connected]);

  //////////////////////////////////////////////////////////
  // INIT CHECK
  //////////////////////////////////////////////////////////

  useEffect(() => {
    disableOutlets();
  }, [disableOutlets]);

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      const ok = await checkHealth();
      if (!mounted) return;

      setServerOK(ok);

      if (ok && location.pathname === "/setting") {
        const localAvailable = await isLocalModeAvailable();

        localAvailable ? enableOutlets() : disableOutlets();

        navigate("/setting/radio", { replace: true });
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [
    location.pathname,
    checkHealth,
    enableOutlets,
    disableOutlets,
    navigate,
    isLocalModeAvailable,
  ]);

  //////////////////////////////////////////////////////////
  // SECRET CLICK UNLOCK
  //////////////////////////////////////////////////////////

  const handleIconClick = useCallback(() => {
    if (!serverOK) return;

    clickCountRef.current++;

    clearTimeout(clickTimerRef.current);

    clickTimerRef.current = setTimeout(() => {
      clickCountRef.current = 0;
    }, 1500);

    if (clickCountRef.current === 10) {
      enableOutlets();
      unlockedRef.current = true;
      clickCountRef.current = 0;
    }
  }, [serverOK, enableOutlets]);

  const handleDisable = useCallback(() => {
    if (!serverOK || !unlockedRef.current) return;

    disableOutlets();
    unlockedRef.current = false;
  }, [serverOK, disableOutlets]);

  // cleanup timer
  useEffect(() => {
    return () => clearTimeout(clickTimerRef.current);
  }, []);

  //////////////////////////////////////////////////////////
  // RENDER
  //////////////////////////////////////////////////////////

  if (serverOK === null) return null;

  return (
    <div className="setting-page">
      <HeaderComponent
        title={title}
        icon={
          <MdApps
            style={{ fontSize: 30, marginRight: 10 }}
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

//////////////////////////////////////////////////////////
// Providers Wrapper (flattened)
//////////////////////////////////////////////////////////

const SettingProviders = ({ children }) => (
  <DefaultDataProvider>
    <EditingExportProvider>
      <SaveAllProvider>
        <SaveAllProgressProvider>{children}</SaveAllProgressProvider>
      </SaveAllProvider>
    </EditingExportProvider>
  </DefaultDataProvider>
);

//////////////////////////////////////////////////////////
// IPC WRAPPER
//////////////////////////////////////////////////////////

function WrappedSettingPage(props) {
  const navigate = useNavigate();
  const { connected } = useConnectionStatus();

  useEffect(() => {
    if (!connected) return;

    const handler = (data) => {
      const activeRaw = localStorage.getItem("activeHost");
      if (!activeRaw) return;

      const { host, port } = JSON.parse(activeRaw);

      if (
        data.host !== host ||
        Number(data.port) !== Number(port) ||
        data.online !== false
      )
        return;

      electronAPI.ipcRenderer.send("ping:stop", { host, port });

      setBaseURL("");
      localStorage.removeItem("activeHost");

      // navigate("/connection", { replace: true });
    };

    electronAPI.ipcRenderer.on("ping:status", handler);

    return () => electronAPI.ipcRenderer.removeListener("ping:status", handler);
  }, [connected, navigate]);

  return (
    <SettingProviders>
      <SettingPageInner {...props} />
    </SettingProviders>
  );
}

export const SettingPage = WrappedSettingPage;
