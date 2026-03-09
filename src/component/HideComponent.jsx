import { useTranslation } from "react-i18next";

export const HideComponent = () => {
  const { t } = useTranslation();
  return (
    <div className="hide-component-container">
      <div className="hide-component-bg-decoration">
        <div className="hide-component-shape hide-component-shape-1"></div>
        <div className="hide-component-shape hide-component-shape-2"></div>
        <div className="hide-component-shape hide-component-shape-3"></div>
      </div>

      <div className="hide-component-content">
        <h2 className="hide-component-title">{t("hidden_component_title")}</h2>

        <p className="hide-component-description">
          {t("hidden_component_description")}
        </p>

        <div className="hide-component-info-box">
          <svg fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M5.293 7.707a1 1 0 010-1.414l2-2a1 1 0 111.414 1.414L7.414 7l1.293 1.293a1 1 0 01-1.414 1.414l-2-2a1 1 0 010-1.414zm4 0a1 1 0 010-1.414l2-2a1 1 0 111.414 1.414L11.414 7l1.293 1.293a1 1 0 01-1.414 1.414l-2-2a1 1 0 010-1.414zM7 12a1 1 0 11-2 0 1 1 0 012 0zm4 0a1 1 0 11-2 0 1 1 0 012 0z"
              clipRule="evenodd"
            />
          </svg>
          <span>{t("hide_component_info_box")}</span>
        </div>

        <div className="hide-component-loading-dots">
          <div className="hide-component-dot"></div>
          <div className="hide-component-dot"></div>
          <div className="hide-component-dot"></div>
        </div>
      </div>
    </div>
  );
};
