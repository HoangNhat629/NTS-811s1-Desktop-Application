import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { MdError } from "react-icons/md";

const ConnectionLostModal = ({
  onContinueEditing,
  onGoBackToConnection,
  hasUnsavedData,
  onSaveDraft,
}) => {
  const { t } = useTranslation();
  const timerRef = useRef(null);
  const hasRespondedRef = useRef();
  const [timeLeft, setTimeLeft] = useState(10);

  useEffect(() => {
    // Start 10 secs countdown
    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          if (!hasRespondedRef.current) {
            // Clear the interval before calling the action
            if (timerRef.current) {
              clearInterval(timerRef.current);
              timerRef.current = null;
            }

            if (hasUnsavedData && onSaveDraft) {
              onSaveDraft();
            } else {
              onGoBackToConnection();
            }
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [onGoBackToConnection, hasUnsavedData, onSaveDraft]);

  const handleContinueEditing = async () => {
    hasRespondedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (hasUnsavedData && onSaveDraft) {
      await onSaveDraft();
    }
    onContinueEditing();
  };

  const handleGoBack = async () => {
    hasRespondedRef.current = true;
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (hasUnsavedData && onSaveDraft) {
      await onSaveDraft();
    }
    onGoBackToConnection();
  };

  return (
    <div className="connection-lost-modal-backdrop">
      <div className="connection-lost-modal">
        <div className="connection-lost-icon">
          <MdError size={48} color="#dc3545" />
        </div>
        <h3>{t("lost_connect")}</h3>
        <p>{t("lost_connect_description")}</p>

        <div className="connection-lost-details">
          <div className="detail-item">{t("lost_connect_detail_item_1")}</div>
          <div className="detail-item">{t("lost_connect_detail_item_2")}</div>
          <div className="detail-item">{t("lost_connect_detail_item_3")}</div>
        </div>

        <div className="connection-lost-actions">
          <button
            className="btn secondary"
            onClick={handleGoBack}
            disabled={hasRespondedRef.current}
          >
            {t("back_to_connection")}
          </button>
          <button
            className="btn primary"
            onClick={handleContinueEditing}
            disabled={hasRespondedRef.current}
          >
            {t("continue_editing")}
          </button>
        </div>

        <div className="connection-lost-timer">
          <div className="countdown-label">{t("auto_redirect_in")}</div>
          <div className="countdown-container">
            <svg
              className="countdown-circle"
              width="60"
              height="60"
              viewBox="0 0 60 60"
            >
              <circle
                cx="30"
                cy="30"
                r="26"
                stroke="#e0e0e0"
                strokeWidth="4"
                fill="none"
              />
              <circle
                cx="30"
                cy="30"
                r="26"
                stroke="#dc3545"
                strokeWidth="4"
                fill="none"
                strokeDasharray={`${2 * Math.PI * 26}`}
                strokeDashoffset={`${2 * Math.PI * 26 * (timeLeft / 10)}`}
                strokeLinecap="round"
                transform="rotate(-90 30 30)"
                style={{
                  transition: "stroke-dashoffset 1s linear",
                }}
              />
            </svg>
            <div className="countdown-text">{timeLeft}s</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConnectionLostModal;
