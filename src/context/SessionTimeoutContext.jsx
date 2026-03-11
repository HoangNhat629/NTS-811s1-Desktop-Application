import { createContext, useContext, useEffect, useState } from "react";
import { electronAPI } from "../tauri-shim";
import { useNavigate } from "react-router-dom";

const SessionTimeoutContext = createContext();

export const SessionTimeoutProvider = ({ children, onSessionExpired }) => {
  const [sessionValid, setSessionValid] = useState(null);

  useEffect(() => {
    const checkSessionTimeout = async () => {
      try {
        const closeTime = await electronAPI.readSessionCloseTime();

        if (closeTime) {
          const now = Date.now();
          const timeSinceClose = now - closeTime;
          const SESSION_TIMEOUT = 5 * 60 * 1000; // 5 minutes

          if (timeSinceClose > SESSION_TIMEOUT) {
            // Session expired, clear everything
            const keys = ["outletDisableState", "token_access", "apiBase"];
            keys.forEach(localStorage.removeItem.bind(localStorage));

            // Clear the close time
            await electronAPI.clearSessionCloseTime();
            setSessionValid(false);

            // Call the callback to handle navigation
            if (onSessionExpired) {
              onSessionExpired();
            }
          } else {
            // Session still valid
            console.log("Session restored within timeout window");
            await electronAPI.clearSessionCloseTime();
            setSessionValid(true);
          }
        } else {
          // No close time recorded, check if we have a token
          const token = localStorage.getItem("token_access");
          setSessionValid(!!token);
        }
      } catch (error) {
        console.error("Error checking session timeout:", error);
        // On error, assume session is valid to avoid blocking login
        setSessionValid(true);
      }
    };

    checkSessionTimeout();
  }, [onSessionExpired]);

  // Don't render children until we've checked session validity
  if (sessionValid === null) {
    return null; // or a loading spinner
  }

  return (
    <SessionTimeoutContext.Provider value={{ sessionValid }}>
      {children}
    </SessionTimeoutContext.Provider>
  );
};

export const useSessionTimeout = () => {
  const context = useContext(SessionTimeoutContext);
  if (!context) {
    throw new Error(
      "useSessionTimeout must be used within SessionTimeoutProvider"
    );
  }
  return context;
};
