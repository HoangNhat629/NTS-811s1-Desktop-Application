import { useState, useEffect } from "react";
import { useTheme } from "../hooks/useTheme";
import {
  MdPowerSettingsNew,
  MdLanguage,
  MdLightMode,
  MdDarkMode,
  MdOutlineRadioButtonChecked,
} from "react-icons/md";
import { useNavigate } from "react-router-dom";
import BatteryComponent from "./BatteryComponent";
import { useDispatch, useSelector } from "react-redux";
import { getHardwareStatusFunc } from "../store/apis/SystemStatus/systemStatusSlice";
import { MdGpsFixed } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { disconnectHostHelper } from "../helper/hostHelper";

const HeaderComponent = ({ title, icon, check_health }) => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t, i18n } = useTranslation();
  const sysLang = localStorage.getItem("sys_lang") || "en";
  const [currTime, setCurrTime] = useState(new Date().toLocaleTimeString());
  const { hardwareStatus } = useSelector((state) => state.systemStatus);
  const [connectionStatus, setConnectionStatus] = useState("idle");
  const [activeHostInfo, setActiveHostInfo] = useState(null);

  const [lang, setLang] = useState(sysLang);
  const { theme, toggleTheme } = useTheme();

  useEffect(() => {
    dispatch(getHardwareStatusFunc())
      .unwrap()
      .catch((err) =>
        console.error(err.message || err || "Error fetching hardware status")
      );

    const interval = setInterval(() => {
      dispatch(getHardwareStatusFunc())
        .unwrap()
        .catch((err) =>
          console.error(err.message || err || "Error fetching hardware status")
        );
    }, 5000);

    return () => clearInterval(interval);
  }, [dispatch]);

  useEffect(() => {
    i18n.changeLanguage(sysLang);

    const interval = setInterval(() => {
      setCurrTime(new Date().toLocaleTimeString());
    }, 1000);

    return () => clearInterval(interval);
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    const update = () => {
      const active = readActiveHost();

      if (active) {
        setConnectionStatus(active.status);
        setActiveHostInfo(active);
      } else {
        setConnectionStatus("idle");
        setActiveHostInfo(null);
      }
    };

    update();

    window.addEventListener("storage", update);

    const interval = setInterval(update, 1000);

    return () => {
      window.removeEventListener("storage", update);
      clearInterval(interval);
    };
  }, []);

  const toggleChangeLang = () => {
    const newLang = lang === "en" ? "vn" : "en";
    i18n.changeLanguage(newLang);
    setLang(newLang);
    localStorage.setItem("sys_lang", newLang);
  };

  const readActiveHost = () => {
    try {
      const stored = JSON.parse(localStorage.getItem("activeHost") || "{}");

      if (!stored.host) return null;

      return {
        host: stored.host,
        port: stored.port,
        status: stored.status || "idle",
      };
    } catch {
      return null;
    }
  };

  const ConnectionStatusIcon = ({ status }) => {
    switch (status) {
      case "online":
        return (
          <MdOutlineRadioButtonChecked
            size={24}
            color="#22c55e"
            title="Connected"
          />
        );

      case "offline":
        return (
          <MdOutlineRadioButtonChecked
            size={24}
            color="#ef4444"
            title="Disconnected"
          />
        );

      case "checking":
        return (
          <MdOutlineRadioButtonChecked
            size={24}
            color="#6b7280"
            className="spin"
            title="Connecting..."
          />
        );

      default:
        return (
          <MdOutlineRadioButtonChecked size={24} color="#9ca3af" title="Idle" />
        );
    }
  };

  return (
    <>
      <div className="top-bar">
        <div className="d-flex align-items-center">
          {icon}
          <div className="page-title">{title}</div>
        </div>
        <div className="time">{currTime}</div>
        <div className="system-icons">
          <div className="d-flex align-items-center gap-2 connection-info">
            <ConnectionStatusIcon status={connectionStatus} />
            <span className="connection-host">
              {activeHostInfo
                ? `${activeHostInfo.host}:${activeHostInfo.port}`
                : t("no_connection")}
            </span>
          </div>
          {hardwareStatus?.GPS?.stat !== null &&
            hardwareStatus?.GPS?.num_satelite > 0 && (
              <MdGpsFixed
                style={{
                  fontSize: "30px",
                  color:
                    hardwareStatus?.GPS?.stat === 1 ? "#4CAF50" : "#dc2626",
                }}
              />
            )}
          <div style={{ cursor: "pointer" }} onClick={toggleTheme}>
            {theme === "light" ? (
              <MdDarkMode style={{ fontSize: "25px" }} title={t("darkMode")} />
            ) : (
              <MdLightMode
                style={{ fontSize: "25px" }}
                title={t("lightMode")}
              />
            )}
          </div>

          <div
            onClick={toggleChangeLang}
            className="d-flex justify-content-center align-items-center"
            style={{
              cursor: "pointer",
              gap: "8px",
              fontSize: "14px",
            }}
          >
            <MdLanguage style={{ fontSize: "25px" }} title={t("lang")} />{" "}
            <span className="m-0 p-0">{lang.toUpperCase()}</span>
          </div>
          <BatteryComponent />
          {!check_health && (
            <MdPowerSettingsNew
              style={{
                fontSize: "20px",
                marginRight: "5px",
                cursor: "pointer",
              }}
              id="disconnect_button"
              onClick={() => {
                disconnectHostHelper();
                navigate("/connection");
              }}
              title={t("shutdown")}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default HeaderComponent;
