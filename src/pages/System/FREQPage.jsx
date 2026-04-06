import { useState, useEffect, useCallback, useRef, useMemo, memo } from "react";
import {
  MdSave,
  MdOutlineTableChart,
  MdDataObject,
  MdRefresh,
} from "react-icons/md";
import { LoadingComponent } from "../../component/LoadingComponent";
import { useDispatch } from "react-redux";
import {
  setHopTableFunc,
  getHopTableFunc,
} from "../../store/apis/Configuration/configurationSlice";
import ErrorToast from "../../component/ErrorToastComponent";
import { useTranslation } from "react-i18next";
import { toast } from "react-toastify";
import {
  buildSaveSummaryMessageHelper,
  convertToHz,
  getBandFromFreqHelper,
  isValidFrequencyHelper,
  normalizeFrequencyHelper,
  readFileDraft,
  round,
  sleep,
  validateFreqBandHelper,
} from "../../helper/settingHelper";
import { BAND, step_min } from "../../constants/validFreq";
import { useDefaultDataMode } from "../../hooks/useDefaultDataMode";
import { useSaveAll } from "../../context/SaveAllContext";
import { useOutletDisable } from "../../context/OutletDisableContext";
import { useEditingExport } from "../../context/EditingExportContext";
import { FreqTableSelectModal } from "../../component/FreqTableSelectModal";
import { HideComponent } from "../../component/HideComponent";
import {
  TOAST_ERROR_ID,
  TOAST_SUCCESS_ID,
  TOAST_WARNING_ID,
} from "../../constants/toastId";
import ConfirmDialog from "../../component/ConfirmDialog";
import { buildSaveResult } from "../../helper/statusHelper";

export const FREQPage = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();

  const cacheRef = useRef({});
  const draftHydratedRef = useRef(false);

  const [currentTableData, setCurrentTableData] = useState([]);
  const [currentTableMeta, setCurrentTableMeta] = useState(null);
  const [currentTableSource, setCurrentTableSource] = useState("api");

  const [selectedTable, setSelectedTable] = useState(0);
  const [loadingTableId, setLoadingTableId] = useState(null);
  const [hasErr, setHasErr] = useState(false);

  const [cfgFreq, setCfgFreq] = useState(0);
  const [cfgStep, setCfgStep] = useState(0);
  const [isGenerate, setIsGenerate] = useState(false);

  const [genRangeType, setGenRangeType] = useState("all");
  const [rangeFrom, setRangeFrom] = useState(0);
  const [rangeTo, setRangeTo] = useState(255);

  const [errorGen, setErrorGen] = useState({
    isHas: false,
    message: "",
  });

  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    showCancel: true,
  });

  const [bandMode, setBandMode] = useState(BAND.VHF);

  const [showFreqTableSelectModal, setShowFreqTableSelectModal] =
    useState(false);
  const [isSavingAllTables, setIsSavingAllTables] = useState(false);

  const itemPerSubTable = 16;
  const subTableCount = 16;

  const isLoading = loadingTableId !== null;
  const { isOutletDisabled } = useOutletDisable();
  const isFreqDisabled = isOutletDisabled("frequency");
  const { updateEditingData } = useEditingExport();

  const { shouldSkipApiCall, defaultValue } = useDefaultDataMode(
    null,
    "frequencyTable"
  );

  const calculateFreqTableMeta = useCallback((freqs) => {
    if (!freqs || freqs.length === 0) {
      return { freq_min: 0, freq_max: 0, step_min: 0 };
    }

    const freqValues = freqs.map((f) => Number(f) || 0);
    const minFreq = Math.min(...freqValues);
    const maxFreq = Math.max(...freqValues);

    let stepMin = Infinity;
    for (let i = 1; i < freqValues.length; i++) {
      const diff = round(Math.abs(freqValues[i] - freqValues[i - 1]));
      if (diff > 0 && diff < stepMin) {
        stepMin = diff;
      }
    }
    stepMin = stepMin === Infinity ? 0 : stepMin;

    return {
      freq_min: minFreq,
      freq_max: maxFreq,
      step_min: stepMin,
    };
  }, []);

  const hydrateDraftCache = useCallback(async () => {
    if (draftHydratedRef.current) return;

    try {
      const draftFile = await readFileDraft();

      if (draftFile?.isExist && draftFile?.data?.frequencyTable) {
        Object.entries(draftFile.data.frequencyTable).forEach(
          ([tableId, table]) => {
            const formattedFreqs = table.freqs.map((freq, idx) => ({
              idx,
              frequency: freq,
            }));
            const freqValues = formattedFreqs.map((f) => f.frequency);
            const meta = calculateFreqTableMeta(freqValues);
            cacheRef.current[tableId] = {
              source: "draft",
              data: formattedFreqs,
              freq_min: meta.freq_min,
              freq_max: meta.freq_max,
              step_min: meta.step_min,
              cfg_freq: meta.freq_min,
              cfg_step: meta.step_min,
              isGenerated: false,
            };
          }
        );
      }
    } catch (e) {
      console.error("Draft hydrate failed", e);
    }

    draftHydratedRef.current = true;
  }, [calculateFreqTableMeta]);

  const loadTableData = useCallback(
    async (tableId) => {
      try {
        await hydrateDraftCache();

        if (cacheRef.current[tableId]) {
          const cached = cacheRef.current[tableId];
          setCurrentTableData(cached.data);
          setCurrentTableMeta({
            freq_min: cached.freq_min,
            freq_max: cached.freq_max,
            step_min: cached.step_min,
          });
          setCurrentTableSource(cached.source);
          setCfgFreq(cached.cfg_freq ?? 0);
          setCfgStep(cached.cfg_step ?? 0);
          setErrorGen({ isHas: false, message: "" });

          setIsGenerate(cached.isGenerated ?? false);
          return;
        }

        if (shouldSkipApiCall) return;

        setLoadingTableId(tableId);
        setHasErr(false);

        const dataSet = { tbl_id: tableId };
        const res = await dispatch(getHopTableFunc(dataSet)).unwrap();

        const mapped = (res?.freqs || []).map((f, idx) => ({
          idx,
          frequency: f,
        }));

        const tableCache = {
          source: "api",
          data: mapped,
          freq_min: res?.freq_min,
          freq_max: res?.freq_max,
          step_min: res?.step_min,
          cfg_freq: res?.cfg_freq,
          cfg_step: res?.cfg_step,
          isGenerated: false,
        };

        cacheRef.current[tableId] = tableCache;

        setCurrentTableData(mapped);
        setCurrentTableMeta({
          freq_min: res?.freq_min,
          freq_max: res?.freq_max,
          step_min: res?.step_min,
        });
        setCurrentTableSource("api");
        setCfgFreq(res?.cfg_freq ?? 0);
        setCfgStep(res?.cfg_step ?? 0);
        setErrorGen({ isHas: false, message: "" });
        setIsGenerate(false);
      } catch (err) {
        console.error("Failed to fetch table:", err.message || err);
        setHasErr(true);
      } finally {
        setLoadingTableId(null);
      }
    },
    [dispatch, shouldSkipApiCall]
  );

  const parsedFrequencies = useMemo(() => {
    if (!currentTableData || currentTableData.length === 0) return [];

    return currentTableData.map((item) =>
      Number(String(item?.frequency || "").replace(/[^\d.]/g, ""))
    );
  }, [currentTableData]);

  const bandError = useMemo(() => {
    const bandSet = new Set(
      parsedFrequencies.map(getBandFromFreqHelper).filter(Boolean)
    );
    return bandSet.size > 1;
  }, [parsedFrequencies]);

  useEffect(() => {
    loadTableData(selectedTable);
  }, [selectedTable, loadTableData]);

  useEffect(() => {
    if (parsedFrequencies.length === 0) {
      setErrorGen({ isHas: false, message: "" });
      return;
    }

    const firstInvalidIndex = parsedFrequencies.findIndex(
      (f) => !isValidFrequencyHelper(f)
    );

    if (firstInvalidIndex !== -1) {
      setErrorGen({
        isHas: true,
        message: t("Invalid frequency at index {{idx}}: {{freq}} MHz", {
          idx: firstInvalidIndex,
          freq: parsedFrequencies[firstInvalidIndex] || 0,
        }),
      });
      return;
    }
  }, [parsedFrequencies, t]);

  useEffect(() => {
    if (shouldSkipApiCall && defaultValue) {
      const defaultFreqTables = defaultValue;
      if (
        defaultFreqTables &&
        Array.isArray(defaultFreqTables) &&
        defaultFreqTables.length > 0
      ) {
        defaultFreqTables.forEach((table, tableId) => {
          if (table.freqs && table.freqs.length > 0) {
            const formattedFreqs = table.freqs.map((freq, idx) => ({
              idx,
              frequency: freq,
            }));

            const freqValues = formattedFreqs.map((f) => f.frequency);
            const meta = calculateFreqTableMeta(freqValues);

            cacheRef.current[tableId] = {
              source: "default",
              data: formattedFreqs,
              freq_min: meta.freq_min,
              freq_max: meta.freq_max,
              step_min: meta.step_min,
              cfg_freq: meta.freq_min,
              cfg_step: meta.step_min,
              isGenerated: false,
            };
          }
        });

        const firstTable = defaultFreqTables[0];
        if (firstTable && firstTable.freqs && firstTable.freqs.length > 0) {
          const formattedData = firstTable.freqs.map((freq, idx) => ({
            idx,
            frequency: freq,
          }));

          const freqValues = formattedData.map((f) => f.frequency);
          const meta = calculateFreqTableMeta(freqValues);

          setCurrentTableData(formattedData);
          setCurrentTableMeta({
            freq_min: meta.freq_min,
            freq_max: meta.freq_max,
            step_min: meta.step_min,
          });
          setCurrentTableSource("default");
          setCfgFreq(meta.freq_min);
          setCfgStep(meta.step_min);
          setSelectedTable(0);
        }

        setErrorGen({ isHas: false, message: "" });
        setIsGenerate(false);
      }
    }
  }, [shouldSkipApiCall, defaultValue, calculateFreqTableMeta]);

  useEffect(() => {
    const freqTableData = Object.entries(cacheRef.current).map(
      ([tblId, item]) => ({
        tbl_id: Number(tblId),
        freqs: item?.data?.map((d) => Number(d.frequency)) || [],
        num_freqs: item?.data?.length ?? 0,
        freq_min: item?.freq_min ?? 0,
        freq_max: item?.freq_max ?? 0,
        step_min: item?.step_min ?? 0,
      })
    );

    updateEditingData("frequencyTable", freqTableData);
  }, [currentTableData, updateEditingData]);

  const handleFrequencyChange = useCallback(
    (dataIdx, newValue) => {
      if (!/^\d{0,3}(\.\d{0,3})?$/.test(newValue)) return;

      setErrorGen({ isHas: false, message: "" });

      setCurrentTableData((prev) => {
        const newData = [...prev];
        newData[dataIdx] = {
          idx: dataIdx,
          frequency: newValue,
        };
        if (cacheRef.current[selectedTable]) {
          cacheRef.current[selectedTable] = {
            ...cacheRef.current[selectedTable],
            data: [...newData],
            source: cacheRef.current[selectedTable]?.source ?? "default",
          };
        }
        return newData;
      });
    },
    [selectedTable]
  );

  const handleFrequencyBlur = useCallback((idx, value) => {
    setCurrentTableData((prev) =>
      prev.map((item, i) =>
        i === idx
          ? {
              ...item,
              frequency:
                value === "" || isNaN(Number(value)) ? 0 : Number(value),
            }
          : item
      )
    );
  }, []);

  const SubTableMemo = useMemo(
    () =>
      memo(({ normalized, isLoading, onFrequencyChange }) => {
        const { t } = useTranslation();
        return (
          <div className="mb-4">
            <div className="table-responsive">
              <table className="table table-bordered table-sm table_freq">
                <thead className="table-light">
                  <tr>
                    <th>Idx</th>
                    {normalized.map((item, index) => (
                      <th key={index} style={{ width: "85px" }}>
                        {item.idx}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td
                      className="table-light"
                      style={{
                        verticalAlign: "middle",
                        fontSize: "clamp(12px, 0.78vw, 14px)",
                      }}
                    >
                      {t("frequency")} (MHz)
                    </td>
                    {normalized.map((item) => (
                      <td key={item.idx} style={{ width: "90px" }}>
                        <input
                          type="text"
                          value={item.frequency}
                          className="form-control form-control-sm text-center w-100"
                          onChange={(e) =>
                            onFrequencyChange(item.idx, e.target.value)
                          }
                          onBlur={(e) =>
                            handleFrequencyBlur(item.idx, e.target.value)
                          }
                          disabled={isLoading}
                        />
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        );
      }),
    []
  );

  SubTableMemo.displayName = "SubTableMemo";

  const renderSubTable = useCallback(
    (subTableIndex) => {
      const startIdx = subTableIndex * itemPerSubTable;
      const endIdx = startIdx + itemPerSubTable;
      const subTableData = currentTableData?.slice(startIdx, endIdx) || [];
      const normalized = Array.from({ length: itemPerSubTable }, (_, i) => {
        const item = subTableData[i];
        const idx = startIdx + i;
        return item || { idx, frequency: "" };
      });

      return (
        <SubTableMemo
          key={`table-${selectedTable}-sub-${subTableIndex}`}
          normalized={normalized}
          isLoading={isLoading}
          onFrequencyChange={handleFrequencyChange}
        />
      );
    },
    [
      currentTableData,
      isLoading,
      handleFrequencyChange,
      itemPerSubTable,
      selectedTable,
      SubTableMemo,
    ]
  );

  const handleSaveTable = useCallback(async () => {
    if (!currentTableData || !currentTableMeta) {
      console.warn("Table data is not loaded yet.");
      return;
    }

    if (bandError) {
      setErrorGen({
        isHas: true,
        message: t("Cannot save table with mixed VHF/UHF frequencies"),
      });
      return;
    }

    const freqStart = Number(
      String(currentTableData?.[0]?.frequency ?? 0).replace(" MHz", "")
    );

    const isFreqValid =
      cfgFreq >= currentTableMeta.freq_min &&
      cfgFreq <= currentTableMeta.freq_max;

    const data = {
      tbl_id: selectedTable,
      freq_start: convertToHz(freqStart, "MHz"),
      freq_step: convertToHz(
        isGenerate && isFreqValid ? cfgStep : currentTableMeta.step_min,
        "MHz"
      ),
      num_freqs: 256,
      freqs:
        currentTableData.map((item) =>
          convertToHz(
            Number(String(item?.frequency ?? 0).replace(" MHz", "")),
            "MHz"
          )
        ) || 0,
    };
    
    setLoadingTableId(selectedTable);

    try {
      await dispatch(setHopTableFunc(data)).unwrap();

      cacheRef.current[selectedTable] = {
        ...cacheRef.current[selectedTable],
        data: currentTableData,
        isGenerated: isGenerate,
        cfg_freq: cfgFreq,
        cfg_step: cfgStep,
      };

      setConfirmDialog({
        show: true,
        message: t("saveSuccess"),
        onConfirm: async () => {
          setConfirmDialog({ show: false });
        },
        showCancel: false,
      });

      toast.success(t("saveSuccess"), {
        toastId: TOAST_SUCCESS_ID,
      });
    } catch (err) {
      toast.error("Failed to save table", {
        toastId: TOAST_ERROR_ID,
      });
    } finally {
      setLoadingTableId(null);
    }
  }, [
    currentTableData,
    currentTableMeta,
    bandError,
    cfgFreq,
    cfgStep,
    selectedTable,
    isGenerate,
    dispatch,
    t,
  ]);

  const handleAutoGenerate = useCallback(() => {
    setErrorGen({ isHas: false, message: "" });

    if (!cfgFreq || !isValidFrequencyHelper(cfgFreq)) return;

    setTimeout(() => {
      const startIdx = genRangeType === "range" ? rangeFrom : 0;
      const endIdx = genRangeType === "range" ? rangeTo : 255;
      const newData = [...currentTableData];
      const errorList = [];

      let detectedBand = null;

      for (let idx = startIdx; idx <= endIdx; idx++) {
        const rawFreq =
          genRangeType === "range"
            ? cfgFreq + (idx - startIdx) * cfgStep
            : cfgFreq + idx * cfgStep;

        const isInvalid = !isValidFrequencyHelper(rawFreq);
        const bandCheck = validateFreqBandHelper(bandMode, rawFreq);
        const isOutOfBand =
          !bandCheck.valid && bandCheck.reason === "OUT_OF_BAND";

        if (!isInvalid && !detectedBand) {
          detectedBand = getBandFromFreqHelper(rawFreq);
        }

        if (isInvalid) {
          errorList.push({ idx, freq: rawFreq, type: "INVALID" });
        } else if (isOutOfBand) {
          errorList.push({
            idx,
            freq: rawFreq,
            type: "OUT_OF_BAND",
            actualBand: bandCheck.actualBand,
          });
        }

        newData[idx] = {
          idx,
          frequency: rawFreq,
          isError: isInvalid || isOutOfBand,
        };
      }

      if (errorList.length > 0) {
        const { idx, freq, type } = errorList[0];
        let message = "";

        if (type === "INVALID") {
          message = t("Invalid frequency at index {{idx}}: {{freq}} Hz", {
            idx,
            freq,
          });
        } else {
          const expectBand = bandMode;
          const actualBand = errorList[0].actualBand;

          message = t(
            `Band mismatch at index ${idx}: ${freq} Hz. Expected ${expectBand.toUpperCase()}, got ${actualBand.toUpperCase()}`
          );
        }

        setErrorGen({ isHas: true, message });
      }

      setCurrentTableData(newData);

      const freqValues = newData
        .map((item) => Number(item.frequency))
        .filter((f) => !isNaN(f) && f > 0);

      const meta = calculateFreqTableMeta(freqValues);

      setCurrentTableMeta({
        freq_min: meta.freq_min,
        freq_max: meta.freq_max,
        step_min: meta.step_min,
      });

      setCfgFreq(meta.freq_min);
      setCfgStep(meta.step_min);

      setIsGenerate(true);

      cacheRef.current[selectedTable] = {
        ...cacheRef.current[selectedTable],
        data: [...newData],
        freq_min: meta.freq_min,
        freq_max: meta.freq_max,
        step_min: meta.step_min,
        cfg_freq: meta.freq_min,
        cfg_step: meta.step_min,
        source: cacheRef.current[selectedTable]?.source ?? "default",
        isGenerated: true,
      };
    }, 0);
  }, [
    cfgFreq,
    cfgStep,
    currentTableData,
    genRangeType,
    rangeFrom,
    rangeTo,
    bandMode,
    t,
    selectedTable,
  ]);

  const handleReload = async () => {
    delete cacheRef.current[selectedTable];
    await loadTableData(selectedTable);
  };

  const handleChangeInput = useCallback(
    (setter) => (e) => {
      const value = e.target.value;
      if (/^\d{0,3}(\.\d{0,3})?$/.test(value)) {
        setter(value);
        setIsGenerate(false);
      }
    },
    []
  );

  const handleInputBlur = useCallback(
    (value, setter) => () => {
      let num = Number(value);

      if (value === "" || Number.isNaN(num)) {
        num = 0;
      }

      setter(num);
    },
    []
  );

  const handleRangeFromBlur = useCallback(() => {
    if (rangeFrom === "") {
      setRangeFrom(0);
      return;
    }
    const numValue = Number(rangeFrom);
    if (isNaN(numValue)) {
      setRangeFrom(0);
      return;
    }
    const v = Math.min(Math.max(numValue, 0), 255);
    setRangeFrom(v);
    if (rangeTo !== "" && v > Number(rangeTo)) {
      setRangeTo(v);
    }
  }, [rangeFrom, rangeTo]);

  const handleRangeToBlur = useCallback(() => {
    if (rangeTo === "") {
      setRangeTo(255);
      return;
    }
    const numValue = Number(rangeTo);
    if (isNaN(numValue)) {
      setRangeTo(255);
      return;
    }
    const v = Math.min(Math.max(numValue, 0), 255);
    setRangeTo(v);
    if (rangeFrom !== "" && v < Number(rangeFrom)) {
      setRangeFrom(v);
    }
  }, [rangeFrom, rangeTo]);

  const tableOptions = useMemo(
    () =>
      Array.from({ length: 10 }, (_, i) => (
        <option key={i} value={i}>
          {t("Table")} {i}
        </option>
      )),
    [t]
  );

  const frequencyInfo = useMemo(
    () => ({
      min: currentTableMeta?.freq_min ?? "N/A",
      max: currentTableMeta?.freq_max ?? "N/A",
      step: currentTableMeta?.step_min ?? "N/A",
    }),
    [currentTableMeta]
  );

  const subTables = useMemo(
    () => Array.from({ length: subTableCount }, (_, i) => renderSubTable(i)),
    [subTableCount, renderSubTable]
  );

  const handleSaveAllTables = useCallback(async () => {
    setShowFreqTableSelectModal(true);
  }, []);

  const handleSaveSelectedTables = useCallback(
    async (selectedTableIds) => {
      console.log("Saving selected tables:", selectedTableIds);

      const tables = cacheRef.current;

      if (!tables || !selectedTableIds?.length) {
        console.warn("No tables to save.");
        return;
      }

      setIsSavingAllTables(true);

      const summary = {
        success: [],
        failed: [],
        skipped: [],
      };

      const skip = (tblId, reason) =>
        summary.skipped.push({ id: tblId, reason });

      const fail = (tblId, err) =>
        summary.failed.push({
          id: tblId,
          reason: err?.message || "Save failed",
        });

      const success = (tblId) => summary.success.push(tblId);

      const isValidTable = (table) =>
        table && Array.isArray(table.data) && table.data.length > 0;

      const buildPayload = (tblId, table) => {
        const { data, freq_min, freq_max, step_min, cfg_freq, isGenerated } =
          table;

        const freqStart = normalizeFrequencyHelper(data[0]);

        const isFreqValid =
          typeof cfg_freq === "number" &&
          cfg_freq >= freq_min &&
          cfg_freq <= freq_max;

        return {
          tbl_id: Number(tblId),
          freq_start: freqStart,
          freq_step: isGenerated && isFreqValid ? cfgStep : step_min,
          num_freqs: data.length,
          freqs: data.map(normalizeFrequencyHelper),
        };
      };

      const saveOneTable = async (tblId, table) => {
        try {
          const payload = buildPayload(tblId, table);
          console.log(payload);
          await dispatch(setHopTableFunc(payload)).unwrap();
          success(tblId);
        } catch (err) {
          fail(tblId, err);
        }
      };

      try {
        for (const tblId of selectedTableIds) {
          const table = tables[tblId];

          if (!table) {
            skip(tblId, "Table not found");
            continue;
          }

          if (!isValidTable(table)) {
            skip(tblId, "No data");
            continue;
          }

          await saveOneTable(tblId, table);
          await sleep(200);
        }

        toast.dismiss();

        const message = buildSaveSummaryMessageHelper(summary, t);

        if (summary.failed.length) {
          toast.error(message, {
            style: { whiteSpace: "pre-line" },
            toastId: TOAST_ERROR_ID,
          });
        } else if (summary.skipped.length) {
          toast.warning(message, {
            style: { whiteSpace: "pre-line" },
            toastId: TOAST_WARNING_ID,
          });
        } else {
          toast.success(message, {
            style: { whiteSpace: "pre-line" },
            toastId: TOAST_SUCCESS_ID,
          });

          setConfirmDialog({
            show: true,
            message: "All selected tables have been saved successfully.",
            onConfirm: () => setConfirmDialog({ show: false }),
            showCancel: false,
          });
        }
      } catch (err) {
        console.error("Save selected tables crashed:", err);

        toast.error(t("Failed to save all tables"), {
          toastId: TOAST_ERROR_ID,
        });
      } finally {
        setIsSavingAllTables(false);
      }

      return buildSaveResult(summary, "Table");
    },
    [dispatch, t]
  );

  const { registerSaveFunction, unregisterSaveFunction } = useSaveAll();

  useEffect(() => {
    registerSaveFunction("freqTable", () =>
      handleSaveSelectedTables(Array.from({ length: 10 }, (_, i) => i))
    );
    return () => unregisterSaveFunction("freqTable");
  }, [handleSaveSelectedTables, registerSaveFunction, unregisterSaveFunction]);

  return (
    <>
      <ConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
        showCancel={confirmDialog.showCancel}
      />
      <div className="pt-2 d-flex flex-column h-100 justify-content-between custom-scroll">
        {isFreqDisabled ? (
          <HideComponent />
        ) : (
          <>
            <div className="system-info">
              <h3 className="d-flex justify-content-between align-item-center">
                <div className="d-flex align-item-center">
                  <MdOutlineTableChart
                    style={{ margin: "0 5px 5px 0" }}
                    size={20}
                  />
                  {t("FrequencyTableConfiguration")}
                </div>
                <MdRefresh
                  className={
                    isLoading ? "reload-icon reloading" : "reload-icon"
                  }
                  style={{ display: "inline-block", cursor: "pointer" }}
                  title={t("Reload_table_data")}
                  onClick={handleReload}
                  disabled={isLoading}
                  size={20}
                />
              </h3>
              <div className="d-flex w-100 justify-content-start align-item-center flex-column">
                <div className="gap-3 d-flex justify-content-around">
                  <div className="d-flex justify-content-between align-items-center gap-3">
                    <label htmlFor="freqTable">{t("FreqTable")}</label>
                    <select
                      name="freqTable"
                      id="freqTable"
                      className="form-select"
                      value={selectedTable}
                      onChange={(e) => {
                        setSelectedTable(parseInt(e.target.value));
                      }}
                      disabled={isLoading}
                    >
                      {tableOptions}
                    </select>
                  </div>
                  <div className="d-flex justify-content-around gap-4 align-items-center my-2 px-3 py-2 rounded shadow-sm freq_inf">
                    <div className="d-flex flex-column gap-1">
                      <label className="fw-semibold mb-0">
                        {t("generate_range")}
                      </label>

                      <select
                        className="form-select form-select-sm"
                        value={genRangeType}
                        onChange={(e) => {
                          const value = e.target.value;
                          setGenRangeType(value);
                          if (value === "all") {
                            setRangeFrom(0);
                            setRangeTo(255);
                          }
                        }}
                        disabled={isLoading}
                      >
                        <option value="all">{t("all")} (0–255)</option>
                        <option value="range">{t("custom_range")}</option>
                      </select>
                      {genRangeType === "range" && (
                        <div className="d-flex align-items-center justify-content-between gap-1">
                          <input
                            type="text"
                            className="form-control form-control-sm text-center"
                            style={{ width: "60px" }}
                            value={rangeFrom}
                            disabled={isLoading}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              setRangeFrom(raw === "" ? "" : Number(raw));
                            }}
                            onBlur={handleRangeFromBlur}
                          />
                          <span className="crypto-gen-label-arrow">→</span>
                          <input
                            type="text"
                            className="form-control form-control-sm text-center"
                            disabled={isLoading}
                            style={{ width: "60px" }}
                            value={rangeTo}
                            onChange={(e) => {
                              const raw = e.target.value.replace(/\D/g, "");
                              setRangeTo(raw === "" ? "" : Number(raw));
                            }}
                            onBlur={handleRangeToBlur}
                          />
                        </div>
                      )}
                    </div>

                    <div className="d-flex flex-column gap-1 px-3 generate-range">
                      <label className="fw-semibold mb-0">
                        {t("antenna_mode")}
                      </label>

                      <select
                        className="form-select form-select-sm"
                        value={bandMode}
                        onChange={(e) => {
                          setBandMode(e.target.value);
                          setIsGenerate(false);
                        }}
                        disabled={isLoading}
                      >
                        <option value={BAND.VHF}>VHF</option>
                        <option value={BAND.UHF}>UHF</option>
                      </select>

                      {bandError && (
                        <small className="text-danger">
                          {t("error_antenna_mode")}
                        </small>
                      )}
                    </div>

                    <div className="d-flex align-items-start flex-column gap-2">
                      <label
                        htmlFor="cfg_freq"
                        className="me-2 mb-0 tooltip-container"
                      >
                        {t("config_freq")} (MHz):
                        <span className="tooltip-text">
                          {t("tooltipConfigFreq")}
                        </span>
                      </label>
                      <input
                        id="cfg_freq"
                        type="text"
                        className="form-control form-control-sm"
                        style={{ width: "120px" }}
                        value={cfgFreq}
                        onChange={handleChangeInput(setCfgFreq)}
                        onBlur={handleInputBlur(cfgFreq, setCfgFreq)}
                        maxLength={10}
                        disabled={isLoading}
                      />
                    </div>

                    <div className="d-flex align-items-start flex-column gap-2 px-3 generate-range">
                      <label
                        htmlFor="cfg_step"
                        className="me-2 mb-0 tooltip-container"
                      >
                        {t("config_step")} (MHz):
                        <span className="tooltip-text">
                          {t("tooltipConfigStep")}
                        </span>
                      </label>
                      <input
                        id="cfg_step"
                        type="text"
                        className="form-control form-control-sm"
                        style={{ width: "120px" }}
                        value={cfgStep}
                        onChange={handleChangeInput(setCfgStep)}
                        onBlur={handleInputBlur(cfgStep, setCfgStep)}
                        maxLength={10}
                        disabled={isLoading}
                      />
                    </div>

                    <button
                      className="btn btn-outline-danger btn-sm btn-generate"
                      onClick={handleAutoGenerate}
                      disabled={
                        isLoading ||
                        cfgFreq <= 0 ||
                        !isValidFrequencyHelper(cfgFreq)
                      }
                      style={{ textAlign: "center", border: "1px solid" }}
                    >
                      <MdDataObject size={20} style={{ marginBottom: "1px" }} />{" "}
                      {t("Generate")}
                    </button>
                    <div className="d-flex flex-column justify-content-center gap-2">
                      <p className="mb-1 fw-bold text-secondary">
                        {t("freq_info")}
                      </p>
                      <div
                        className="small d-flex flex-column"
                        style={{
                          color: "var(--info-color-p)",
                        }}
                      >
                        <div className="tooltip-container">
                          <p
                            className="m-0 p-0"
                            style={{ fontSize: "clamp(12px, 0.78vw, 14px)" }}
                          >
                            Min: {frequencyInfo.min} MHz
                          </p>
                          <span className="tooltip-text">
                            {t("tooltipMinFreq")}
                          </span>
                        </div>
                        <div className="tooltip-container">
                          <p
                            className="m-0 p-0"
                            style={{ fontSize: "clamp(12px, 0.78vw, 14px)" }}
                          >
                            Max: {frequencyInfo.max} MHz
                          </p>
                          <span className="tooltip-text">
                            {t("tooltipMaxFreq")}
                          </span>
                        </div>
                        <div className="tooltip-container">
                          <p
                            className="m-0 p-0"
                            style={{ fontSize: "clamp(12px, 0.78vw, 14px)" }}
                          >
                            {t("step")}: {frequencyInfo.step} MHz
                          </p>
                          <span className="tooltip-text">
                            {t("tooltipSmallestStep")}
                          </span>
                        </div>
                      </div>
                    </div>
                    {cfgFreq !== 0 &&
                      cfgStep !== 0 &&
                      (!isValidFrequencyHelper(cfgFreq) ||
                        cfgStep < step_min ||
                        errorGen.isHas) && (
                        <ErrorToast
                          conditions={[
                            {
                              condition: !isValidFrequencyHelper(cfgFreq),
                              message: t("StartFrequencyMess"),
                            },
                            {
                              condition: cfgStep < step_min,
                              message: t("StepSizeMess"),
                            },
                            {
                              condition: errorGen.isHas,
                              message: errorGen.message,
                            },
                          ]}
                        />
                      )}
                  </div>
                </div>
                {isLoading ? (
                  <div
                    className="loading_cpn d-flex flex-column justify-content-center align-items-center"
                    style={{
                      minHeight: "200px",
                      borderRadius: "12px",
                      padding: "30px",
                      animation: "pulseShadow 1s infinite",
                    }}
                  >
                    <LoadingComponent />
                    <p
                      className="mt-4"
                      style={{
                        fontSize: "1.25rem",
                        color: "#b02a37",
                        fontWeight: "600",
                        textShadow: "1px 1px 4px rgba(220, 53, 69, 0.7)",
                        animation:
                          "fadeInText 2.5s ease-in-out infinite alternate",
                      }}
                    >
                      {t("loadTable")}
                    </p>

                    <style>
                      {`
                  @keyframes pulseShadow {
                    0%, 100% {
                      box-shadow: 0 0 15px rgba(248, 215, 218, 0.5);
                    }
                    50% {
                      box-shadow: 0 0 25px rgba(248, 215, 218, 0.7);
                    }
                  }
                  @keyframes fadeInText {
                    0% {
                      opacity: 0.6;
                      text-shadow: 1px 1px 4px rgba(220, 53, 69, 0.4);
                    }
                    100% {
                      opacity: 1;
                      text-shadow: 2px 2px 8px rgba(220, 53, 69, 0.9);
                    }
                  }
                `}
                    </style>
                  </div>
                ) : hasErr && currentTableSource !== "default" ? (
                  <div className="alert alert-danger">
                    {t("failedLoadTable")}
                  </div>
                ) : (
                  <div
                    className="w-100 mt-3 custom-scroll"
                    style={{ height: "50vh", overflowY: "scroll" }}
                  >
                    {subTables}
                  </div>
                )}
              </div>
            </div>
            <div
              className={`d-flex ${
                currentTableSource === "default"
                  ? "justify-content-between"
                  : "justify-content-end"
              } align-items-center p-2 mx-3`}
              style={{ borderTop: "2px solid #EE0034" }}
            >
              {currentTableSource === "default" && (
                <button
                  className="dev-action-button me-5 px-5"
                  onClick={handleSaveAllTables}
                  disabled={
                    bandError ||
                    errorGen.isHas ||
                    !isValidFrequencyHelper(cfgFreq)
                  }
                >
                  <MdSave style={{ marginRight: "5px" }} size={20} />{" "}
                  {t("saveAllFreqTables")}
                </button>
              )}
              <button
                className="dev-action-button me-5 px-5"
                onClick={handleSaveTable}
                disabled={
                  bandError ||
                  errorGen.isHas ||
                  !isValidFrequencyHelper(cfgFreq)
                }
              >
                <MdSave style={{ marginRight: "5px" }} size={20} /> {t("save")}{" "}
                {t("FreqTable")} #{selectedTable}
              </button>
            </div>
          </>
        )}
        <FreqTableSelectModal
          show={showFreqTableSelectModal}
          tables={Array.from({ length: 10 })}
          onClose={() => setShowFreqTableSelectModal(false)}
          onSave={handleSaveSelectedTables}
          isLoading={isSavingAllTables}
        />
      </div>
    </>
  );
};
