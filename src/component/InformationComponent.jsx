export const InformationComponent = ({ label, content }) => {
  return (
    <p className="d-flex justify-content-between">
      <span> {label} </span>
      <span>
        <b>{content}</b>
      </span>
    </p>
  );
};

export const ColTitle = ({ label }) => {
  return (
    <p className="col-title">
      <b>{label}</b>
    </p>
  );
};
