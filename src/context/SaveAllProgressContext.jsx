import { createContext, useContext, useState, useCallback } from "react";

const SaveAllProgressContext = createContext();

export const SaveAllProgressProvider = ({ children }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState({
    current: 0,
    total: 0,
    items: [], // { key, label, status: 'pending' | 'processing' | 'done' | 'failed', error }
    percentage: 0,
  });

  const initializeProgress = useCallback((items) => {
    setProgress({
      current: 0,
      total: items.length,
      items: items.map((item) => ({
        ...item,
        status: "pending",
        error: null,
      })),
      percentage: 0,
    });
  }, []);

  const updateItemStatus = useCallback((index, status, error = null) => {
    setProgress((prev) => {
      const newItems = [...prev.items];
      
      if (index < 0 || index >= newItems.length) {
        console.warn(`updateItemStatus called with invalid index ${index}`);
        return prev;
      }
      newItems[index] = {
        ...newItems[index],
        status,
        error,
      };

      const completed = newItems.filter((item) => item.status === "done" || item.status === "failed").length;
      const percentage = Math.round((completed / prev.total) * 100);

      return {
        ...prev,
        items: newItems,
        percentage,
      };
    });
  }, []);

  const incrementProgress = useCallback(() => {
    setProgress((prev) => ({
      ...prev,
      current: prev.current + 1,
    }));
  }, []);

  const startProcessing = useCallback(() => {
    setIsProcessing(true);
  }, []);

  const finishProcessing = useCallback(() => {
    setIsProcessing(false);
  }, []);

  const resetProgress = useCallback(() => {
    setProgress({
      current: 0,
      total: 0,
      items: [],
      percentage: 0,
    });
    setIsProcessing(false);
  }, []);

  return (
    <SaveAllProgressContext.Provider
      value={{
        isProcessing,
        progress,
        initializeProgress,
        updateItemStatus,
        incrementProgress,
        startProcessing,
        finishProcessing,
        resetProgress,
      }}
    >
      {children}
    </SaveAllProgressContext.Provider>
  );
};

export const useSaveAllProgress = () => {
  const context = useContext(SaveAllProgressContext);
  if (!context) {
    throw new Error("useSaveAllProgress must be used within SaveAllProgressProvider");
  }
  return context;
};
