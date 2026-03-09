import { configureStore } from "@reduxjs/toolkit";
import systemStatusReduces from "./apis/SystemStatus/systemStatusSlice";
import configurationReduces from "./apis/Configuration/configurationSlice";

export const storeConfig = configureStore({
  reducer: {
    systemStatus: systemStatusReduces,
    Configuration: configurationReduces,
  },
});
