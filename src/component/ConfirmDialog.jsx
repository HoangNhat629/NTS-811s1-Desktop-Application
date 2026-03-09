import { useTranslation } from "react-i18next";

export default function ConfirmDialog({
  show,
  message,
  onConfirm,
  onCancel,
  showCancel = true,
}) {
  const { t } = useTranslation();
  if (!show) return null;
  return (
    <div className="confirm-dialog-backdrop">
      <div className="confirm-dialog">
        <p>{message}</p>
        <div className="confirm-actions">
          <button onClick={onConfirm} className="btn btn-primary">
            {t("confirm")}
          </button>
          {showCancel && (
            <button onClick={onCancel} className="btn btn-secondary">
              {t("cancel")}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
