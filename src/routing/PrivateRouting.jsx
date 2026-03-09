import { Navigate } from "react-router-dom";

export const PrivateRouting = ({ children }) => {
  const getToken = localStorage.getItem("token_access");
  return getToken === null || getToken === undefined ? (
    <Navigate to="/" replace={true} />
  ) : (
    children
  );
};
