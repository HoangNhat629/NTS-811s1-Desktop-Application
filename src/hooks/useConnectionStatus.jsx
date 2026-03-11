import { useMemo } from "react";
import { baseURL } from "../utils/axiosConfig";

export const useConnectionStatus = () => {
  return useMemo(() => {
    try {
      const host = new URL(baseURL).hostname;
      return {
        connected: host !== "0.0.0.0",
        host,
      };
    } catch {
      return { connected: false, host: null };
    }
  }, [baseURL]);
};
