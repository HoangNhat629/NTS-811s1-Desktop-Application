import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { MdPerson, MdVpnKey } from "react-icons/md";
import { toast } from "react-toastify";
import { app_name } from "../constants/appInf.jsx";
import { TOAST_ERROR_ID } from "../constants/toastId.jsx";
import { useTranslation } from "react-i18next";
export default function Login() {
  const { t } = useTranslation();
  const [userName, setUserName] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  return (
    <div className="d-flex justify-content-center align-items-center vh-100 login-page">
      <div className="login-form">
        <form action="">
          <h1>{app_name}</h1>
          <div className="input-box">
            <input
              type="text"
              placeholder={t("username")}
              onChange={(e) => setUserName(e.target.value)}
              required
            />
            <MdPerson
              className="position-absolute"
              style={{
                right: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "25px",
              }}
            />
          </div>
          <div className="input-box">
            <input
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder={t("password")}
              required
            />
            <MdVpnKey
              className="position-absolute"
              style={{
                right: "20px",
                top: "50%",
                transform: "translateY(-50%)",
                fontSize: "25px",
              }}
            />
          </div>
          <button
            className="btn w-100"
            onClick={() => {
              if (password == "admin" && userName == "admin") {
                localStorage.setItem("token_access", "login");
                navigate("/connection");
              } else {
                toast.error("Incorrect login credentials. Please try again.", {
                  toastId: TOAST_ERROR_ID,
                });
                navigate("/");
              }
            }}
          >
            {t("login")}
          </button>
        </form>
      </div>
    </div>
  );
}
