import { useContext } from "react";

export const useSessionTimeout = () => {
  const context = useContext(SessionTimeoutContext);
  if (!context) {
    throw new Error(
      "useSessionTimeout must be used within SessionTimeoutProvider"
    );
  }
  return context;
};
