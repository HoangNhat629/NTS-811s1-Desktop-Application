import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { enVersion } from "../languages/en";
import { viVersion } from "../languages/vi";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: enVersion,
    },
    vn: {
      translation: viVersion,
    },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
