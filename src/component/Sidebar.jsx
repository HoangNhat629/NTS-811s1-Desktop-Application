import { useState, useEffect, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  MdCellTower,
  MdBackupTable,
  MdVpnKey,
  MdFileDownload,
  MdFileUpload,
  MdTune,
  MdSave,
  MdRestartAlt,
  MdPowerSettingsNew,
  MdArrowBack,
  MdLink,
} from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  createSystemDataPayloadHelper,
  getSecretKeyHelper,
  handleExportHelper,
  parseFreqTableFromXmlHelper,
  parseCryptoTableFromXmlHelper,
  parseGeneralConfigFromXmlHelper,
  parseChannelParametersFromXmlHelper,
  formatExportDataHelper,
  validateImportedDataHelper,
  parseImportedDataHelper,
  handleImportFileHelper,
  exportEditingFileHelper,
} from "../helper/settingHelper";
import {
  getAllCryptoTableFunc,
  getAllHopTableFunc,
  getChannelTableFunc,
  getCommonParamsFunc,
  rebootFunc,
} from "../store/apis/Configuration/configurationSlice";
import ConfirmDialog from "./ConfirmDialog";
import { ExportModeModal } from "./ExportModeModal";
import { toast } from "react-toastify";
import { EncryptJWT, jwtDecrypt } from "jose";
import { useDefaultData } from "../context/DefaultDataContext";
import { useEditingExport } from "../context/EditingExportContext";
import { useSaveAll } from "../context/SaveAllContext";
import { useSaveAllProgress } from "../context/SaveAllProgressContext";
import { useOutletDisable } from "../context/OutletDisableContext";
import { SaveAllProgress } from "./SaveAllProgress";
import LoadingPage from "../pages/LoadingPage";
import { key_secret } from "../constants/appInf";
import {
  TOAST_ERROR_ID,
  TOAST_SUCCESS_ID,
  TOAST_WARNING_ID,
} from "../constants/toastId";
import { useConnectionStatus } from "../hooks/useConnectionStatus";
import { ConnectDeviceModal } from "./NewSessionModal";
import { useConnection } from "../context/ConnectionContext";
import { electronAPI } from "../tauri-shim";

const SAVE_LABELS = {
  radio: "Radio Configuration",
  freqTable: "Frequency Table",
  cryptoTable: "Crypto Configuration",
};

const STORAGE_KEY = "selectedSidebarMenu";

export const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { activateDefaultMode, defaultData } = useDefaultData();
  const { getEditingData } = useEditingExport();
  const { enableOutlets, isOutletDisabled } = useOutletDisable();
  const { connected } = useConnectionStatus();
  const { executeAllSaveSequential, saveFunctions } = useSaveAll();
  const {
    initializeProgress,
    updateItemStatus,
    startProcessing,
    finishProcessing,
    resetProgress,
  } = useSaveAllProgress();
  const {
    sessions,
    activeSession,
    showModal,
    setShowModal,
    handleConnect,
    deleteHost,
    stopCurrentActive,
  } = useConnection();

  const MENU_ITEMS = [
    { id: "radio", icon: MdCellTower, label: "RADIO", path: "radio" },
    {
      id: "freqTable",
      icon: MdBackupTable,
      label: t("FreqTable").toUpperCase(),
      path: "freq",
    },
    {
      id: "crytoTable",
      icon: MdVpnKey,
      label: t("CryptographicTable")
        .replace("Cryptographic", "Crypto")
        .toUpperCase(),
      path: "crypto",
    },
  ];

  const getInitialMenu = useCallback(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) return saved;

    const currentPath = location.pathname.split("/").pop();
    const menu = MENU_ITEMS.find((item) => item.path === currentPath);
    return menu?.id || "radio";
  }, [location.pathname]);

  const [outletDisabledState, setOutletDisabledState] = useState(true);
  const [selectedMenu, setSelectedMenu] = useState(() => getInitialMenu());
  const [isLoading, setIsLoanding] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [showExportModeModal, setShowExportModeModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [isRebooting, setIsRebooting] = useState(false);
  const [rebootProgress, setRebootProgress] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    showCancel: true,
  });

  useEffect(() => {
    const checkOutletState = () => {
      const isAnyDisabled =
        isOutletDisabled("radio") ||
        isOutletDisabled("frequency") ||
        isOutletDisabled("crypto");
      setOutletDisabledState(isAnyDisabled);
    };

    checkOutletState();
    const interval = setInterval(checkOutletState, 500);
    return () => clearInterval(interval);
  }, [isOutletDisabled]);

  useEffect(() => {
    const currentPath = location.pathname.split("/").pop();
    const menu = MENU_ITEMS.find((item) => item.path === currentPath);

    if (!menu) return;

    setSelectedMenu(menu.id);
    localStorage.setItem(STORAGE_KEY, menu.id);

    const savedMenu = localStorage.getItem(STORAGE_KEY);
    if (savedMenu && currentPath !== menu.path) {
      navigate(menu.path, { replace: true });
    }
  }, [location.pathname, navigate]);

  const handleMenuClick = useCallback((menu) => {
    setSelectedMenu(menu);
    localStorage.setItem(STORAGE_KEY, menu);
  }, []);

  const parseAndValidateXml = useCallback(async () => {
    const [frequencyTables, cryptoTables, generalConfig, channelParameters] =
      await Promise.all([
        parseFreqTableFromXmlHelper(),
        parseCryptoTableFromXmlHelper(),
        parseGeneralConfigFromXmlHelper(),
        parseChannelParametersFromXmlHelper(),
      ]);
    if (!frequencyTables?.length)
      throw new Error("No frequency tables found in XML");
    if (!Object.keys(cryptoTables).length)
      throw new Error("No crypto tables found in XML");
    return { frequencyTables, cryptoTables, generalConfig, channelParameters };
  }, []);

  const handleDefault = async () => {
    try {
      setIsLoanding(true);
      const {
        frequencyTables,
        cryptoTables,
        generalConfig,
        channelParameters,
      } = await parseAndValidateXml();
      const defaultPayload = createSystemDataPayloadHelper({
        generalConfiguration: generalConfig,
        frequencyTable: frequencyTables,
        cryptoTable: cryptoTables,
        channelParameters: channelParameters,
      });

      activateDefaultMode(defaultPayload);
      enableOutlets();

      window.dispatchEvent(
        new CustomEvent("systemDataImported", {
          detail: { type: "default", data: defaultPayload },
        }),
      );

      toast.success(t("loadDefaultSuccess"), {
        toastId: TOAST_SUCCESS_ID,
      });

      if (!connected) {
        await electronAPI.createFileDraft(defaultPayload);
      }
    } catch (err) {
      console.error("Error loading default configuration:", err);
      toast.error(err?.message || t("loadDefaultFailed"), {
        toastId: TOAST_ERROR_ID,
      });
    } finally {
      setIsLoanding(false);
    }
  };

  const handleExportModeSelect = async (mode) => {
    setShowExportModeModal(false);
    setIsExporting(true);

    try {
      if (mode === "system") {
        await handleExportSystemFile();
      } else if (mode === "editing") {
        await handleExportEditingFile();
      }
    } catch (error) {
      console.error("Export failed:", error);
      toast.error(error?.message || t("exportFailed"), {
        toastId: TOAST_ERROR_ID,
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSystemFile = async () => {
    const [allFrequencyTable, allCryptoTable, commonParams, channelTable] =
      await Promise.all([
        dispatch(getAllHopTableFunc()).unwrap(),
        dispatch(getAllCryptoTableFunc()).unwrap(),
        dispatch(getCommonParamsFunc()).unwrap(),
        dispatch(getChannelTableFunc()).unwrap(),
      ]);

    const exportPayload = formatExportDataHelper({
      generalConfiguration: commonParams,
      frequencyTable: allFrequencyTable,
      cryptoTable: allCryptoTable,
      channelParameters: channelTable,
    });

    if (!key_secret) {
      toast.error(t("cancelCryptExport"), {
        toastId: TOAST_ERROR_ID,
      });
      throw new Error("Encryption key not found");
    }

    const key = await getSecretKeyHelper(key_secret);
    const token = await new EncryptJWT(exportPayload)
      .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
      .setIssuedAt()
      .encrypt(key);

    handleExportHelper(
      JSON.stringify({ jwe: token }, null, 2),
      `system_backup_${parseInt((Date.now() / 1000).toFixed(0))}.json`,
    );

    toast.success(t("successCryptExport"), {
      toastId: TOAST_SUCCESS_ID,
    });
  };

  const handleExportEditingFile = async () => {
    const editingData = getEditingData();
    const hasAnyData = Object.values(editingData).some((val) => val !== null);

    if (!hasAnyData) {
      toast.error("No editing data found. Load default mode first.", {
        toastId: TOAST_ERROR_ID,
      });
      throw new Error("No editing data available");
    }

    try {
      exportEditingFileHelper(editingData);
      toast.success("Export successful", {
        toastId: TOAST_SUCCESS_ID,
      });
    } catch (error) {
      console.error("Failed to export editing file:", error);
      throw error;
    }
  };

  const handleImport = async () => {
    try {
      setIsLoanding(true);

      const { content: fileContent } = await handleImportFileHelper();

      let payload = null;

      if (fileContent?.jwe) {
        if (!key_secret) {
          throw new Error("Secret key is required for encrypted import");
        }

        const key = await getSecretKeyHelper(key_secret);
        const decrypted = await jwtDecrypt(fileContent.jwe, key);
        payload = decrypted.payload;
      } else if (
        fileContent?.generalConfiguration ||
        fileContent?.frequencyTable ||
        fileContent?.cryptoTable ||
        fileContent?.channelParameters
      ) {
        payload = fileContent;
      } else {
        throw new Error("Invalid import file format");
      }

      const validationErrors = validateImportedDataHelper(payload);
      if (validationErrors.length > 0) {
        throw new Error("Validation errors: " + validationErrors.join(", "));
      }

      const importedData = parseImportedDataHelper(payload);

      const importPayload = createSystemDataPayloadHelper({
        generalConfiguration: importedData.generalConfiguration,
        frequencyTable: importedData.frequencyTable,
        cryptoTable: importedData.cryptoTable,
        channelParameters: importedData.channelParameters,
      });

      activateDefaultMode(importPayload);
      enableOutlets();

      window.dispatchEvent(
        new CustomEvent("systemDataImported", {
          detail: {
            type: fileContent?.jwe ? "encrypted" : "editing",
            data: importPayload,
          },
        }),
      );

      toast.success(
        fileContent?.jwe
          ? "Encrypted import successful!"
          : "Editing file import successful!",
        { toastId: TOAST_SUCCESS_ID },
      );
    } catch (err) {
      console.error("Import error:", err);
      toast.error(err?.message || t("importFailed") || "Import failed", {
        toastId: TOAST_ERROR_ID,
      });
    } finally {
      setIsLoanding(false);
    }
  };

  const handleSaveAll = useCallback(async () => {
    try {
      const progressItems = Object.keys(saveFunctions).map((key) => ({
        key,
        label: SAVE_LABELS[key] || key,
      }));

      initializeProgress(progressItems);
      startProcessing();
      setIsSavingAll(true);

      const results = await executeAllSaveSequential((progress) => {
        updateItemStatus(
          progress.index,
          progress.status,
          progress.error || null,
        );
      });

      const successful = results.filter((r) => r.status === "success");
      const failed = results.filter((r) => r.status === "failed");

      if (failed.length === 0) {
        setConfirmDialog({
          show: true,
          message: t("all_configurations_saved_successfully"),
          onConfirm: async () => {
            setConfirmDialog({ show: false });
          },
          showCancel: false,
        });
      } else if (successful.length > 0) {
        const failedLabels = failed
          .map((f) => SAVE_LABELS[f.key] || f.key)
          .join(", ");
        toast.warn(
          `${successful.length}/${results.length} saved. Failed: ${failedLabels}`,
          {
            toastId: TOAST_WARNING_ID,
          },
        );
      } else {
        toast.error(t("failed_to_save_all_configurations"), {
          toastId: TOAST_ERROR_ID,
        });
      }

      setTimeout(() => {
        finishProcessing();
        resetProgress();
      }, 2000);
    } catch (err) {
      console.error("Save all failed:", err);
      toast.error("Failed to save all configurations", {
        toastId: TOAST_ERROR_ID,
      });
      finishProcessing();
      resetProgress();
    } finally {
      setIsSavingAll(false);
    }
  }, [
    saveFunctions,
    initializeProgress,
    startProcessing,
    updateItemStatus,
    executeAllSaveSequential,
    finishProcessing,
    resetProgress,
  ]);

  const resetDeviceFunc = async () => {
    setConfirmDialog({
      show: true,
      message: t("messRestart"),
      onConfirm: async () => {
        setConfirmDialog({ show: false });
        try {
          const res = await dispatch(rebootFunc()).unwrap();
          if (res.success === true && res.data?.timerequired) {
            const total = res.data.timerequired;
            setIsRebooting(true);
            setRebootProgress(total);
          } else {
            toast.error(res.message || "Reboot failed", {
              toastId: TOAST_ERROR_ID,
            });
          }
        } catch (err) {
          console.log(
            err.message || err || "An error occurred. Please try again.",
          );
          return;
        } finally {
          stopCurrentActive();
        }
      },
      onCancel: () => setConfirmDialog({ show: false }),
    });
  };

  return (
    <>
      <ConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
        showCancel={confirmDialog.showCancel}
      />
      <ExportModeModal
        show={showExportModeModal}
        onClose={() => setShowExportModeModal(false)}
        onExport={handleExportModeSelect}
        isLoading={isExporting}
      />
      {isRebooting && <LoadingPage loadingProcess={rebootProgress} />}
      {showModal && (
        <ConnectDeviceModal
          onCancel={() => setShowModal(false)}
          onConnect={handleConnect}
          onDelete={deleteHost}
          sessions={sessions}
          activeSession={activeSession}
        />
      )}
      <SaveAllProgress />
      <aside className="layout-side position-relative d-flex flex-column justify-content-between">
        <div className="layout-side-children">
          <ul className="w-100">
            {MENU_ITEMS.map((menu) => {
              const IconComponent = menu.icon;
              return (
                <li
                  key={menu.id}
                  className={`menu-items ${
                    selectedMenu === menu.id ? "menu-items-selected" : ""
                  }`}
                  role="menuitem"
                  style={{ cursor: "pointer" }}
                  onClick={() => {
                    handleMenuClick(menu.id);
                    navigate(menu.path);
                  }}
                >
                  <span style={{ fontSize: "20px" }}>
                    <IconComponent
                      style={{ margin: "0 5px 5px 0" }}
                      size={25}
                    />
                  </span>
                  <span className="menu-title-content">{menu.label}</span>
                </li>
              );
            })}
          </ul>
        </div>
        <div className="layout-side-children">
          <div className="system-backup-section">
            <button
              onClick={handleDefault}
              className="system-backup-btn"
              disabled={isLoading || isSavingAll}
            >
              <MdTune style={{ marginRight: "5px" }} size={20} />
              {t("default")}
            </button>
            <button
              className="system-backup-btn"
              disabled={isLoading || isSavingAll}
              onClick={handleImport}
            >
              <MdFileDownload style={{ marginRight: "5px" }} size={20} />
              {t("Import")}
            </button>
            <button
              onClick={() => setShowExportModeModal(true)}
              className="system-backup-btn"
              disabled={isLoading || isSavingAll}
            >
              <MdFileUpload style={{ marginRight: "5px" }} size={20} />
              {t("Export")}
            </button>
          </div>
          <div
            className="system-backup-section"
            style={{
              borderBottom: "2px solid #EE0034",
              paddingBottom: "12px",
            }}
          >
            <button
              onClick={handleSaveAll}
              className="system-backup-btn"
              disabled={isLoading || isSavingAll || outletDisabledState}
              title={
                outletDisabledState
                  ? "Configuration is hidden. Load default settings or import data to enable."
                  : "Save all configurations"
              }
            >
              <MdSave style={{ marginRight: "5px" }} size={20} />
              {isSavingAll ? t("saving") : t("save_all")}
            </button>
          </div>
        </div>

        <div className="layout-side-children">
          <div className="system-backup-section">
            {!connected ? (
              <button
                className="system-backup-btn"
                disabled={isLoading || isSavingAll}
                onClick={() => setShowModal(true)}
              >
                <MdLink style={{ marginRight: "5px" }} size={20} />
                {t("connect_device")}
              </button>
            ) : (
              <button
                onClick={resetDeviceFunc}
                className="system-backup-btn"
                disabled={isLoading || isSavingAll}
              >
                <MdRestartAlt style={{ marginRight: "5px" }} size={20} />
                {t("restart")}
              </button>
            )}

            <button
              className="system-backup-btn"
              onClick={async () => {
                stopCurrentActive();
                navigate("/connection");
              }}
              disabled={isLoading || isSavingAll}
            >
              {!connected ? (
                <>
                  <MdArrowBack style={{ marginRight: "5px" }} size={20} />
                  {t("back_to_connection")}
                </>
              ) : (
                <>
                  <MdPowerSettingsNew
                    style={{ marginRight: "5px" }}
                    size={20}
                  />
                  {t("shutdown")}
                </>
              )}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
