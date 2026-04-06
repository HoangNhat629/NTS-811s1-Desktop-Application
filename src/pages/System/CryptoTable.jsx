import { useState, useEffect, useCallback, useRef } from "react";
import {
  MdSave,
  MdOutlineTableChart,
  MdRefresh,
  MdAutoFixHigh,
} from "react-icons/md";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import {
  genRandomHexHelper,
  readFileDraft,
  sleep,
} from "../../helper/settingHelper";
import { LoadingComponent } from "../../component/LoadingComponent";
import { toast } from "react-toastify";
import {
  getCryptoTableFunc,
  setCryptoTableFunc,
} from "../../store/apis/Configuration/configurationSlice";
import { useDefaultDataMode } from "../../hooks/useDefaultDataMode";
import { useEditingExport } from "../../context/EditingExportContext";
import { useSaveAll } from "../../context/SaveAllContext";
import { useOutletDisable } from "../../context/OutletDisableContext";
import { HideComponent } from "../../component/HideComponent";
import { TOAST_ERROR_ID, TOAST_SUCCESS_ID } from "../../constants/toastId";
import ConfirmDialog from "../../component/ConfirmDialog";
import { buildSaveResult } from "../../helper/statusHelper";

// Constants
const ENC_TYPE_MAP = {
  aes128: 0,
  aes256: 1,
  des: 2,
};

const KEY_LENGTH_MAP = {
  aes128: 4,
  aes256: 8,
  des: 4,
};

export const CryptoTable = () => {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const cacheRef = useRef({});
  const draftHydratedRef = useRef(false);

  const [selectedKeyType, setSelectedKeyType] = useState("aes128");
  const [isLoading, setIsLoanding] = useState(false);
  const [currentCryptoTable, setCurrentCryptoTable] = useState([]);

  const [genRangeType, setGenRangeType] = useState("all"); // all | range
  const [rangeFrom, setRangeFrom] = useState(0);
  const [rangeTo, setRangeTo] = useState(9);
  const [genMode, setGenMode] = useState("random"); // random | fixed
  const [fixedKey, setFixedKey] = useState("");
  const [confirmDialog, setConfirmDialog] = useState({
    show: false,
    message: "",
    onConfirm: () => {},
    onCancel: () => {},
    showCancel: true,
  });

  const { isOutletDisabled } = useOutletDisable();
  const isCryptoDisabled = isOutletDisabled("crypto");
  const { updateEditingData } = useEditingExport();

  const { shouldSkipApiCall, defaultValue } = useDefaultDataMode(
    () => loadCryptoTable(selectedKeyType),
    "cryptoTable",
  );

  const hydrateDraftCache = useCallback(async () => {
    if (draftHydratedRef.current) return;

    try {
      const draftFile = await readFileDraft();
      
      if (draftFile?.isExist && draftFile?.data?.cryptoTable) {
        const formattedTables = [];

        for (const [algo, tables] of Object.entries(
          draftFile.data.cryptoTable,
        )) {
          tables.forEach(({ key }, t) =>
            key.forEach(
              (v, r) => (((formattedTables[t] ??= [])[r] ??= {})[algo] = v),
            ),
          );

          cacheRef.current[algo] = {
            source: "draft",
            data: formattedTables,
            isGenerated: false,
          };
        }
      }
    } catch (err) {
      console.error("Draft hydrate failed:", err);
    }

    draftHydratedRef.current = true;
  }, []);

  const loadCryptoTable = useCallback(
    async (keyType) => {
      setIsLoanding(true);

      try {
        await hydrateDraftCache();

        if (cacheRef.current[keyType]) {
          const cached = cacheRef.current[keyType];
          setCurrentCryptoTable(cached.data);
          return;
        }

        const dataSet = {
          enc_type: ENC_TYPE_MAP[keyType],
        };

        const res = await dispatch(getCryptoTableFunc(dataSet)).unwrap();

        if (!Array.isArray(res?.enc_tbl)) {
          cacheRef.current[keyType] = {
            source: "api",
            data: [],
          };
          setCurrentCryptoTable([]);
          return;
        }

        const formattedTables = res.enc_tbl.map((tbl) =>
          Array.isArray(tbl.tbl_values)
            ? tbl.tbl_values.map((val) => ({
                [keyType]: val
                  .toString(16)
                  .toUpperCase()
                  .padStart(KEY_LENGTH_MAP[keyType], "0"),
              }))
            : [],
        );

        cacheRef.current[keyType] = {
          source: "api",
          data: formattedTables,
          isGenerated: false,
        };

        setCurrentCryptoTable(formattedTables);
      } catch (err) {
        toast.error(t("loadDataFailed"), {
          toastId: TOAST_ERROR_ID,
        });
      } finally {
        setIsLoanding(false);
      }
    },
    [dispatch, t],
  );

  useEffect(() => {
    loadCryptoTable(selectedKeyType);
  }, [selectedKeyType, loadCryptoTable]);

  useEffect(() => {
    if (shouldSkipApiCall && defaultValue) {
      const formattedTables = [];

      Object.entries(defaultValue).forEach(([algo, tableList]) => {
        tableList.forEach((table, tableIdx) => {
          if (!formattedTables[tableIdx]) formattedTables[tableIdx] = [];
          table.key.forEach((keyValue, rowIdx) => {
            if (!formattedTables[tableIdx][rowIdx]) {
              formattedTables[tableIdx][rowIdx] = {};
            }
            formattedTables[tableIdx][rowIdx][algo] = keyValue;
          });
        });
      });

      Object.keys(defaultValue).forEach((algo) => {
        cacheRef.current[algo] = {
          source: "default",
          data: formattedTables,
          isGenerated: false,
        };
      });

      setCurrentCryptoTable(formattedTables);
    }
  }, [shouldSkipApiCall, defaultValue]);

  useEffect(() => {
    const cryptoTableData = {};
    Object.keys(ENC_TYPE_MAP).forEach((keyType) => {
      const cachedData = cacheRef.current[keyType];
      if (
        cachedData &&
        Array.isArray(cachedData.data) &&
        cachedData.data.length > 0
      ) {
        cryptoTableData[keyType] = cachedData.data.map((table) =>
          Array.isArray(table)
            ? table.map((row) => ({
                [keyType]: row[keyType] || "",
              }))
            : [],
        );
      }
    });

    if (Object.keys(cryptoTableData).length > 0) {
      updateEditingData("allCryptoTable", cryptoTableData);
    }
  }, [currentCryptoTable, updateEditingData]);

  const handleRangeInput = (setter, otherValue, isFrom) => (e) => {
    const val = e.target.value.replace(/[^0-9]/g, "");
    const num =
      val === ""
        ? ""
        : isFrom
          ? Math.min(Number(val), Number(otherValue))
          : Math.max(Number(val), Number(otherValue));
    setter(num);
  };

  const handleGenerateKey = useCallback(() => {
    const isValidFixedKey = (value, type) =>
      /^[0-9A-Fa-f]+$/.test(value) && value.length === KEY_LENGTH_MAP[type];

    if (genMode === "fixed" && !isValidFixedKey(fixedKey, selectedKeyType)) {
      toast.error(t("Invalid fixed key"), {
        toastId: TOAST_ERROR_ID,
      });
      return;
    }

    setCurrentCryptoTable((prev) => {
      const newData = prev.map((table, tableIdx) => {
        const inRange =
          genRangeType === "all" ||
          (tableIdx >= rangeFrom && tableIdx <= rangeTo);

        if (!inRange) return table;

        return table.map((row) => ({
          ...row,
          [selectedKeyType]:
            genMode === "random"
              ? genRandomHexHelper(KEY_LENGTH_MAP[selectedKeyType])
              : fixedKey.toUpperCase(),
        }));
      });

      cacheRef.current[selectedKeyType] = {
        source: cacheRef.current[selectedKeyType]?.source ?? "default",
        data: newData,
        isGenerated: true,
      };

      return newData;
    });

    toast.success(t("Generate key success"), {
      toastId: TOAST_SUCCESS_ID,
    });
  }, [selectedKeyType, genMode, fixedKey, genRangeType, rangeFrom, rangeTo, t]);

  const handleReload = async () => {
    delete cacheRef.current[selectedKeyType];
    await loadCryptoTable(selectedKeyType);
  };

  const handleCryptValueChange = useCallback(
    (tableIdx, rowIdx, keyType, value) => {
      setCurrentCryptoTable((prev) => {
        if (tableIdx < 0 || tableIdx >= prev.length) return prev;
        if (rowIdx < 0 || rowIdx >= prev[tableIdx].length) return prev;

        const newData = [...prev];
        newData[tableIdx] = [...newData[tableIdx]];
        newData[tableIdx][rowIdx] = {
          ...newData[tableIdx][rowIdx],
          [keyType]: value.toUpperCase(),
        };

        cacheRef.current[selectedKeyType] = {
          source: cacheRef.current[selectedKeyType]?.source ?? "default",
          data: newData,
          isGenerated: cacheRef.current[selectedKeyType]?.isGenerated ?? false,
        };

        return newData;
      });
    },
    [selectedKeyType],
  );

  const handleCryptSave = useCallback(async () => {
    try {
      setIsLoanding(true);

      const tbl_type = ENC_TYPE_MAP[selectedKeyType];

      const tbl_data = currentCryptoTable.map((table) => ({
        tbl_values: table.map((row) => parseInt(row[selectedKeyType], 16)),
      }));

      await dispatch(setCryptoTableFunc({ tbl_type, tbl_data })).unwrap();

      toast.success(t("successCryptSave"), {
        toastId: TOAST_SUCCESS_ID,
      });
      setConfirmDialog({
        show: true,
        message: t("successCryptSave"),
        onConfirm: async () => {
          setConfirmDialog({ show: false });
        },
        showCancel: false,
      });
    } catch {
      toast.error(t("saveCryptFailed"), {
        toastId: TOAST_ERROR_ID,
      });
    } finally {
      setIsLoanding(false);
    }
  }, [selectedKeyType, currentCryptoTable, dispatch, t]);

  const handleCryptSaveAll = useCallback(async () => {
    console.log("Saving all crypto configurations...");

    setIsLoanding(true);

    const summary = {
      success: [],
      failed: [],
      skipped: [],
    };

    try {
      const encTypeKeys = Object.keys(ENC_TYPE_MAP); // ["aes128", "aes256", "des"]

      for (const keyType of encTypeKeys) {
        try {
          const cachedData = cacheRef.current[keyType];

          if (
            !cachedData ||
            !Array.isArray(cachedData.data) ||
            cachedData.data.length === 0
          ) {
            summary.skipped.push({
              id: keyType,
              reason: "No data",
            });
            continue;
          }

          const tbl_type = ENC_TYPE_MAP[keyType];

          const tbl_data = cachedData.data.map((table) => ({
            tbl_values: table.map((row) => parseInt(row[keyType] || "0", 16)),
          }));

          await dispatch(setCryptoTableFunc({ tbl_type, tbl_data })).unwrap();

          summary.success.push(keyType);
        } catch (err) {
          console.error(`Failed to save ${keyType}:`, err);
          summary.failed.push({
            id: keyType,
            reason: err?.message || String(err),
          });
        }

        await sleep(100);
      }
    } catch (err) {
      console.error("Save all crypto crashed:", err);
      toast.error(t("Save all crypto crashed"), {
        toastId: TOAST_ERROR_ID,
      });
    } finally {
      setIsLoanding(false);
    }
    return buildSaveResult(summary, "Table");
  }, [dispatch, t]);

  const renderSubCryptoTable = (tableIdx) => {
    const currentTableData = currentCryptoTable[tableIdx];
    if (!Array.isArray(currentTableData)) return null;

    return (
      <div className="crypto-subtable" key={tableIdx}>
        <div className="crypto-subtable__title">
          {t("CryptographicTable")} #{tableIdx}
        </div>

        <div className="table-responsive">
          <table className="table crypt-table table-sm mb-0">
            <thead>
              <tr>
                <th style={{ width: "90px" }}>Idx</th>
                {currentTableData.map((_, idx) => (
                  <th key={idx} style={{ width: "85px" }}>
                    {tableIdx}({idx + 1})
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              <tr>
                <td className="crypt-key-label">
                  {selectedKeyType.toUpperCase()}
                  <span
                    className={`crypto-key-badge crypto-key-${selectedKeyType}`}
                  >
                    {t("key")}
                  </span>
                </td>

                {currentTableData.map((row, rowIdx) => (
                  <td key={rowIdx}>
                    <input
                      type="text"
                      className="crypt-input"
                      value={row[selectedKeyType] || ""}
                      maxLength={KEY_LENGTH_MAP[selectedKeyType]}
                      onChange={(e) =>
                        handleCryptValueChange(
                          tableIdx,
                          rowIdx,
                          selectedKeyType,
                          e.target.value
                            .replace(/[^0-9a-fA-F]/g, "")
                            .toUpperCase(),
                        )
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
  };

  const { registerSaveFunction, unregisterSaveFunction } = useSaveAll();

  useEffect(() => {
    registerSaveFunction("cryptoTable", handleCryptSaveAll);
    return () => unregisterSaveFunction("cryptoTable");
  }, [handleCryptSaveAll, registerSaveFunction, unregisterSaveFunction]);

  return (
    <>
      <ConfirmDialog
        show={confirmDialog.show}
        message={confirmDialog.message}
        onConfirm={confirmDialog.onConfirm}
        onCancel={confirmDialog.onCancel}
        showCancel={confirmDialog.showCancel}
      />
      {isCryptoDisabled ? (
        <HideComponent />
      ) : (
        <div className="pt-2 d-flex flex-column h-100 justify-content-between custom-scroll">
          <div className="system-info">
            <h3>
              <MdOutlineTableChart
                style={{ margin: "0 5px 5px 0" }}
                size={20}
              />
              {t("CryptoTableConfiguration")}
            </h3>
            <div className="d-flex w-100 flex-column justify-content-around align-items-start pt-2 gap-3">
              <div className="d-flex align-items-center justify-content-around gap-3 w-100">
                <div className="crypto-gen-box w-50">
                  <div className="crypto-gen-title">
                    <MdAutoFixHigh size={18} /> {t("GenerateKey")}
                  </div>
                  <div className="d-flex align-items-center justify-content-around">
                    <div className="d-flex gap-2 flex-column">
                      <div className="d-flex align-items-center gap-2">
                        <label className="crypto-gen-label">
                          {t("ApplyTable")}
                        </label>

                        <select
                          className="form-select crypto-gen-select"
                          value={genRangeType}
                          onChange={(e) => setGenRangeType(e.target.value)}
                        >
                          <option value="all">{t("all")} (0–9)</option>
                          <option value="range">{t("range")}</option>
                        </select>

                        {genRangeType === "range" && (
                          <div className="d-flex align-items-center gap-1">
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              className="form-control crypto-gen-input"
                              value={rangeFrom}
                              onChange={handleRangeInput(
                                setRangeFrom,
                                rangeTo,
                                true,
                              )}
                            />
                            <span className="crypto-gen-label-arrow">→</span>
                            <input
                              type="text"
                              inputMode="numeric"
                              maxLength={1}
                              className="form-control crypto-gen-input"
                              value={rangeTo}
                              onChange={handleRangeInput(
                                setRangeTo,
                                rangeFrom,
                                false,
                              )}
                            />
                          </div>
                        )}
                      </div>

                      <div className="d-flex align-items-center gap-2">
                        <label className="crypto-gen-label">{t("mode")}</label>

                        <select
                          className="form-select crypto-gen-select"
                          value={genMode}
                          onChange={(e) => setGenMode(e.target.value)}
                        >
                          <option value="random">{t("random")}</option>
                          <option value="fixed">{t("fixed_key")}</option>
                        </select>

                        {genMode === "fixed" && (
                          <input
                            className="form-control crypto-gen-input"
                            placeholder="HEX key"
                            maxLength={KEY_LENGTH_MAP[selectedKeyType]}
                            value={fixedKey}
                            onChange={(e) =>
                              setFixedKey(
                                e.target.value
                                  .replace(/[^0-9a-fA-F]/g, "")
                                  .toUpperCase(),
                              )
                            }
                          />
                        )}
                      </div>
                    </div>

                    <button
                      className="cryptographic-btn"
                      onClick={handleGenerateKey}
                      disabled={isLoading}
                    >
                      <MdAutoFixHigh size={18} />
                      {t("Generate")}
                    </button>
                  </div>
                </div>
                <div className="d-flex align-items-center justify-content-center gap-5 w-50">
                  <div className="d-flex align-items-center gap-3">
                    <label htmlFor="cryptTable">{t("TableType")}</label>
                    <select
                      name="cryptTable"
                      id="cryptTable"
                      className="form-select"
                      value={selectedKeyType}
                      style={{ width: "150px" }}
                      onChange={(e) => setSelectedKeyType(e.target.value)}
                      disabled={isLoading}
                    >
                      <option value="aes128">AES128</option>
                      <option value="aes256">AES256</option>
                      <option value="des">DES</option>
                    </select>
                  </div>
                  <button
                    onClick={handleCryptSave}
                    className="cryptographic-btn"
                    disabled={isLoading}
                  >
                    <MdSave style={{ marginRight: "5px" }} size={20} />
                    {t("save")}
                  </button>
                </div>
              </div>

              <div className="border crypt-table rounded shadow-sm p-3">
                <div className="d-flex justify-content-between align-items-center">
                  <h6 className="fw-semibold mb-2">
                    {t("Table") + " " + selectedKeyType.toLocaleUpperCase()}
                  </h6>
                  <MdRefresh
                    className={`mb-2 reload-icon ${
                      isLoading ? "reloading" : ""
                    }`}
                    style={{ display: "inline-block", cursor: "pointer" }}
                    title={t("Reload_table_data")}
                    onClick={handleReload}
                    disabled={isLoading}
                    size={20}
                  />
                </div>

                {isLoading ? (
                  <div
                    className="d-flex justify-content-center align-items-center"
                    style={{ minHeight: 400 }}
                  >
                    <LoadingComponent />
                  </div>
                ) : currentCryptoTable.length > 0 ? (
                  <div className="crypt-table-container custom-scroll">
                    {currentCryptoTable.map((_, tableIdx) =>
                      renderSubCryptoTable(tableIdx),
                    )}
                  </div>
                ) : (
                  <div className="alert alert-danger">
                    {t("failedLoadTable")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
