import { createContext, useContext, useState, useCallback, useMemo } from "react";

const DefaultDataContext = createContext();

export const DefaultDataProvider = ({ children }) => {
  const [defaultData, setDefaultData] = useState(null);
  const [isDefaultMode, setIsDefaultMode] = useState(false);

  const activateDefaultMode = useCallback((data) => {
    setDefaultData(data);
    setIsDefaultMode(true);
  }, []);

  const resetToApiMode = useCallback(() => {
    setDefaultData(null);
    setIsDefaultMode(false);
  }, []);

  const value = useMemo(
    () => ({
      defaultData,
      isDefaultMode,
      activateDefaultMode,
      resetToApiMode,
    }),
    [defaultData, isDefaultMode, activateDefaultMode, resetToApiMode]
  );

  return (
    <DefaultDataContext.Provider value={value}>
      {children}
    </DefaultDataContext.Provider>
  );
};

export const useDefaultData = () => {
  const context = useContext(DefaultDataContext);
  if (!context) {
    throw new Error("useDefaultData must be used within DefaultDataProvider");
  }
  return context;
};
