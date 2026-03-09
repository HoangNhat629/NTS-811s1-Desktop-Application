import React, { createContext, useState, useCallback, useMemo } from "react";

export const OutletDisableContext = createContext();

const DISABLE_STATE_KEY = "outletDisableState";
const INITIAL_DISABLE_STATE = {
  radio: true,
  frequency: true,
  crypto: true,
  save_all: true,
};

export const OutletDisableProvider = ({ children }) => {
  const [disabledOutlets, setDisabledOutlets] = useState(() => {
    try {
      const stored = localStorage.getItem(DISABLE_STATE_KEY);
      return stored ? JSON.parse(stored) : INITIAL_DISABLE_STATE;
    } catch {
      return INITIAL_DISABLE_STATE;
    }
  });

  const enableOutlets = useCallback(() => {
    const newState = {
      radio: false,
      frequency: false,
      crypto: false,
      save_all: false,
    };
    setDisabledOutlets(newState);
    localStorage.setItem(DISABLE_STATE_KEY, JSON.stringify(newState));
  }, []);

  const disableOutlets = useCallback(() => {
    const newState = INITIAL_DISABLE_STATE;
    setDisabledOutlets(newState);
    localStorage.setItem(DISABLE_STATE_KEY, JSON.stringify(newState));
  }, []);

  const isOutletDisabled = useCallback(
    (outletName) => disabledOutlets[outletName] ?? true,
    [disabledOutlets],
  );

  const value = useMemo(
    () => ({
      disabledOutlets,
      enableOutlets,
      disableOutlets,
      isOutletDisabled,
    }),
    [disabledOutlets, enableOutlets, disableOutlets, isOutletDisabled],
  );

  return (
    <OutletDisableContext.Provider value={value}>
      {children}
    </OutletDisableContext.Provider>
  );
};

export const useOutletDisable = () => {
  const context = React.useContext(OutletDisableContext);
  if (!context) {
    throw new Error(
      "useOutletDisable must be used within OutletDisableProvider",
    );
  }
  return context;
};
