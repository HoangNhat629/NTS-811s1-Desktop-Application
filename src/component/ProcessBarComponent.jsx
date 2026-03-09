export const ProgressBarSection = ({ label, progress }) => {
  return (
    <>
      <div className="fw-semibold mb-1">
        <span className="text-danger">{label}</span>
      </div>
      <div
        className="loading-process-bar mb-3 rounded-pill"
        style={{ height: "18px" }}
      >
        <div
          className="bar rounded-pill"
          role="progressbar"
          style={{
            width: `${progress}%`,
            transition: "width 0.4s ease-in-out",
          }}
        ></div>
      </div>
    </>
  );
};

export const BarProcess = ({ title, total, process, option = "option1" }) => {
  const percent = ((process / total) * 100).toFixed(1);

  return (
    <div className="d-flex align-items-center justify-content-between">
      <p>{title}:</p>
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${percent}%` }}></div>
        <div className="progress-text">
          {option === "option1" &&
            `${(process / (1024 * 1024)).toFixed(2)}/
          ${(total / (1024 * 1024)).toFixed(2)} MB (${percent}%)`}
          {option === "option2" &&
            `${
              ((process * 100) / total).toFixed(1) +
              "% usr, " +
              (100 - (process * 100) / total).toFixed(1) +
              "% idle"
            }`}
        </div>
      </div>
    </div>
  );
};
