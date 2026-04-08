import {
  validFreq,
  VHF_UHF_BOUNDARY_MHZ,
  BAND,
  validFreqRange,
  UNIT_MULTIPLIER,
} from "../constants/validFreq";
import { electronAPI } from "../tauri-shim";

export async function loadXmlConfig() {
  if (electronAPI.readXmlConfig) {
    const xmlText = await electronAPI.readXmlConfig();

    if (!xmlText || typeof xmlText !== "string") {
      throw new Error("Failed to load XML config");
    }

    return xmlText;
  }

  const res = await fetch("/data/mission_schedule_config.xml");
  if (!res.ok) {
    throw new Error("Failed to fetch XML file");
  }
  return await res.text();
}

export async function readFileDraft() {
  if (!electronAPI.readFileDraft) {
    return {
      message: "Draft service unavailable",
      data: null,
      isExist: false,
    };
  }

  try {
    const draftFile = await electronAPI.readFileDraft();

    const isValid =
      draftFile &&
      typeof draftFile === "object" &&
      Object.keys(draftFile).length > 0 &&
      draftFile?.channelParameters.length > 0 &&
      draftFile?.frequencyTable.length > 0 &&
      draftFile?.cryptoTable;

    return {
      message: isValid ? "Draft restored" : "No saved draft",
      data: isValid ? draftFile : null,
      isExist: isValid,
    };
  } catch (error) {
    return {
      message: "No saved draft",
      data: null,
      isExist: false,
    };
  }
}

export async function getSecretKeyHelper(password) {
  const enc = new TextEncoder();

  const baseKey = await crypto.subtle.importKey(
    "raw",
    enc.encode(password),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("system-backup-salt"),
      iterations: 100000,
      hash: "SHA-256",
    },
    baseKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

export const formatIpAddressHelper = (value) => {
  return value
    .replace(/[^0-9.]/g, "")
    .replace(/(\.\.+)/g, ".")
    .replace(/^\./, "")
    .split(".")
    .slice(0, 4)
    .map((num) => (num.length > 3 ? num.slice(0, 3) : num))
    .join(".");
};

export const isValidIPv4Helper = (ip) => {
  const segments = ip.split(".");
  if (segments.length !== 4) return false;

  return segments.every((seg) => {
    if (!/^\d+$/.test(seg)) return false;
    if (seg.length > 1 && seg.startsWith("0")) return false;

    const num = parseInt(seg, 10);
    return num >= 0 && num <= 255;
  });
};

export const isValidFrequencyHelper = (freq) => {
  return validFreq.some((range) => freq >= range.min && freq <= range.max);
};

export const isValidateHexHelper = (value, bytes) => {
  const hexRegex = /^[0-9A-Fa-f]+$/;
  return hexRegex.test(value) && value.length === bytes * 2;
};

export const getBandFromFreqHelper = (freq) => {
  if (!freq || isNaN(freq)) return null;
  return freq < VHF_UHF_BOUNDARY_MHZ ? BAND.VHF : BAND.UHF;
};

export const validateFreqBandHelper = (bandMode, freq) => {
  const band = getBandFromFreqHelper(freq);
  if (!band) return { valid: false, reason: "INVALID_FREQ" };
  if (band !== bandMode)
    return { valid: false, reason: "OUT_OF_BAND", actualBand: band };
  return { valid: true };
};

export const validateSystemDataHelper = (data) => {
  const errors = [];
  if (!data || typeof data !== "object") {
    errors.push("Invalid data format");
    return errors;
  }

  // Validate general configuration
  if (data.generalConfiguration && data.generalConfiguration !== "object") {
    errors.push("Invalid General Configuration format");
  }

  // Validate general configuration
  if (data.channelConfiguration && data.channelConfiguration !== "object") {
    errors.push("Invalid Channel Configuration format");
  }

  // Validate frequency table
  if (data.frequencyTable && !Array.isArray(data.frequencyTable)) {
    errors.push("Invalid Frequency Table format");
  }

  // Validate channel configuration
  if (data.channelParameters && !Array.isArray(data.channelParameters)) {
    errors.push("Invalid Channel Parameters format");
  }

  // Validate crypto table
  if (data.cryptoTable) {
    if (!Array.isArray(data.cryptoTable)) {
      errors.push("Invalid Crypto Table format");
    } else if (data.cryptoTable.length !== 10) {
      errors.push(
        `Invalid Crypto Table: must have 10 tables, found ${data.cryptoTable.length}`
      );
    }
  }

  return errors;
};

export const createSystemDataPayloadHelper = ({
  generalConfiguration = {},
  frequencyTable = [],
  cryptoTable = [],
  channelParameters = [],
}) => {
  return {
    generalConfiguration,
    frequencyTable,
    cryptoTable,
    channelParameters,
    timestamp: new Date().toISOString(),
    version: "1.0",
  };
};

export const genRandomHexHelper = (length) =>
  Array.from({ length }, () =>
    Math.floor(Math.random() * 16)
      .toString(16)
      .toUpperCase()
  ).join("");

export const handleExportHelper = async (fileContent, name) => {
  try {
    if ("showSaveFilePicker" in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName: name,
        types: [
          {
            description: "JSON File",
            accept: {
              "application/json": [".json"],
            },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(fileContent);
      await writable.close();

      return;
    }

    const element = document.createElement("a");
    element.href =
      "data:text/plain;charset=utf-8," + encodeURIComponent(fileContent);
    element.download = name;
    element.click();
  } catch (err) {
    if (err.name !== "AbortError") {
      console.error("Export failed:", err);
    }
  }
};

export const parseFreqTableFromXmlHelper = async () => {
  try {
    const xmlText = await loadXmlConfig();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Invalid XML format");
    }

    const frequencyTables = [];
    const freqTableVHF = xmlDoc.querySelector("freqtableVHF");
    if (!freqTableVHF) {
      throw new Error("No freqtableVHF found in XML");
    }

    const freqTablesXml = freqTableVHF.querySelectorAll("FreqTable");

    freqTablesXml.forEach((table) => {
      const tableNumber = table.getAttribute("tableNumber");
      const fvals = Array.from(table.querySelectorAll("fval")).map(
        (fval) => parseInt(fval.textContent, 10) / 1000
      );

      if (fvals.length > 0) {
        frequencyTables.push({
          tableNumber: parseInt(tableNumber, 10),
          freqs: fvals,
        });
      }
    });

    return frequencyTables;
  } catch (error) {
    console.error("Error parsing frequency table XML:", error);
    throw error;
  }
};

export const parseCryptoTableFromXmlHelper = async () => {
  try {
    const xmlText = await loadXmlConfig();

    const xmlDoc = new DOMParser().parseFromString(xmlText, "text/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length) {
      throw new Error("Invalid XML format");
    }

    const parseKeyTable = (rootTag) => {
      const root = xmlDoc.querySelector(rootTag);
      if (!root) return [];

      return Array.from(root.querySelectorAll("KeyTableDetail"))
        .map((table) => {
          const kvals = Array.from(table.querySelectorAll("kval")).map(
            (k) => k.textContent
          );

          if (!kvals.length) return null;

          return {
            tableNumber: Number(table.getAttribute("tableNumber")),
            key: kvals,
          };
        })
        .filter(Boolean);
    };

    return {
      aes128: parseKeyTable("keyAes128"),
      aes256: parseKeyTable("keyAes256"),
      des: parseKeyTable("keyDes"),
    };
  } catch (error) {
    console.error("Error parsing crypto table XML:", error);
    throw error;
  }
};

export const parseGeneralConfigFromXmlHelper = async () => {
  try {
    const GENERAL_CONFIG_FIELD_MAP = {
      Attribute: "u8Attr",
      Squelch: "u8Squelch",
      RemotecControl: "u8Remote",
      Whisper: "u8Whisper",
      Retransmit: "u8Retransmit", //
      Time: "u8Time", //
      Power: "u8PowerMode",
      MachineID: "u8MyID",
      CallerID: "u8CallID",
      SoundFlag: "u8SoundFlag", //
      VOXMode: "u8VoxMode",
      VOXThreshold: "u8VOXThreshold", //
      LineIn: "u8LineIn", //
      AutoBacklight: "u8LightMode",
      VOXLevel: "u8VOXLevel", //
      VOXPowerLevel1: "u8PowerLevel1", //
      VOXPowerLevel2: "u8PowerLevel2", //
      VOXPowerLevel3: "u8PowerLevel3", //
      VOXPowerLevel4: "u8PowerLevel4", //
    };

    const xmlText = await loadXmlConfig();

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(xmlText, "text/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length > 0) {
      throw new Error("Invalid XML format");
    }

    const generalConfig = {};
    const otherConfig = xmlDoc.querySelector("otherconfig");
    if (!otherConfig) return generalConfig;

    Object.entries(GENERAL_CONFIG_FIELD_MAP).forEach(
      ([xmlField, systemField]) => {
        const element = otherConfig.querySelector(xmlField);
        if (!element) return;

        const rawValue = element.textContent.trim();
        generalConfig[systemField] = isNaN(rawValue)
          ? rawValue
          : Number(rawValue);
      }
    );
    return {
      ...generalConfig,
      u8Whisper: 0,
      u8Remote: 0,
      u8LNA: 1,
      u8CurrentVolume: 5,
      u16BeaconInterval: 30,
      u8Attr: 0,
      u8EnableEthernet: 1,
      u8Squelch: 2,
      u8CompatibleMode: 1,
    };
  } catch (error) {
    console.error("Error parsing general config XML:", error);
    throw error;
  }
};

export const parseChannelParametersFromXmlHelper = async () => {
  try {
    const xmlText = await loadXmlConfig();

    const xmlDoc = new DOMParser().parseFromString(xmlText, "text/xml");

    if (xmlDoc.getElementsByTagName("parsererror").length) {
      throw new Error("Invalid XML format");
    }

    const channelConfigs = xmlDoc.querySelectorAll(
      "channelParam > channelConfigs > ChannelConfig"
    );

    const getInt = (parent, tag, def = 0) =>
      Number(parent.querySelector(tag)?.textContent ?? def);

    return Array.from(channelConfigs).map((channelNode) => {
      const channelNumber = Number(
        channelNode.getAttribute("channelNumber") ?? 0
      );

      return {
        u8Channel: channelNumber,

        u8Waveform: 3,
        u8Vocoder: getInt(channelNode, "ma_thoai"),
        u8Protocol: getInt(channelNode, "giao_thuc"),

        u8EncryptMode: getInt(channelNode, "mat_ma_hoa_data"),
        u8AesKey: getInt(channelNode, "key_mat_ma_hoa_data"),
        u8Deskey: getInt(channelNode, "key_nhay_tan"),
        u8HoppingTable: getInt(channelNode, "  bang_nhay_tan"),

        u32FixedFreq: convertFromHz(
          getInt(channelNode, "tan_so_co_dinh"),
          "MHz"
        ),
        u8NetAddr: getInt(channelNode, "dia_chi_mang"),

        u8Band: getInt(channelNode, "dai_tan"),
        u8DataContent: 0,
        u32FreqMin: 30,
        u32FreqMax: 512,
        u32ManetID: 1,
        u32ManetOLSR: 0,
      };
    });
  } catch (error) {
    console.error("Error parsing channel parameters XML:", error);
    throw error;
  }
};

export const formatTableHelper = (tables) => {
  return (
    tables?.map((table) => ({
      ...table,
      freqs: (table?.freqs || []).map((f, idx) => ({
        idx,
        frequency: f,
      })),
    })) || []
  );
};

export const normalizeFrequencyHelper = (val) => {
  if (typeof val === "number") return convertToHz(val, "MHz");
  if (typeof val === "string") {
    const cleaned = val.replace(/[^0-9.]/g, "");
    return convertToHz(parseFloat(cleaned) || 0, "MHz");
  }
  if (typeof val === "object" && val !== null) {
    return normalizeFrequencyHelper(val.frequency);
  }
  return 0;
};

/**
 * Format exported data according to the new schema
 * Converts API response data to export format
 */
export const formatExportDataHelper = ({
  generalConfiguration = {},
  frequencyTable = [],
  cryptoTable = {},
  channelParameters = {},
}) => {
  // Format frequency table
  const formattedFreqTable = frequencyTable.map((table) => ({
    tbl_id: table.tbl_id ?? table.tableNumber ?? 0,
    num_freqs: table.num_freqs ?? table.freqs?.length ?? 0,
    freq_min: table.freq_min ?? 0,
    freq_max: table.freq_max ?? 0,
    step_min: table.step_min ?? 0,
    freqs: table.freqs,
  }));

  return {
    generalConfiguration,
    frequencyTable: formattedFreqTable,
    cryptoTable: cryptoTable,
    channelParameters: channelParameters,
    timestamp: new Date().toISOString(),
    version: "1.0",
  };
};

/**
 * Validate imported system data
 */
export const validateImportedDataHelper = (data) => {
  const errors = [];

  if (!data || typeof data !== "object") {
    errors.push("Invalid data format");
    return errors;
  }

  if (
    data.generalConfiguration &&
    typeof data.generalConfiguration !== "object"
  ) {
    errors.push("Invalid General Configuration format");
  }

  if (data.frequencyTable && !Array.isArray(data.frequencyTable)) {
    errors.push("Invalid Frequency Table format");
  }

  if (data.cryptoTable && !Array.isArray(data.cryptoTable)) {
    errors.push("Invalid Crypto Table format");
  }

  if (
    data.channelParameters &&
    (!data.channelParameters.channel_tbl ||
      !Array.isArray(data.channelParameters.channel_tbl))
  ) {
    errors.push("Invalid Channel Parameters format");
  }

  return errors;
};

/**
 * Parse imported data and convert to internal format for Default mode
 */
export const parseImportedDataHelper = (importedData) => {
  try {
    const ENC_TYPE_MAP = {
      0: "aes128",
      1: "aes256",
      2: "des",
    };

    const KEY_LENGTH_MAP = {
      aes128: 4,
      aes256: 8,
      des: 4,
    };

    const normalizeKey = (val, len) => {
      if (typeof val === "string") {
        return val.toUpperCase().padStart(len, "0");
      }
      return Number(val).toString(16).toUpperCase().padStart(len, "0");
    };
    const frequencyTable = Array.isArray(importedData.frequencyTable)
      ? importedData.frequencyTable.map((freq) => ({
          ...freq,
          freq_min: convertFromHz(freq.freq_min, "MHz"),
          freq_max: convertFromHz(freq.freq_max, "MHz"),
          step_min: convertFromHz(freq.step_min, "MHz"),
          freqs: freq.freqs.map((item) => convertFromHz(item, "MHz")),
        }))
      : [];

    const cryptoTable = {};

    if (Array.isArray(importedData.cryptoTable)) {
      importedData.cryptoTable.forEach((encItem) => {
        const encType = ENC_TYPE_MAP[encItem.enc_type] ?? "aes128";
        const keyLen = KEY_LENGTH_MAP[encType];

        cryptoTable[encType] = Array.isArray(encItem.enc_tbl)
          ? encItem.enc_tbl.map((tbl) => ({
              tbl_id: tbl.tbl_id ?? 0,
              key: Array.isArray(tbl.tbl_values)
                ? tbl.tbl_values.map((v) => normalizeKey(v, keyLen))
                : [],
            }))
          : [];
      });
    }

    return {
      generalConfiguration: importedData.generalConfiguration || {},
      frequencyTable,
      cryptoTable,
      channelParameters:
        importedData.channelParameters?.channel_tbl.map((ch) => ({
          ...ch,
          u32FixedFreq: convertFromHz(ch.u32FixedFreq, "MHz"),
        })) || [],
    };
  } catch (err) {
    console.error("Error parsing imported data:", err);
    throw new Error("Failed to parse imported data: " + err.message);
  }
};

/**
 * Handle file import from user
 */
export const handleImportFileHelper = () => {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json";
    input.style.display = "none";

    let isFileSelected = false;

    input.onchange = (e) => {
      isFileSelected = true;

      const file = e.target.files?.[0];
      if (!file) {
        reject(new Error("No file selected"));
        return;
      }

      const reader = new FileReader();

      reader.onload = (event) => {
        try {
          const content = JSON.parse(event.target.result);
          resolve({ file, content });
        } catch (err) {
          reject(new Error("Failed to parse JSON file: " + err.message));
        }
      };

      reader.onerror = () => {
        reject(new Error("Failed to read file"));
      };

      reader.readAsText(file);
    };

    const onFocusBack = () => {
      setTimeout(() => {
        if (!isFileSelected) {
          reject(new Error("File selection cancelled"));
        }
        window.removeEventListener("focus", onFocusBack);
      }, 300);
    };

    window.addEventListener("focus", onFocusBack);

    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  });
};

export const buildSaveSummaryMessageHelper = (summary, t) => {
  const lines = [];

  lines.push(
    `${t("Freq Tables Result")}: ${
      summary.success.length ? summary.success.join(", ") : ""
    }`
  );

  if (summary.failed.length) {
    lines.push(
      `${t("Failed")}: ${summary.failed
        .map((f) => `${f.id}${f.reason ? ` (${f.reason})` : ""}`)
        .join(", ")}`
    );
  }

  if (summary.skipped.length) {
    lines.push(
      `${t("Skipped")}: ${summary.skipped
        .map((s) => `${s.id}${s.reason ? ` (${s.reason})` : ""}`)
        .join(", ")}`
    );
  }

  return lines.join("\n");
};

export const validateChannelParams = (channels, t) => {
  const errors = [];

  channels.forEach((ch, idx) => {
    const channelNumber = ch.u8Channel ?? idx;
    const { u32FixedFreq: freq, u8Band: band, u8NetAddr: netAddr } = ch;

    const pushError = (condition, message) => {
      if (condition) {
        errors.push({
          condition: true,
          message,
        });
      }
    };

    pushError(
      netAddr < 0 || netAddr > 127,
      `${t(
        "network_address_out_of_range"
      )}: Channel ${channelNumber} (${netAddr})`
    );

    pushError(
      freq < validFreqRange.min || freq > validFreqRange.max,
      `${t("frequency_out_of_range")}: Channel ${channelNumber} (${freq})`
    );

    pushError(
      band === 0 && freq > VHF_UHF_BOUNDARY_MHZ,
      `${t(
        "frequency_band_mismatch"
      )}: Channel ${channelNumber} (VHF but ${freq})`
    );

    pushError(
      band === 1 && freq <= VHF_UHF_BOUNDARY_MHZ,
      `${t(
        "frequency_band_mismatch"
      )}: Channel ${channelNumber} (UHF but ${freq})`
    );
  });

  return errors;
};

const convertCryptoTable = (allCryptoTable) => {
  if (!allCryptoTable) return [];
  const ENC_TYPE_MAP = {
    aes128: 0,
    aes256: 1,
    des: 2,
  };
  return Object.entries(allCryptoTable).map(([keyType, tables]) => {
    const enc_type = ENC_TYPE_MAP[keyType];

    const enc_tbl = (tables || []).map((table, tblIndex) => ({
      tbl_id: tblIndex,
      tbl_values: table.map((item) => item[keyType]),
    }));

    return {
      enc_type,
      enc_tbl,
    };
  });
};

export const exportEditingFileHelper = async (editingData) => {
  try {
    const payload = {
      generalConfiguration: editingData?.generalConfiguration || null,
      frequencyTable:
        editingData?.frequencyTable.map((freq) => ({
          ...freq,
          freq_min: convertToHz(freq.freq_min, "MHz"),
          freq_max: convertToHz(freq.freq_max, "MHz"),
          step_min: convertToHz(freq.step_min, "MHz"),
          freqs: freq.freqs.map((item) => convertToHz(item, "MHz")),
        })) || [],
      cryptoTable: convertCryptoTable(editingData?.allCryptoTable),
      channelParameters: {
        channel_tbl:
          editingData?.channelParameters.map((ch) => ({
            ...ch,
            u32FixedFreq: convertToHz(ch.u32FixedFreq, "MHz"),
          })) || [],
      },
    };

    const jsonString = JSON.stringify(payload, null, 2);

    const fileName = `editing_config_${Math.floor(Date.now() / 1000)}.json`;

    if ("showSaveFilePicker" in window) {
      const handle = await window.showSaveFilePicker({
        suggestedName: fileName,
        types: [
          {
            description: "JSON File",
            accept: { "application/json": [".json"] },
          },
        ],
      });

      const writable = await handle.createWritable();
      await writable.write(jsonString);
      await writable.close();
    } else {
      const blob = new Blob([jsonString], {
        type: "application/json",
      });

      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
    }

    return true;
  } catch (error) {
    if (error.name !== "AbortError") {
      console.error("Failed to export editing file:", error);
    }
    throw error;
  }
};

export const sleep = (ms) => new Promise((res) => setTimeout(res, ms));

/**
 * Handle convert Hz, Mhz, KHz
 */
export const convertToHz = (freq, unit = "Hz") => {
  const value = Number(freq);
  if (Number.isNaN(value)) return 0;

  return round(value * (UNIT_MULTIPLIER[unit] || 1), 6);
};

export const convertFromHz = (freq, unit = "Hz") => {
  const value = Number(freq);
  if (Number.isNaN(value)) return 0;

  return round(value / (UNIT_MULTIPLIER[unit] || 1), 6);
};

export const round = (num, precision = 6) => {
  const factor = 10 ** precision;
  return Math.round((num + Number.EPSILON) * factor) / factor;
};
