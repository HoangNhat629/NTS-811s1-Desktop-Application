import {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
} from "react";
import { sleep } from "../helper/settingHelper";
import { toast } from "react-toastify";
const SaveAllContext = createContext();

const SAVE_DELAY_MS = 200;

export const SaveAllProvider = ({ children }) => {
  const [saveFunctions, setSaveFunctions] = useState({});

  const registerSaveFunction = useCallback((key, saveFunc) => {
    setSaveFunctions((prev) => ({
      ...prev,
      [key]: saveFunc,
    }));
  }, []);

  const unregisterSaveFunction = useCallback((key) => {
    setSaveFunctions((prev) => {
      const newFuncs = { ...prev };
      delete newFuncs[key];
      return newFuncs;
    });
  }, []);

  const executeAllSave = useCallback(async () => {
    const savePromises = Object.entries(saveFunctions).map(
      async ([key, saveFunc]) => {
        try {
          await saveFunc();
          return { key, status: "success" };
        } catch (err) {
          console.error(`Save function ${key} failed:`, err);
          return {
            key,
            status: "failed",
            error: err?.message || String(err),
          };
        }
      }
    );

    const results = await Promise.allSettled(savePromises);
    return results;
  }, [saveFunctions]);

  const executeAllSaveSequential = useCallback(
    async (onProgress) => {
      const entries = Object.entries(saveFunctions);
      const results = [];

      for (let i = 0; i < entries.length; i++) {
        const [key, saveFunc] = entries[i];

        try {
          onProgress?.({
            index: i,
            status: "processing",
          });

          const result = await saveFunc();
          toast.dismiss();

          const status =
            result?.status === "failed"
              ? "failed"
              : result?.status === "skipped"
              ? "skipped"
              : "done";

          onProgress?.({
            index: i,
            status,
            error: result?.message,
          });

          results.push({
            key,
            ...result,
          });
        } catch (err) {
          console.error(`Save ${key} failed`, err);

          onProgress?.({
            index: i,
            status: "failed",
            error: err?.message || String(err),
          });

          results.push({
            key,
            status: "failed",
          });
        }

        if (i < entries.length - 1) {
          await sleep(SAVE_DELAY_MS);
        }
      }

      return results;
    },
    [saveFunctions]
  );

  const value = useMemo(
    () => ({
      registerSaveFunction,
      unregisterSaveFunction,
      executeAllSave,
      executeAllSaveSequential,
      saveFunctions,
    }),
    [
      registerSaveFunction,
      unregisterSaveFunction,
      executeAllSave,
      executeAllSaveSequential,
      saveFunctions,
    ]
  );

  return (
    <SaveAllContext.Provider value={value}>{children}</SaveAllContext.Provider>
  );
};

export const useSaveAll = () => {
  const context = useContext(SaveAllContext);
  if (!context) {
    throw new Error("useSaveAll must be used within SaveAllProvider");
  }
  return context;
};
