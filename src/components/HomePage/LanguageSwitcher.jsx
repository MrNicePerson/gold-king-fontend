import { useTranslation } from "react-i18next";

const LanguageSwitcher = () => {
    const { i18n } = useTranslation();

    const changeLanguage = (language) => {
        i18n.changeLanguage(language);
        localStorage.setItem("language", language);

        // Set document direction
        document.documentElement.dir =
            language === "ur" ? "rtl" : "ltr";

        document.documentElement.lang = language;
    };

    return (
        <div className="flex items-center gap-1 rounded-full border p-1 text-gray-400 bg-gray-300">
            <button
                type="button"
                onClick={() => changeLanguage("en")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${i18n.language === "en"
                    ? "text-black "
                    : "text-gray-600"
                    }`}
            >
                English
            </button>

            <button
                type="button"
                onClick={() => changeLanguage("ur")}
                className={`px-3 py-1.5 rounded-full text-sm font-medium ${i18n.language === "ur"
                    ? "text-black "
                    : "text-gray-600"
                    }`}
            >
                اردو
            </button>
        </div>
    );
};

export default LanguageSwitcher;