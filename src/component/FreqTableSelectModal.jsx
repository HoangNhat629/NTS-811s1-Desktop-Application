import { useState, useEffect, useCallback } from "react";
import { MdSave, MdClose } from "react-icons/md";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import "../assets/css/FreqTableSelectModal.css";
import { TOAST_WARNING_ID } from "../constants/toastId";

export const FreqTableSelectModal = ({
  show,
  tables,
  onClose,
  onSave,
  isLoading,
}) => {
  const { t } = useTranslation();
  const [selectedTables, setSelectedTables] = useState([]);
  const [selectAll, setSelectAll] = useState(true);

  // Initialize all tables as selected
  useEffect(() => {
    if (show && tables && tables.length > 0) {
      const allTableIds = tables.map((_, idx) => idx);
      setSelectedTables(allTableIds);
      setSelectAll(true);
    }
  }, [show, tables]);

  const handleTableToggle = useCallback(
    (tableIdx) => {
      setSelectedTables((prev) => {
        const isSelected = prev.includes(tableIdx);
        let newSelected;
        if (isSelected) {
          newSelected = prev.filter((id) => id !== tableIdx);
        } else {
          newSelected = [...prev, tableIdx];
        }

        // Update selectAll checkbox state
        if (tables && newSelected.length === tables.length) {
          setSelectAll(true);
        } else {
          setSelectAll(false);
        }

        return newSelected;
      });
    },
    [tables],
  );

  const handleSelectAllToggle = useCallback(() => {
    if (selectAll) {
      setSelectedTables([]);
      setSelectAll(false);
    } else {
      const allTableIds = tables.map((_, idx) => idx);
      setSelectedTables(allTableIds);
      setSelectAll(true);
    }
  }, [selectAll, tables]);

  const handleSave = async () => {
    if (selectedTables.length === 0) {
      toast.warning(
        t("pleasSelectAtLeastOneTable") || "Please select at least one table",
        {
          toastId: TOAST_WARNING_ID,
        },
      );
      return;
    }

    try {
      await onSave(selectedTables);
      onClose();
    } catch (err) {
      console.error("Save error:", err);
    }
  };

  if (!show) return null;

  return (
    <div className="freq-table-select-modal-overlay">
      <div className="freq-table-select-modal">
        <div className="freq-table-select-modal-header">
          <h3>{"Select Frequency Tables to Save"}</h3>
          <button
            className="freq-table-select-modal-close"
            onClick={onClose}
            disabled={isLoading}
          >
            <MdClose size={24} />
          </button>
        </div>

        <div className="freq-table-select-modal-content">
          <div className="freq-table-select-all-section">
            <label className="freq-table-checkbox-wrapper">
              <input
                type="checkbox"
                checked={selectAll}
                onChange={handleSelectAllToggle}
                disabled={isLoading}
              />
              <span className="freq-table-checkbox-label">{"Select All"}</span>
            </label>
          </div>

          <div className="freq-table-select-list">
            {tables &&
              tables.map((table, idx) => (
                <label key={idx} className="freq-table-select-item">
                  <input
                    type="checkbox"
                    checked={selectedTables.includes(idx)}
                    onChange={() => handleTableToggle(idx)}
                    disabled={isLoading}
                  />
                  <span className="freq-table-select-item-label">
                    {t("Table")} {idx}
                  </span>
                </label>
              ))}
          </div>
        </div>

        <div className="freq-table-select-modal-footer">
          <button
            className="freq-table-select-modal-btn freq-table-select-modal-btn-cancel"
            onClick={onClose}
            disabled={isLoading}
          >
            {t("cancel") || "Cancel"}
          </button>
          <button
            className="freq-table-select-modal-btn freq-table-select-modal-btn-save"
            onClick={handleSave}
            disabled={isLoading || selectedTables.length === 0}
          >
            <MdSave style={{ marginRight: "5px" }} size={18} />
            {t("save") || "Save"}
          </button>
        </div>
      </div>
    </div>
  );
};
