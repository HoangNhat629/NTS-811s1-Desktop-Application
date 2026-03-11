import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useCallback,
} from "react";
import { useNavigate } from "react-router-dom";

const IdleTimeoutContext = createContext();

export const IdleTimeoutProvider = ({ children }) => {
  const navigate = useNavigate();
  const timeoutRef = useRef(null);
  const lastActivityRef = useRef(Date.now());

  const IDLE_TIMEOUT = 30 * 60 * 1000; // 30 minutes

  const resetTimer = useCallback(() => {
    lastActivityRef.current = Date.now();

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      console.log("Idle timeout reached, logging out...");

      const keys = ["outletDisableState", "token_access", "apiBase"];
      keys.forEach(localStorage.removeItem.bind(localStorage));

      navigate("/", { replace: true });
    }, IDLE_TIMEOUT);
  }, [navigate]);

  const handleActivity = useCallback(() => {
    resetTimer();
  }, [resetTimer]);

  useEffect(() => {
    const token = localStorage.getItem("token_access");
    if (!token) return;

    // Setup event listeners for user activity
    const events = [
      "mousedown",
      "mousemove",
      "keypress",
      "scroll",
      "touchstart",
      "click",
      "input",
      "keydown",
      "keyup",
    ];

    events.forEach((event) => {
      document.addEventListener(event, handleActivity, true);
    });

    // Start the timer
    resetTimer();

    return () => {
      // Cleanup
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      events.forEach((event) => {
        document.removeEventListener(event, handleActivity, true);
      });
    };
  }, [handleActivity, resetTimer]);

  return (
    <IdleTimeoutContext.Provider value={{ resetTimer }}>
      {children}
    </IdleTimeoutContext.Provider>
  );
};

export const useIdleTimeout = () => {
  const context = useContext(IdleTimeoutContext);
  if (!context) {
    throw new Error("useIdleTimeout must be used within IdleTimeoutProvider");
  }
  return context;
};
