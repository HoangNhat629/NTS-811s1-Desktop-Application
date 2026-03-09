import { useTranslation } from "react-i18next";

export const PageNotFound = () => {
  const { t } = useTranslation();

  const ErrorIllustration = () => (
    <div className="error-illustration">
      <svg
        width="200"
        height="200"
        viewBox="0 0 200 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="error-svg"
      >
        {/* Outer circle background */}
        <circle cx="100" cy="100" r="95" className="outer-ring" />

        {/* Error icon - warning symbol */}
        <g className="error-icon">
          {/* Triangle */}
          <path d="M100 20 L180 160 L20 160 Z" className="triangle" />
          {/* Exclamation point */}
          <circle cx="100" cy="120" r="6" className="exclamation-dot" />
          <line
            x1="100"
            y1="85"
            x2="100"
            y2="110"
            className="exclamation-line"
          />
        </g>

        {/* Animated pulse circles */}
        <circle cx="100" cy="100" r="85" className="pulse-ring pulse-1" />
        <circle cx="100" cy="100" r="75" className="pulse-ring pulse-2" />
      </svg>
    </div>
  );

  return (
    <div className="not-found-wrapper">
      <div className="not-found-container">
        <div className="not-found-content">
          <ErrorIllustration />

          <div className="text-section">
            <h1 className="error-title">{t("lost_connect")}</h1>
            <p className="error-description">{t("lost_connect_description")}</p>

            <div className="error-details">
              <div className="detail-item">
                <span className="detail-icon">📡</span>
                <span>{t("lost_connect_detail_item_1")}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🌐</span>
                <span>{t("lost_connect_detail_item_2")}</span>
              </div>
              <div className="detail-item">
                <span className="detail-icon">🔋</span>
                <span>{t("lost_connect_detail_item_3")}</span>
              </div>
            </div>

            <div className="error-code-badge">
              {t("error_code")}: CONNECTION_FAILED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
