import {
  MdCancel,
  MdCheckCircle,
  MdMoreHoriz,
  MdRemoveCircleOutline,
} from "react-icons/md";
import { useSaveAllProgress } from "../context/SaveAllProgressContext";

export const SaveAllProgress = () => {
  const { isProcessing, progress } = useSaveAllProgress();

  if (!isProcessing) {
    return null;
  }

  return (
    <div className="save-all-progress-container">
      <div className="save-all-progress-header">
        <h6 className="save-all-progress-title">Saving configurations...</h6>
        <span className="save-all-progress-percentage">
          {progress.percentage}%
        </span>
      </div>

      <div className="save-all-progress-bar-wrapper">
        <div className="save-all-progress-bar-background">
          <div
            className="save-all-progress-bar-fill"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
      </div>

      <div className="save-all-progress-items">
        {progress.items.map((item, idx) => (
          <div
            key={idx}
            className={`save-all-progress-item save-all-progress-item-${item.status}`}
          >
            <div className="save-all-progress-item-left">
              <span className="save-all-progress-item-label">{item.label}</span>
              {item.error && (
                <span className="save-all-progress-item-error">
                  {item.error}
                </span>
              )}
            </div>
            <div className="save-all-progress-item-icon">
              {item.status === "pending" && (
                <span className="spinner-dots">
                  <MdMoreHoriz />
                </span>
              )}
              {item.status === "processing" && (
                <span className="spinner-pulse">◌</span>
              )}
              {item.status === "done" && (
                <span className="icon-check">
                  <MdCheckCircle />
                </span>
              )}
              {item.status === "failed" && (
                <span className="icon-cross">
                  <MdCancel />
                </span>
              )}
              {item.status === "skipped" && (
                <span className="icon-skip">
                  <MdRemoveCircleOutline />
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
