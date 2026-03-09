import { createContext, useContext, useCallback, useMemo, useRef } from "react";

const EditingExportContext = createContext();

export const EditingExportProvider = ({ children }) => {
  const editingDataRef = useRef({
    generalConfiguration: null,
    channelParameters: null,
    frequencyTable: null,
    allCryptoTable: null,
  });

  const updateEditingData = useCallback((key, data) => {
    if (key && editingDataRef.current) {
      editingDataRef.current[key] = data;
    }
  }, []);

  const getEditingData = useCallback(() => {
    return {
      generalConfiguration:
        editingDataRef.current?.generalConfiguration || null,
      channelParameters: editingDataRef.current?.channelParameters || null,
      frequencyTable: editingDataRef.current?.frequencyTable || null,
      allCryptoTable: editingDataRef.current?.allCryptoTable || null,
    };
  }, []);

  const value = useMemo(
    () => ({
      updateEditingData,
      getEditingData,
    }),
    [updateEditingData, getEditingData]
  );
  return (
    <EditingExportContext.Provider value={value}>
      {children}
    </EditingExportContext.Provider>
  );
};

export const useEditingExport = () => {
  const context = useContext(EditingExportContext);
  if (!context) {
    throw new Error(
      "useEditingExport must be used within EditingExportProvider"
    );
  }
  return context;
};
