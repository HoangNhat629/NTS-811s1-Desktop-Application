import axios from "axios";
import { config, baseURL } from "../../../utils/axiosConfig";
const getSysStat = async () => {
  try {
    const res = await axios.get(`${baseURL}/api/getsysstat`, config);
    // const res = {
    //   status: 200,
    //   statusText: "OK",
    //   headers: {},
    //   config: {},
    //   request: {},
    //   data: {
    //     success: true,
    //     message: "Get system status successful",
    //     data: {
    //       uptime: 12345,
    //       cpu_count: 3,
    //       ipaddr: "192.168.1.10",
    //       macaddr: "AA:BB:CC:DD:EE:FF",
    //       cpu_avg: {
    //         min_1: 1,
    //         min_5: 5,
    //         min_15: 15,
    //       },
    //       cpu_stat: {
    //         usage: 50,
    //         total: 150,
    //       },
    //       storage_stat: {
    //         free: 20 * (1024 * 1024),
    //         total: 150 * (1024 * 1024),
    //       },
    //       mem_stat: {
    //         usage: 30 * (1024 * 1024),
    //         total: 90 * (1024 * 1024),
    //       },
    //     },
    //   },
    // };
    if (res.status === 400) {
      throw new Error(res.data.message || "Bad Request");
    }

    return res.data.data;
  } catch (err) {
    throw new Error(
      err?.response?.data?.message || err.message || "Unknown error"
    );
  }
};

const getBoardinfo = async () => {
  try {
    const res = await axios.get(`${baseURL}/api/getboardinfo`, config);
    if (res.status === 400) {
      throw new Error(res.data.message || "Bad Request");
    }
    return res.data.data;
  } catch (err) {
    throw new Error(
      err?.response?.data?.message || err.message || "Unknown error"
    );
  }
};

const getRadInfo = async () => {
  try {
    const res = await axios.get(`${baseURL}/api/getradinfo`, config);
    if (res.status === 400) {
      throw new Error(res.data.message || "Bad Request");
    }
    return res.data.data;
  } catch (err) {
    throw new Error(
      err?.response?.data?.message || err.message || "Unknown error"
    );
  }
};

const getRadRssi = async () => {
  try {
    const res = await axios.get(`${baseURL}/api/getradrssi`, config);
    if (res.status === 400) {
      throw new Error(res.data.message || "Bad Request");
    }
    return res.data.data;
  } catch (err) {
    throw new Error(
      err?.response?.data?.message || err.message || "Unknown error"
    );
  }
};

//Get hardware status func
const getHwsStatus = async () => {
  try {
    const res = await axios.get(`${baseURL}/api/hwstatus`, config);
    // const res = {
    //   data: {
    //     success: true,
    //     message: "Retrieved system status successfully.",
    //     data: {
    //       u8Keypad: 1,
    //       u8ChSw: 1,
    //       u8PTT: 0,
    //       u8TPA: 1,
    //       u8Codec: 1,
    //       u8LCD: 1,
    //       u8IO4094: 0,
    //       u8Led: 1,
    //       u8BatLevel: 87,
    //       GPS: {
    //         stat: 1,
    //         num_satelite: 9,
    //         latitude: 21.028511,
    //         longitude: 105.804817,
    //       },
    //       PwrDSP: {
    //         stat: 1,
    //         voltage: 3.3,
    //         current: 0.12,
    //         wat: 0.396,
    //       },
    //       PwrADRV: {
    //         stat: 1,
    //         voltage: 5.0,
    //         current: 0.25,
    //         wat: 1.25,
    //       },
    //       PwrSYS: {
    //         stat: 1,
    //         voltage: 12.0,
    //         current: 0.5,
    //         wat: 6.0,
    //       },
    //       AMS_PS: {
    //         stat: 1,
    //         temperature: 45,
    //         uptime: 123456,
    //       },
    //       Modem_Components: {
    //         MDStat: 1,
    //         ADRV: 1,
    //         DSP: 1,
    //         RF: 0,
    //       },
    //     },
    //   },
    //   status: 200,
    //   statusText: "OK",
    //   headers: {},
    //   config: {},
    //   request: {},
    // };
    if (res.status === 400) {
      throw new Error(res.data.message || "Bad Request");
    }
    return res.data.data;
  } catch (err) {
    throw new Error(
      err?.response?.data?.message || err.message || "Unknown error"
    );
  }
};

export const systemStatusService = {
  getSysStat,
  getBoardinfo,
  getRadInfo,
  getRadRssi,
  getHwsStatus,
};
