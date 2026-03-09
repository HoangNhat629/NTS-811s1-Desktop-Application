import { useState } from "react";
import { MdClose, MdFileUpload } from "react-icons/md";
import { useTranslation } from "react-i18next";
import "../assets/css/ExportModeModal.css";

export const ExportModeModal = ({ show, onClose, onExport, isLoading }) => {
  const { t } = useTranslation();
  const [selectedMode, setSelectedMode] = useState("editing");

  const handleExport = () => {
    if (selectedMode) {
      onExport(selectedMode);
    }
  };

  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-content export-mode-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <MdFileUpload style={{ marginRight: "8px" }} size={20} />
            {t("Export_Configuration")}
          </h5>
          <button className="btn-close" onClick={onClose} disabled={isLoading}>
            <MdClose size={24} />
          </button>
        </div>

        <div className="modal-body">
          <p className="export-mode-description">{t("Select_export_mode")}:</p>

          <div className="export-mode-options">
            {/* Option 1: Editing File */}
            <div
              className={`export-mode-option ${
                selectedMode === "editing" ? "selected" : ""
              }`}
              onClick={() => setSelectedMode("editing")}
              role="radio"
              aria-checked={selectedMode === "editing"}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedMode("editing")}
            >
              <div className="option-radio">
                <input
                  type="radio"
                  name="exportMode"
                  value="editing"
                  checked={selectedMode === "editing"}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="option-content">
                <div className="option-title">{t("Export_Editing_File")}</div>
                <div className="option-description">
                  {t("Export_Editing_File_Des")}
                </div>
              </div>
            </div>

            {/* Option 2: System File */}
            <div
              className={`export-mode-option ${
                selectedMode === "system" ? "selected" : ""
              }`}
              onClick={() => setSelectedMode("system")}
              role="radio"
              aria-checked={selectedMode === "system"}
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && setSelectedMode("system")}
            >
              <div className="option-radio">
                <input
                  type="radio"
                  name="exportMode"
                  value="system"
                  checked={selectedMode === "system"}
                  onChange={(e) => setSelectedMode(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              <div className="option-content">
                <div className="option-title">{t("Export_System_File")}</div>
                <div className="option-description">
                  {t("Export_System_File_Des")}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="modal-footer d-flex justify-content-end gap-2">
          <button
            className="btn btn-secondary"
            onClick={onClose}
            disabled={isLoading}
          >
            {t("cancel")}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={isLoading || !selectedMode}
          >
            {isLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2"></span>
                {t("Exporting")}
              </>
            ) : (
              <>
                <MdFileUpload style={{ marginRight: "5px" }} size={18} />
                {t("Export")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
