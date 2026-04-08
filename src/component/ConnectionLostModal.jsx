import { useEffect, useRef } from "react";
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

  useEffect(() => {
    // Start 10 secs countdown
    timerRef.current = setTimeout(() => {
      if (!hasRespondedRef.current) {
        if (hasUnsavedData && onSaveDraft) {
          onSaveDraft();
        } else {
          onGoBackToConnection();
        }
      }
    }, 10000);

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [onGoBackToConnection, hasUnsavedData, onSaveDraft]);

  const handleContinueEditing = async () => {
    hasRespondedRef.current = true;
    if (hasUnsavedData && onSaveDraft) {
      await onSaveDraft();
    }
    onContinueEditing();
  };

  const handleGoBack = async () => {
    hasRespondedRef.current = true;
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

        <div className="connection-lost-timer">{t("auto_redirect_in")} 10s</div>
      </div>
    </div>
  );
};

export default ConnectionLostModal;
