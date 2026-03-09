import { useDefaultData } from "../context/DefaultDataContext";

/**
 * Hook để các Outlet dùng default data khi active, hoặc gọi API bình thường
 * @param {Function} loadApiData - hàm để load từ API (chỉ gọi khi không ở default mode)
 * @param {String} dataKey - key của data trong defaultData (vd: 'generalConfiguration', 'frequencyTable', v.v)
 * @returns {Object} { isDefaultMode, shouldSkipApiCall, defaultValue }
 */
export const useDefaultDataMode = (loadApiData, dataKey) => {
  const { isDefaultMode, defaultData } = useDefaultData();

  // Nếu là default mode, trả về dữ liệu default thay vì gọi API
  if (isDefaultMode && defaultData && dataKey in defaultData) {
    return {
      isDefaultMode: true,
      shouldSkipApiCall: true,
      defaultValue: defaultData[dataKey],
    };
  }

  return {
    isDefaultMode: false,
    shouldSkipApiCall: false,
    defaultValue: null,
  };
};
