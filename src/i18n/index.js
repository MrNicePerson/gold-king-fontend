import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ur from "./locales/ur.json";

const savedLanguage = localStorage.getItem("language") || "en";

// Set initial document attributes
document.documentElement.dir = savedLanguage === "ur" ? "rtl" : "ltr";
document.documentElement.lang = savedLanguage;

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: en,
      },
      ur: {
        translation: ur,
      },
    },

    lng: savedLanguage,

    fallbackLng: "en",

    interpolation: {
      escapeValue: false,
    },
  });

i18n.on("languageChanged", (lng) => {
  document.documentElement.dir = lng === "ur" ? "rtl" : "ltr";
  document.documentElement.lang = lng;
  localStorage.setItem("language", lng);
});

export default i18n;