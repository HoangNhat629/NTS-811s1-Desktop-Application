import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SessionTimeoutProvider } from "./SessionTimeoutContext";

export const SessionTimeoutWrapper = ({ children }) => {
  const navigate = useNavigate();

  const handleSessionExpired = () => {
    // Navigate to login when session expires
    navigate("/", { replace: true });
  };

  return (
    <SessionTimeoutProvider onSessionExpired={handleSessionExpired}>
      {children}
    </SessionTimeoutProvider>
  );
};