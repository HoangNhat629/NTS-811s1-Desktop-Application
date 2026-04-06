import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { enVersion } from "../languages/en";
import { viVersion } from "../languages/vi";

const sysLang = localStorage.getItem("sys_lang") || "vn";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enVersion,
    },
    vn: {
      translation: viVersion,
    },
  },
  lng: sysLang,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
