import { MdWarning } from "react-icons/md";
const ErrorToast = ({ title = "Invalid Configuration", conditions = [] }) => {
  const errors = conditions.filter((c) => c.condition);

  if (errors.length === 0) return null;

  return (
    <div
      className="position-absolute bg-danger text-white p-3 rounded shadow-lg animate__animated animate__fadeIn"
      style={{
        left: "50%",
        top: "5%",
        transform: "translateX(-50%)",
        zIndex: 1050,
        minWidth: "300px",
        maxWidth: "90%",
      }}
    >
      <strong className="d-block mb-2">
        <MdWarning style={{ fontSize: "25px", marginBottom: "3px" }} /> {title}
      </strong>
      <ul className="mb-0 ps-3 small">
        {errors.map((e, index) => (
          <li key={index}>{e.message}</li>
        ))}
      </ul>
    </div>
  );
};

export default ErrorToast;
