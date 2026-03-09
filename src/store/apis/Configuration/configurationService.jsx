import axios from "axios";
import { config, baseURL } from "../../../utils/axiosConfig";

//reboot data func for System screen in Configuration
const reboot = async () => {
  try {
    const res = await axios.post(
      `${baseURL}/api/reboot`,
      {
        rebootsec: "reboot_now",
        targetid: 9999,
      },
      config
    );
    // const res = {
    //   data: {
    //     success: true,
    //     message: "string",
    //     data: {
    //       timerequired: 30000,
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
    return res.data;
  } catch (err) {
    throw new Error(
      err?.response?.data?.message || err.message || "Unknown error"
    );
  }
};

//set sleep mode func
const setSleepMode = async () => {
  try {
    const res = await axios.post(
      `${baseURL}/api/sleepmode`,
      {
        sleep_mode: 0,
      },
      config
    );
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

//Get common params
const getCommonParams = async () => {
  try {
    const res = await axios.get(`${baseURL}/api/commonparams`, config);
    // const res = {
    //   data: {
    //     success: true,
    //     message: "string",
    //     data: {
    //       u8MyID: 0, // Inf // Input 0-255
    //       u8CallID: 99, // Inf // Input 0-255
    //       u8PowerMode: 3, // 1W: 0, 2W: 1, 5W: 2, 10W: 3 //
    //       u8Attr: 1, // SLAVE: 0, MASTER: 1 //
    //       u8Squelch: 2, //OPEN: 0, PILOT: 1, THRESHOLD: 2 //
    //       u8RXMode: 1, //NONE: 0, TX: 1, RX: 2, TXRX: 3 //
    //       u8LNA: 1, // ON: 0, OFF: 1 //
    //       u8HopRate: 0, // --hidden
    //       u8ManetID: 0, // --hidden
    //       u8AfhID: 0, // --hidden
    //       u8FreqMode: 0, //SIMPLEX: 0, DUPLEX: 1 //
    //       u8VoxMode: 2, //VOX level, OFF: 0, ON_1: 1, ..., ON_4: 4 //
    //       u8Remote: 0, //ON: 0, OFF: 1 //
    //       u8RXMT: 1, //NORMAL: 0, RECV_ONLY: 1 //
    //       u8Whisper: 0, //OFF: 0, ON: 1 //
    //       u8CurrentVolume: 8, //minimum: 0 - maximum: 9
    //       u16BeaconInterval: 30, //Interval between beacon transmissions (in seconds) 15-30-60s
    //       u8BeaconMode: 1, //OFF: 0, ON: 1
    //       u8VoiceTestMode: 2, //NONE: 0, SINE: 1, FIXED_VOICE: 2
    //       u8CompatibleMode: 1
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

//Set common params
const setCommonParams = async (dataSet) => {
  try {
    const res = await axios.post(
      `${baseURL}/api/commonparams`,
      dataSet,
      config
    );

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

//Get channel params
const getChannelParams = async (dataSet) => {
  try {
    const res = await axios.get(
      `${baseURL}/api/channelparams?channel=${dataSet.channel_id}`,
      config
    );
    // const res = {
    //   data: {
    //     success: true,
    //     message: "string",
    //     data: {
    //       u8Channel: 0, //// 0-99
    //       u8Waveform: 1, //// FIXC:1. FIXS: 2, ECC/C, ECC/S, VF1S, VH1S, AM, AFH, MANET: 9
    //       u8Protocol: 0, //// HOPPING: 0, FIXED_FREQ: 1, HOPPING_VIETTEL: 2
    //       u8EncryptMode: 0, //// NONE: 0, AES128: 1, AES256: 2
    //       u8AesKey: 0, //// Table 0 - Table 9
    //       u8Deskey: 0, //// Table 0 - Table 9
    //       u8NetAddr: 0, /// 0-255 ---------------?
    //       u8DataContent: 0, // --hidden
    //       u8HoppingTable: 0, //// 0-9
    //       u32FixedFreq: 5000, //// Freq input value ---------------?
    //       u8Vocoder: 2, ////MELPE 2400: 2, CVSD; 3, FIX-C: 4, G729: 5
    //       u32FreqMin: 1000, //// Infor
    //       u32FreqMax: 6000, // Infor
    //       u32ManetID: 0, //// 0-31
    //       u32ManetOLSR: 0, //// Distance: 0, SNR: 1
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

//Set channel params
const setChannelParams = async (dataSet) => {
  try {
    const res = await axios.post(
      `${baseURL}/api/channelparams`,
      dataSet,
      config
    );
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

export const getAllHopTable = async () => {
  const TABLE_COUNT = 10;

  return Promise.all(
    Array.from({ length: TABLE_COUNT }, (_, tbl_id) => getHopTable({ tbl_id }))
  );
};

//Get hop table
const getHopTable = async (dataSet) => {
  try {
    const res = await axios.get(
      `${baseURL}/api/hoptable?tbl_id=${dataSet.tbl_id}`,
      config
    );

    // const res = (() => {
    //   const tblId = dataSet.tbl_id;

    //   const step_min = 50_000;
    //   const cfg_step = step_min;

    //   const VALID_BANDS = [
    //     [30_000_000, 88_000_000],
    //     [108_000_000, 174_000_000],
    //     [225_000_000, 512_000_000],
    //   ];

    //   const selectedBand = tblId % 2 === 0 ? VALID_BANDS[0] : VALID_BANDS[2];

    //   const [bandMin, bandMax] = selectedBand;

    //   const freqs = [];
    //   for (let f = bandMin; f <= bandMax; f += cfg_step) {
    //     freqs.push(f);
    //   }

    //   const isLow = freqs.every((f) => f < 150_000_000);
    //   const isHigh = freqs.every((f) => f > 150_000_000);

    //   if (!isLow && !isHigh) {
    //     throw new Error("Invalid frequency set: mixed low/high bands");
    //   }
    //   return {
    //     data: {
    //       success: true,
    //       message: "OK",
    //       data: {
    //         tbl_id: tblId,
    //         num_freqs: freqs.length,
    //         freq_min: freqs[0],
    //         freq_max: freqs[freqs.length - 1],
    //         step_min: step_min,
    //         cfg_freq: freqs[0],
    //         cfg_step: cfg_step,
    //         freqs,
    //       },
    //     },
    //     status: 200,
    //     statusText: "OK",
    //     headers: {},
    //     config: {},
    //     request: {},
    //   };
    // })();

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

//Set hop table
const setHopTable = async (dataSet) => {
  try {
    const res = await axios.post(`${baseURL}/api/hoptable`, dataSet, config);
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

const getAllCryptoTables = async () => {
  try {
    const encTypes = [0, 1, 2];

    const results = await Promise.all(
      encTypes.map((enc_type) => getCryptoTable({ enc_type }))
    );

    return results;
  } catch (err) {
    throw err;
  }
};

const getCryptoTable = async (dataSet) => {
  try {
    const res = await axios.get(
      `${baseURL}/api/enctable?enc_type=${dataSet.enc_type}`,
      config
    );

    // const res = (() => {
    //   const enc_type = dataSet.enc_type; // 0 | 1 | 2

    //   const ENC_TYPE_MAP = {
    //     0: { keyType: "aes128", keyLength: 4 },
    //     1: { keyType: "aes256", keyLength: 8 },
    //     2: { keyType: "des", keyLength: 4 },
    //   };

    //   const { keyLength } = ENC_TYPE_MAP[enc_type] ?? ENC_TYPE_MAP[0];

    //   const genRandomHex = (length) =>
    //     Array.from({ length }, () =>
    //       Math.floor(Math.random() * 16)
    //         .toString(16)
    //         .toUpperCase(),
    //     ).join("");

    //   const hexToNumber = (hex) => parseInt(hex, 16);

    //   return {
    //     data: {
    //       success: true,
    //       message: "Get encrypt freqs successful",
    //       data: {
    //         enc_type,
    //         enc_tbl: Array.from({ length: 10 }, (_, tblId) => ({
    //           tbl_id: tblId,
    //           tbl_values: Array.from({ length: 8 }, () => {
    //             const hexKey = genRandomHex(keyLength);
    //             return hexToNumber(hexKey);
    //           }),
    //         })),
    //       },
    //     },
    //     status: 200,
    //     statusText: "OK",
    //     headers: {},
    //     config: {},
    //     request: {},
    //   };
    // })();

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

const setCryptoTable = async (dataSet) => {
  try {
    const res = await axios.post(`${baseURL}/api/enctable`, dataSet, config);

    if (res.status === 400) {
      throw new Error(res.data.message || "Bad Request");
    }
    return res.data.data;
  } catch (err) {
    throw new Error(err.message || "Set crypto table failed");
  }
};

const getChannelTable = async () => {
  try {
    const res = await axios.get(`${baseURL}/api/channeltable`, config);
    // const res = {
    //   data: {
    //     success: true,
    //     message: "string",
    //     data: {
    //       channel_tbl: Array(100)
    //         .fill(null)
    //         .map((_, i) => ({
    //           u8Channel: i, //
    //           u8Waveform: 1, //
    //           u8Vocoder: 4, //
    //           u8Protocol: 1, //
    //           u8EncryptMode: 2, //
    //           u8AesKey: Math.floor(Math.random() * 10), //
    //           u8Deskey: Math.floor(Math.random() * 10), //
    //           u8NetAddr: i, //
    //           u8DataContent: 0,
    //           u32FixedFreq: 414000000 + i * 1000000, //
    //           u32FreqMin: i % 2 === 0 ? 144000000 : 30000000,
    //           u32FreqMax: i % 2 === 0 ? 512000000 : 87975000,
    //           u8HoppingTable: Math.floor(Math.random() * 10), //
    //           u32ManetID: 1,
    //           u32ManetOLSR: 0,
    //         })),
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
    throw new Error(err.message || "Get channel parameters failed");
  }
};

const setChannelTable = async (dataSet) => {
  try {
    const res = await axios.post(
      `${baseURL}/api/channeltable`,
      dataSet,
      config
    );
    if (res.status === 400) {
      throw new Error(res.data.message || "Bad Request");
    }
    return res.data.data;
  } catch (err) {
    throw new Error(err.message || "Get channel parameters failed");
  }
};

export const configurationService = {
  reboot,
  setSleepMode,
  getCommonParams,
  setCommonParams,
  getChannelParams,
  setChannelParams,
  getAllHopTable,
  getHopTable,
  setHopTable,
  getCryptoTable,
  getAllCryptoTables,
  setCryptoTable,
  getChannelTable,
  setChannelTable,
};
