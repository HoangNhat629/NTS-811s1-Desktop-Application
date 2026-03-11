import { useReducer, useEffect, useState, useCallback, useMemo } from "react";
import {
  MdSave,
  MdOutlineSettingsApplications,
  MdOutlineTableChart,
  MdSearch,
} from "react-icons/md";
import {
  getCommonParamsFunc,
  setCommonParamsFunc,
  getChannelTableFunc,
  setChannelTableFunc,
} from "../../store/apis/Configuration/configurationSlice";
import { useDispatch } from "react-redux";
import ErrorToast from "../../component/ErrorToastComponent";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  SelectField,
  CheckboxField,
  InputChannelParameters,
  SelectChannelParameters,
} from "../../component/SettingComponent";
import { VHF_UHF_BOUNDARY_MHZ } from "../../constants/validFreq";
import { useDefaultDataMode } from "../../hooks/useDefaultDataMode";
import { useSaveAll } from "../../context/SaveAllContext";
import { useOutletDisable } from "../../context/OutletDisableContext";
import { useEditingExport } from "../../context/EditingExportContext";
import { sleep, validateChannelParams } from "../../helper/settingHelper";
import { HideComponent } from "../../component/HideComponent";
import { TOAST_ERROR_ID, TOAST_SUCCESS_ID } from "../../constants/toastId";
import ConfirmDialog from "../../component/ConfirmDialog";

export const RadioPage = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const initialGeneralState = {
    u8MyID: 0,
    u8CallID: 0,
    u8PowerMode: 0,
    u8Attr: 0,
    u8Squelch: 0,
    u8RXMode: 0,
    u8LNA: 0,
    u8HopRate: 0, // --hidden
    u8ManetID: 0, // --hidden
    u8AfhID: 0, // --hidden
    u8FreqMode: 0,
    u8VoxMode: 0,
    u8Remote: 0,
    u8Whisper: 0,
    u8RXMT: 0, //NORMAL: 0, RECV_ONLY: 1 //
    u8CurrentVolume: 0,
    u16BeaconInterval: 0,
    u8BeaconMode: 0,
    u8VoiceTestMode: 0,
    u8GainRx: 0,
    u8EnableGPS: 0,
    u8EnableEthernet: 0,
    u8EnableNearMode: 0,
    u8LightMode: 0,
    u8MicLevel: 0,
    u8CompatibleMode: 0,
  };

  const stateReducer = (state, action) => {
    switch (action.type) {
      case "UPDATE_FIELD":
        return {
          ...state,
          [action.payload.name]: action.payload.value,
        };
      case "SET_ALL":
        return { ...state, ...action.payload };
      default:
        return state;
    }
  };

  const [generalData, dispatchGeneral] = useReducer(
    stateReducer,
    initialGeneralState
  );

  const [channelsParamters, setChannelsParamters] = useState([]);
  const [searchChannel, setSearchChannel] = useState("");
  const [currentPage, setCurrentPage] = useState(0);
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    showCancel: true,
  });

  const ITEMS_PER_PAGE = 10;

  const { isOutletDisabled } = useOutletDisable();
  const isRadioDisabled = isOutletDisabled("radio");
  const { updateEditingData } = useEditingExport();

  const generalDefaultMode = useDefaultDataMode(
    () => loadGeneralConfigurationData(),
    "generalConfiguration"
  );
  const channelDefaultMode = useDefaultDataMode(
    () => loadAllChannelConfigurationData(),
    "channelParameters"
  );

  const filteredChannels = searchChannel.trim()
    ? channelsParamters
        .map((ch, index) => ({ ...ch, __originIndex: index }))
        .filter((ch) => String(ch.u8Channel).includes(searchChannel))
    : channelsParamters.map((ch, index) => ({
        ...ch,
        __originIndex: index,
      }));

  const totalPages = Math.ceil(filteredChannels.length / ITEMS_PER_PAGE);
  const startIdx = currentPage * ITEMS_PER_PAGE;
  const paginatedChannels = (
    Array.isArray(filteredChannels) ? filteredChannels : []
  ).slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleSearchChange = (e) => {
    const { value } = e.target;
    if (/^\d*$/.test(value)) {
      setSearchChannel(value);
      setCurrentPage(0);
    }
  };

  const handlePageNav = (direction) => {
    if (direction === "prev" && currentPage > 0) {
      setCurrentPage(currentPage - 1);
    } else if (direction === "next" && currentPage < totalPages - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const SELECT_FIELD_CONFIGS = {
    powerMode: [
      { value: 0, label: "1W" },
      { value: 1, label: "2W" },
      { value: 2, label: "5W" },
      { value: 3, label: "10W" },
    ],
    squelch: [
      { value: 0, label: "OPEN" },
      { value: 1, label: "PILOT" },
      { value: 2, label: "THRESHOLD" },
    ],
    afhID: Array.from({ length: 8 }, (_, i) => ({ value: i, label: `${i}` })),
    manetID: Array.from({ length: 32 }, (_, i) => ({
      value: i,
      label: `${i}`,
    })),
    gainRx: Array.from({ length: 10 }, (_, i) => ({ value: i, label: `${i}` })),
    voxMode: [
      { value: 0, label: "OFF" },
      { value: 1, label: "ON_1" },
      { value: 2, label: "ON_2" },
      { value: 3, label: "ON_3" },
      { value: 4, label: "ON_4" },
    ],
    currentVolume: Array.from({ length: 10 }, (_, i) => ({
      value: i,
      label: `${i}`,
    })),
    rxMode: [
      { value: 0, label: "TX/RX" },
      { value: 1, label: "RCV" },
      { value: 2, label: "RXMT" },
    ],
    freqMode: [{ value: 0, label: "SIMPLEX" }],
    beaconInterval: [
      { value: 15, label: "15s" },
      { value: 30, label: "30s" },
      { value: 60, label: "60s" },
    ],
    attribute: [
      { value: 0, label: "SLAVE" },
      { value: 1, label: "MASTER" },
    ],
    voiceTestMode: [
      { value: 0, label: "NONE" },
      { value: 1, label: "SINE" },
      { value: 2, label: "FIXED_VOICE" },
    ],
  };

  const CHANNEL_ENUMS_SELECT_FIELD = {
    u8Band: [
      { value: 0, label: "VHF" },
      { value: 1, label: "UHF" },
    ],
    u8Protocol: [
      { value: 0, label: "HOPPING" },
      { value: 1, label: "FIXED_FREQ" },
    ],

    u8Vocoder: [
      { value: 2, label: "MELPE 2400" },
      { value: 3, label: "CVSD" },
      { value: 4, label: "FIX-C" },
      { value: 5, label: "G729" },
    ],
    encryptMode: [
      { value: 0, label: "AES-128" },
      { value: 1, label: "AES-256" },
      { value: 2, label: "DES" },
    ],
    u8Waveform: [
      { value: 1, label: "FIX-C" },
      { value: 2, label: "FIX-S" },
      { value: 3, label: "ECC-C" },
      { value: 4, label: "ECC-S" },
      { value: 5, label: "VF1-S" },
      { value: 6, label: "VH1-S" },
      { value: 7, label: "AM" },
      { value: 8, label: "AFH" },
      { value: 9, label: "MANET" },
    ],
    u8EncryptMode: [
      { value: 0, label: "NONE" },
      { value: 1, label: "AES-128" },
      { value: 2, label: "AES-256" },
    ],
    u32ManetOLSR: [
      { value: 0, label: "Distance" },
      { value: 1, label: "SNR" },
    ],
  };

  const VOCODER_RULES = {
    1: [4], // FIX-C → FIX-C
    7: [4], // AM → FIX-C

    2: [3], // FIX-S → CVSD
    3: [3], // ECC-C → CVSD
    4: [3], // ECC-S → CVSD
    8: [3], // AFH → CVSD

    5: [2, 3], // VF1-S → MELPE + CVSD
    6: [2, 3], // VH1-S → MELPE + CVSD

    9: [5], // MANET → G729
  };

  const getAllowedVocoderOptions = (waveform) => {
    const allowed = VOCODER_RULES[waveform];
    if (!allowed) return CHANNEL_ENUMS_SELECT_FIELD.u8Vocoder;

    return CHANNEL_ENUMS_SELECT_FIELD.u8Vocoder.filter((v) =>
      allowed.includes(v.value)
    );
  };

  useEffect(() => {
    if (
      !generalDefaultMode.shouldSkipApiCall &&
      !channelDefaultMode.shouldSkipApiCall
    ) {
      loadGeneralConfigurationData();
      loadAllChannelConfigurationData();
    }
    // eslint-disable-next-line
  }, [
    generalDefaultMode.shouldSkipApiCall,
    channelDefaultMode.shouldSkipApiCall,
  ]);

  useEffect(() => {
    if (
      generalDefaultMode.shouldSkipApiCall &&
      generalDefaultMode.defaultValue
    ) {
      const config = generalDefaultMode.defaultValue;

      const nextState = Object.keys(initialGeneralState).reduce((acc, key) => {
        acc[key] = key in config ? config[key] : 0;
        return acc;
      }, {});

      dispatchGeneral({
        type: "SET_ALL",
        payload: nextState,
      });
    }
  }, [generalDefaultMode.shouldSkipApiCall, generalDefaultMode.defaultValue]);

  useEffect(() => {
    if (
      channelDefaultMode.shouldSkipApiCall &&
      channelDefaultMode.defaultValue
    ) {
      if (Array.isArray(channelDefaultMode.defaultValue)) {
        const fixed = channelDefaultMode.defaultValue.map(normalizeChannel);
        setChannelsParamters(fixed);
        setCurrentPage(0);
        setSearchChannel("");
      }
    }
  }, [channelDefaultMode.shouldSkipApiCall, channelDefaultMode.defaultValue]);

  // Update editing export context whenever data changes
  useEffect(() => {
    updateEditingData("generalConfiguration", generalData);
  }, [generalData, updateEditingData]);

  useEffect(() => {
    updateEditingData("channelParameters", channelsParamters);
  }, [channelsParamters, updateEditingData]);

  const handleGeneralChange = (e) => {
    const { name, type, value, checked } = e.target;

    const newValue = type === "checkbox" ? +checked : Number(value);

    const updates = [{ name, value: newValue }];

    if (name === "u8RXMode") {
      const u8RXMTVal = Number(value) === 2 ? 1 : 0;
      updates.push({ name: "u8RXMT", value: u8RXMTVal });
    }

    updates.forEach((u) =>
      dispatchGeneral({
        type: "UPDATE_FIELD",
        payload: u,
      })
    );
  };

  const normalizeChannel = (ch) => {
    const allowed = VOCODER_RULES[ch.u8Waveform];
    if (!allowed) return ch;

    if (!allowed.includes(ch.u8Vocoder)) {
      return {
        ...ch,
        u8Vocoder: allowed[0],
      };
    }

    return ch;
  };

  const handleChannelParametersChange = (channelIdx, field, value) => {
    setChannelsParamters((prev) =>
      prev.map((ch, tIdx) => {
        if (tIdx !== channelIdx) return ch;

        const next = { ...ch, [field]: value };

        // if (field === "u32FixedFreq" && typeof value === "number") {
        //   next.u8Band = value < VHF_UHF_BOUNDARY_MHZ ? 0 : 1;
        // }

        if (field === "u8Waveform") {
          const allowed = VOCODER_RULES[value];
          if (allowed && !allowed.includes(ch.u8Vocoder)) {
            next.u8Vocoder = allowed[0];
          }
        }

        return next;
      })
    );
  };

  const loadGeneralConfigurationData = async () => {
    try {
      const res = await dispatch(getCommonParamsFunc()).unwrap();
      dispatchGeneral({ type: "SET_ALL", payload: res });
    } catch (err) {
      console.log(err.message || err || "An error occurred. Please try again.");
      return;
    }
  };

  const loadAllChannelConfigurationData = async () => {
    try {
      const res = await dispatch(getChannelTableFunc()).unwrap();
      setChannelsParamters(res?.channel_tbl || []);
    } catch (err) {
      console.log(err.message || err || "An error occurred. Please try again.");
      return;
    }
  };

  const handleSaveGeneralConf = useCallback(async () => {
    try {
      await dispatch(setCommonParamsFunc(generalData)).unwrap();
      setConfirmDialog({
        show: true,
        message: "General configuration updated successfully.",
        onConfirm: async () => {
          setConfirmDialog({ show: false });
        },
        showCancel: false,
      });
    } catch (err) {
      console.log(err.message || err || "An error occurred. Please try again.");
      toast.error("Save general configuration failed", {
        toastId: TOAST_ERROR_ID,
      });
      return;
    } finally {
      loadGeneralConfigurationData();
    }
  }, [generalData, dispatch]);

  const handleSaveChannelParameters = useCallback(async () => {
    if (!channelsParamters.length) {
      toast.error("Channel table is empty", {
        toastId: TOAST_ERROR_ID,
      });
      return;
    }
    try {
      const payload = {
        num_chan: channelsParamters.length,
        channel_tbl: channelsParamters.map((ch, idx) => ({
          ...ch,
          u8Channel: ch.u8Channel ?? idx,
        })),
      };

      await dispatch(setChannelTableFunc(payload)).unwrap();
      setConfirmDialog({
        show: true,
        message: "Channel table configuration saved successfully.",
        onConfirm: async () => {
          setConfirmDialog({ show: false });
        },
        showCancel: false,
      });
    } catch (err) {
      console.log(err.message || err || "An error occurred. Please try again.");
      toast.error("Save channel parameters failed", {
        toastId: TOAST_ERROR_ID,
      });
      return;
    }
  }, [channelsParamters, dispatch]);

  const handleSaveRadioAll = useCallback(async () => {
    console.log("Saving all radio configurations...");
    try {
      await dispatch(setCommonParamsFunc(generalData)).unwrap();

      await sleep(100);

      await dispatch(
        setChannelTableFunc({
          num_chan: channelsParamters.length,
          channel_tbl: channelsParamters.map((ch, idx) => ({
            ...ch,
            u8Channel: ch.u8Channel ?? idx,
          })),
        })
      ).unwrap();

      toast.success("Saved radio successfully", {
        toastId: TOAST_SUCCESS_ID,
      });
    } catch (err) {
      console.error("Save all radio config failed:", err);
      throw err;
    }
  }, [generalData, channelsParamters, dispatch, t]);

  const { registerSaveFunction, unregisterSaveFunction } = useSaveAll();

  useEffect(() => {
    registerSaveFunction("radio", handleSaveRadioAll);
    return () => unregisterSaveFunction("radio");
  }, [handleSaveRadioAll, registerSaveFunction, unregisterSaveFunction]);

  const channelErrors = useMemo(
    () => validateChannelParams(channelsParamters, t),
    [channelsParamters, t]
  );

  return (
    <>
      <ConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
        showCancel={confirmDialog.showCancel}
      />
      <ErrorToast
        conditions={[
          {
            condition: 99 < generalData.u8MyID,
            message: t("messMyID"),
          },
          {
            condition: 99 < generalData.u8CallID,
            message: t("messCallID"),
          },
          ...channelErrors,
        ]}
      />

      <div className="pt-2 d-flex flex-column h-100 justify-content-between custom-scroll">
        {isRadioDisabled ? (
          <HideComponent />
        ) : (
          <>
            <div className="system-info mt-1">
              <h3>
                <MdOutlineSettingsApplications
                  style={{ margin: "0 5px 5px 0" }}
                  size={20}
                />
                {t("general_configuration")}
              </h3>
              <div className="d-flex w-100 justify-content-around align-item-center my-1">
                <div className="d-flex w-25 flex-column gap-2">
                  <div className="d-flex justify-content-between w-100 align-items-center">
                    <label htmlFor="u8MyID" className="px-2 w-50">
                      {t("MyID")}
                    </label>
                    <input
                      type="text"
                      id="u8MyID"
                      name="u8MyID"
                      value={generalData.u8MyID ?? ""}
                      className="form-control form-control-sm w-50"
                      placeholder="0"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^\d*$/.test(v)) {
                          handleGeneralChange({
                            target: { name: "u8MyID", value: Number(v || 0) },
                          });
                        }
                      }}
                      maxLength={2}
                    />
                  </div>
                  <div className="d-flex justify-content-between w-100 align-items-center">
                    <label htmlFor="u8CallID" className="px-2 w-50">
                      {t("CallID")}
                    </label>
                    <input
                      type="text"
                      id="u8CallID"
                      name="u8CallID"
                      value={generalData.u8CallID ?? ""}
                      className="form-control form-control-sm w-50"
                      placeholder="0"
                      onChange={(e) => {
                        const v = e.target.value;
                        if (/^\d*$/.test(v)) {
                          handleGeneralChange({
                            target: { name: "u8CallID", value: Number(v || 0) },
                          });
                        }
                      }}
                      maxLength={2}
                    />
                  </div>
                  <SelectField
                    label={t("AFHID")}
                    id="u8AfhID"
                    name="u8AfhID"
                    value={generalData.u8AfhID}
                    onChange={handleGeneralChange}
                    options={SELECT_FIELD_CONFIGS.afhID}
                  />
                  <SelectField
                    label={t("ManetID")}
                    id="u8ManetID"
                    name="u8ManetID"
                    value={generalData.u8ManetID}
                    onChange={handleGeneralChange}
                    options={SELECT_FIELD_CONFIGS.manetID}
                  />
                  <SelectField
                    label={t("PowerMode")}
                    id="u8PowerMode"
                    name="u8PowerMode"
                    value={generalData.u8PowerMode}
                    onChange={handleGeneralChange}
                    options={SELECT_FIELD_CONFIGS.powerMode}
                  />
                  <SelectField
                    label={t("Squelch")}
                    id="u8Squelch"
                    name="u8Squelch"
                    value={generalData.u8Squelch}
                    onChange={handleGeneralChange}
                    options={SELECT_FIELD_CONFIGS.squelch}
                  />
                  {/* <SelectField
                    label={t("GainRx")}
                    id="u8GainRx"
                    name="u8GainRx"
                    value={generalData.u8GainRx}
                    onChange={handleGeneralChange}
                    options={SELECT_FIELD_CONFIGS.gainRx}
                  />
                  <CheckboxField
                    label={t("NearMode")}
                    id="u8EnableNearMode"
                    name="u8EnableNearMode"
                    checked={generalData.u8EnableNearMode}
                    onChange={handleGeneralChange}
                  /> */}
                </div>
                <div className="d-flex w-25 flex-column gap-2">
                  <SelectField
                    label={t("VoxMode")}
                    id="u8VoxMode"
                    name="u8VoxMode"
                    value={generalData.u8VoxMode}
                    onChange={handleGeneralChange}
                    options={SELECT_FIELD_CONFIGS.voxMode}
                  />
                  <SelectField
                    label={t("CurrentVolume")}
                    id="u8CurrentVolume"
                    name="u8CurrentVolume"
                    value={generalData.u8CurrentVolume}
                    onChange={handleGeneralChange}
                    options={SELECT_FIELD_CONFIGS.currentVolume}
                  />
                  <SelectField
                    label={t("RXMode")}
                    id="u8RXMode"
                    name="u8RXMode"
                    value={generalData.u8RXMode}
                    onChange={handleGeneralChange}
                    options={SELECT_FIELD_CONFIGS.rxMode}
                  />
                  <SelectField
                    label={t("FreqMode")}
                    id="u8FreqMode"
                    name="u8FreqMode"
                    value={generalData.u8FreqMode}
                    onChange={handleGeneralChange}
                    options={SELECT_FIELD_CONFIGS.freqMode}
                  />
                  <CheckboxField
                    label={t("BeaconMode")}
                    id="u8BeaconMode"
                    name="u8BeaconMode"
                    checked={generalData.u8BeaconMode}
                    onChange={handleGeneralChange}
                  />
                  <SelectField
                    label={t("BeaconInterval")}
                    id="u16BeaconInterval"
                    name="u16BeaconInterval"
                    value={generalData.u16BeaconInterval}
                    onChange={handleGeneralChange}
                    options={SELECT_FIELD_CONFIGS.beaconInterval}
                  />
                </div>
                <div className="d-flex w-25 flex-column gap-2">
                  <SelectField
                    label={t("Attribute")}
                    id="u8Attr"
                    name="u8Attr"
                    value={generalData.u8Attr}
                    onChange={handleGeneralChange}
                    options={SELECT_FIELD_CONFIGS.attribute}
                  />
                  <CheckboxField
                    label={t("Remote")}
                    id="u8Remote"
                    name="u8Remote"
                    checked={generalData.u8Remote}
                    onChange={handleGeneralChange}
                  />
                  <CheckboxField
                    label={t("Whisper")}
                    id="u8Whisper"
                    name="u8Whisper"
                    checked={generalData.u8Whisper}
                    onChange={handleGeneralChange}
                  />
                  {/* <SelectField
                    label={t("VoiceTestMode")}
                    id="u8VoiceTestMode"
                    name="u8VoiceTestMode"
                    value={generalData.u8VoiceTestMode}
                    onChange={handleGeneralChange}
                    options={SELECT_FIELD_CONFIGS.voiceTestMode}
                  /> */}
                  <CheckboxField
                    label={t("EnableEthernet")}
                    id="u8EnableEthernet"
                    name="u8EnableEthernet"
                    checked={generalData.u8EnableEthernet}
                    onChange={handleGeneralChange}
                  />
                  <CheckboxField
                    label={t("EnableGPS")}
                    id="u8EnableGPS"
                    name="u8EnableGPS"
                    checked={generalData.u8EnableGPS}
                    onChange={handleGeneralChange}
                  />
                  <CheckboxField
                    label={t("LightMode")}
                    id="u8LightMode"
                    name="u8LightMode"
                    checked={generalData.u8LightMode}
                    onChange={handleGeneralChange}
                  />
                  <CheckboxField
                    label={t("CMPT")}
                    id="u8CompatibleMode"
                    name="u8CompatibleMode"
                    checked={generalData.u8CompatibleMode}
                    onChange={handleGeneralChange}
                  />
                  {/* <CheckboxField
                    label={t("LNA")}
                    id="u8LNA"
                    name="u8LNA"
                    checked={generalData.u8LNA}
                    onChange={handleGeneralChange}
                  /> */}
                </div>
              </div>
              <div className="d-flex justify-content-end align-items-center p-2 mx-3">
                <button
                  className="dev-action-button me-5 px-5"
                  disabled={
                    99 < generalData.u8MyID || 99 < generalData.u8CallID
                  }
                  onClick={handleSaveGeneralConf}
                >
                  <MdSave style={{ marginRight: "5px" }} size={20} />{" "}
                  {t("save")}
                </button>
              </div>
            </div>

            <div className="system-info">
              <h3>
                <MdOutlineTableChart
                  style={{ margin: "0 5px 5px 0" }}
                  size={20}
                />
                {t("ChannelParameters")}
              </h3>

              <div className="d-flex justify-content-between align-items-center p-3 mx-3 mb-3 gap-3 search-and-agination-cmt">
                <div className="d-flex align-items-center gap-2">
                  <button
                    className="btn btn-sm"
                    onClick={() => handlePageNav("prev")}
                    disabled={currentPage === 0}
                    title="Previous page"
                    style={{
                      backgroundColor:
                        currentPage === 0 ? "#e9ecef" : "#EE0034",
                      color: currentPage === 0 ? "#6c757d" : "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0.4rem 0.6rem",
                      cursor: currentPage === 0 ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                      fontWeight: "600",
                    }}
                  >
                    ‹
                  </button>
                  <span className="text-center text-pagination-cmt">
                    {filteredChannels.length > 0
                      ? `${currentPage + 1} / ${totalPages}`
                      : "-"}
                  </span>
                  <button
                    className="btn btn-sm"
                    onClick={() => handlePageNav("next")}
                    disabled={
                      currentPage >= totalPages - 1 ||
                      filteredChannels.length === 0
                    }
                    title="Next page"
                    style={{
                      backgroundColor:
                        currentPage >= totalPages - 1 ||
                        filteredChannels.length === 0
                          ? "#e9ecef"
                          : "#EE0034",
                      color:
                        currentPage >= totalPages - 1 ||
                        filteredChannels.length === 0
                          ? "#6c757d"
                          : "white",
                      border: "none",
                      borderRadius: "4px",
                      padding: "0.4rem 0.6rem",
                      cursor:
                        currentPage >= totalPages - 1 ||
                        filteredChannels.length === 0
                          ? "not-allowed"
                          : "pointer",
                      transition: "all 0.2s ease",
                      fontWeight: "600",
                    }}
                  >
                    ›
                  </button>
                </div>

                <div style={{ position: "relative", maxWidth: "250px" }}>
                  <input
                    type="text"
                    className="form-control form-control-sm w-100 search-cmt"
                    placeholder={t("search_channel_number")}
                    value={searchChannel}
                    onChange={handleSearchChange}
                    onFocus={(e) => (e.target.style.borderColor = "#EE0034")}
                    onBlur={(e) => (e.target.style.borderColor = "#dee2e6")}
                  />
                  <span className="search-icon-cmt">
                    <MdSearch />
                  </span>
                  {searchChannel && (
                    <button
                      onClick={() => {
                        setSearchChannel("");
                        setCurrentPage(0);
                      }}
                      className="delete-bt-search-cmt"
                      title="Clear search"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="table-responsive crypt-parameters-table">
                <table className="table table-bordered align-middle text-center">
                  <thead className="table-secondary">
                    <tr>
                      {[
                        "channel",
                        "mode",
                        "freq",
                        "network_addr",
                        "keyEnc",
                        "keyHop",
                        "FreqTable",
                        "freqRange",
                        "codec",
                        // "Protocol",
                        // "encrytion",
                        // "manet_id",
                        // "manet_olsr",
                      ].map((h) => (
                        <th key={h}>{t(h)}</th>
                      ))}
                    </tr>
                  </thead>

                  <tbody>
                    {paginatedChannels.length > 0 ? (
                      paginatedChannels.map((ch, idx) => (
                        <tr key={idx}>
                          <td>
                            {t("channel")} {ch.u8Channel}
                          </td>
                          <td>
                            <SelectChannelParameters
                              value={ch.u8Waveform}
                              onChange={(e) =>
                                handleChannelParametersChange(
                                  ch.__originIndex,
                                  "u8Waveform",
                                  Number(e.target.value)
                                )
                              }
                              options={CHANNEL_ENUMS_SELECT_FIELD.u8Waveform}
                            />
                          </td>
                          <td>
                            <InputChannelParameters
                              value={ch.u32FixedFreq}
                              onChange={(e) =>
                                handleChannelParametersChange(
                                  ch.__originIndex,
                                  "u32FixedFreq",
                                  e
                                )
                              }
                              isDisabled={[3, 4, 6, 8].includes(ch.u8Waveform)}
                            />
                          </td>
                          <td>
                            <InputChannelParameters
                              value={ch.u8NetAddr}
                              onChange={(e) =>
                                handleChannelParametersChange(
                                  ch.__originIndex,
                                  "u8NetAddr",
                                  e
                                )
                              }
                              max={3}
                            />
                          </td>
                          <td>
                            <SelectChannelParameters
                              value={ch.u8AesKey}
                              onChange={(e) =>
                                handleChannelParametersChange(
                                  ch.__originIndex,
                                  "u8AesKey",
                                  Number(e.target.value)
                                )
                              }
                              options={Array.from({ length: 10 }, (_, i) => ({
                                value: i,
                                label: `Table ${i}`,
                              }))}
                            />
                          </td>
                          <td>
                            <SelectChannelParameters
                              value={ch.u8Deskey}
                              onChange={(e) =>
                                handleChannelParametersChange(
                                  ch.__originIndex,
                                  "u8Deskey",
                                  Number(e.target.value)
                                )
                              }
                              options={Array.from({ length: 10 }, (_, i) => ({
                                value: i,
                                label: `Table ${i}`,
                              }))}
                            />
                          </td>
                          <td>
                            <SelectChannelParameters
                              value={ch.u8HoppingTable}
                              onChange={(e) =>
                                handleChannelParametersChange(
                                  ch.__originIndex,
                                  "u8HoppingTable",
                                  Number(e.target.value)
                                )
                              }
                              options={Array.from({ length: 10 }, (_, i) => i)}
                              isDisabled={[1, 2, 5, 7, 9].includes(
                                ch.u8Waveform
                              )}
                            />
                          </td>
                          <td>
                            <SelectChannelParameters
                              value={ch.u8Band}
                              onChange={(e) =>
                                handleChannelParametersChange(
                                  ch.__originIndex,
                                  "u8Band",
                                  Number(e.target.value)
                                )
                              }
                              options={CHANNEL_ENUMS_SELECT_FIELD.u8Band}
                            />
                          </td>
                          <td>
                            <SelectChannelParameters
                              value={ch.u8Vocoder}
                              onChange={(e) =>
                                handleChannelParametersChange(
                                  ch.__originIndex,
                                  "u8Vocoder",
                                  Number(e.target.value)
                                )
                              }
                              options={getAllowedVocoderOptions(ch.u8Waveform)}
                            />
                          </td>
                          {/* <td>
                            <SelectChannelParameters
                              value={ch.u8Protocol}
                              onChange={(e) =>
                                handleChannelParametersChange(
                                  ch.__originIndex,
                                  "u8Protocol",
                                  Number(e.target.value)
                                )
                              }
                              options={CHANNEL_ENUMS_SELECT_FIELD.u8Protocol}
                            />
                          </td>
                          <td>
                            <SelectChannelParameters
                              value={ch.u8EncryptMode}
                              onChange={(e) =>
                                handleChannelParametersChange(
                                  ch.__originIndex,
                                  "u8EncryptMode",
                                  Number(e.target.value)
                                )
                              }
                              options={CHANNEL_ENUMS_SELECT_FIELD.u8EncryptMode}
                            />
                          </td> */}
                          {/* <td>
                            <SelectChannelParameters
                              value={ch.u32ManetID}
                              onChange={(e) =>
                                handleChannelParametersChange(
                                  ch.__originIndex,
                                  "u32ManetID",
                                  Number(e.target.value),
                                )
                              }
                              options={Array.from({ length: 32 }, (_, i) => ({
                                value: i,
                                label: `${i}`,
                              }))}
                              isDisabled={[1, 2, 3, 4, 5, 6, 7, 8].includes(
                                ch.u8Waveform,
                              )}
                            />
                          </td> */}
                          {/* <td>
                            <SelectChannelParameters
                              value={ch.u32ManetOLSR}
                              onChange={(e) =>
                                handleChannelParametersChange(
                                  ch.__originIndex,
                                  "u32ManetOLSR",
                                  Number(e.target.value),
                                )
                              }
                              options={CHANNEL_ENUMS_SELECT_FIELD.u32ManetOLSR}
                              isDisabled={[1, 2, 3, 4, 5, 6, 7, 8].includes(
                                ch.u8Waveform,
                              )}
                            />
                          </td> */}
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td
                          colSpan="12"
                          className="text-center py-4"
                        >
                          {filteredChannels.length === 0 && searchChannel
                            ? t("no_matching_channels_found")
                            : t("no_data_available")}
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              <div className="d-flex justify-content-end align-items-center p-2 mx-3">
                <button
                  className="dev-action-button me-5 px-5"
                  onClick={handleSaveChannelParameters}
                  disabled={channelErrors.length > 0}
                  title={
                    channelErrors.length > 0
                      ? "Fix channel errors before saving"
                      : ""
                  }
                >
                  <MdSave style={{ marginRight: "5px" }} size={20} />{" "}
                  {t("save")}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </>
  );
};
