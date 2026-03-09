import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { configurationService } from "./configurationService";
import { toast } from "react-toastify";
import { TOAST_ERROR_ID, TOAST_SUCCESS_ID } from "../../../constants/toastId";

export const rebootFunc = createAsyncThunk(
  "setting/reboot",
  async (thunkApi) => {
    try {
      return await configurationService.reboot();
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const radioConfigFunc = createAsyncThunk(
  "setting/radio-config",
  async (radioData, thunkApi) => {
    try {
      return await configurationService.radioConfig(radioData);
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const getRadioConfigFunc = createAsyncThunk(
  "setting/get-radio-config",
  async (thunkApi) => {
    try {
      return await configurationService.getRadioConfig();
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const setSleepModeFunc = createAsyncThunk(
  "setting/set-sleep-mode",
  async (thunkApi) => {
    try {
      return await configurationService.setSleepMode();
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const getCommonParamsFunc = createAsyncThunk(
  "setting/get-common-params",
  async (thunkApi) => {
    try {
      return await configurationService.getCommonParams();
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const setCommonParamsFunc = createAsyncThunk(
  "setting/set-common-params",
  async (dataSet, thunkApi) => {
    try {
      return await configurationService.setCommonParams(dataSet);
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const getChannelParamsFunc = createAsyncThunk(
  "setting/get-channel-params",
  async (dataSet, thunkApi) => {
    try {
      return await configurationService.getChannelParams(dataSet);
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const setChannelParamsFunc = createAsyncThunk(
  "setting/set-channel-params",
  async (dataSet, thunkApi) => {
    try {
      return await configurationService.setChannelParams(dataSet);
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const getAllHopTableFunc = createAsyncThunk(
  "setting/get-all-hop-table",
  async (thunkApi) => {
    try {
      return await configurationService.getAllHopTable();
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const getHopTableFunc = createAsyncThunk(
  "setting/get-hop-table",
  async (dataSet, thunkApi) => {
    try {
      return await configurationService.getHopTable(dataSet);
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const setHopTableFunc = createAsyncThunk(
  "setting/set-hop-table",
  async (dataSet, thunkApi) => {
    try {
      return await configurationService.setHopTable(dataSet);
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const getAllCryptoTableFunc = createAsyncThunk(
  "setting/get-all-crypto-table",
  async (thunkApi) => {
    try {
      return await configurationService.getAllCryptoTables();
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const getCryptoTableFunc = createAsyncThunk(
  "setting/get-crypto-table",
  async (dataSet, thunkApi) => {
    try {
      return await configurationService.getCryptoTable(dataSet);
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const setCryptoTableFunc = createAsyncThunk(
  "setting/set-crypto-table",
  async (dataSet, thunkApi) => {
    try {
      return await configurationService.setCryptoTable(dataSet);
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const getChannelTableFunc = createAsyncThunk(
  "setting/get-channel-table",
  async (thunkApi) => {
    try {
      return await configurationService.getChannelTable();
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const setChannelTableFunc = createAsyncThunk(
  "setting/set-channel-table",
  async (dataSet, thunkApi) => {
    try {
      return await configurationService.setChannelTable(dataSet);
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

const handleAsyncThunk = (builder, asyncThunk, key, mess) => {
  builder
    .addCase(asyncThunk.pending, (state) => {
      state.isLoading = true;
    })
    .addCase(asyncThunk.fulfilled, (state, action) => {
      state.isLoading = false;
      state.isSuccess = true;
      state.isError = false;
      state[key] = action.payload;
      state.message = "Success";
      if (state.isSuccess && mess) {
        toast.success(mess, {
          toastId: TOAST_SUCCESS_ID,
        });
      }
    })
    .addCase(asyncThunk.rejected, (state, action) => {
      state.isLoading = false;
      state.isSuccess = false;
      state.isError = true;
      state.message = action.payload;
      if (state.isError) {
        toast.error(action.error, {
          toastId: TOAST_ERROR_ID,
        });
      }
    });
};

const initialState = {
  isError: false,
  isLoading: false,
  isSuccess: false,
  message: "",
};

export const configurationSlice = createSlice({
  name: "setting",
  initialState: initialState,
  reducers: {},
  extraReducers: (builder) => {
    handleAsyncThunk(builder, rebootFunc, "rebootDataProcess");
    handleAsyncThunk(builder, setSleepModeFunc, "sleepMode");
    handleAsyncThunk(builder, getCommonParamsFunc, "commonParams");
    handleAsyncThunk(
      builder,
      setCommonParamsFunc,
      null,
      "General configuration updated successfully.",
    );
    handleAsyncThunk(builder, getChannelParamsFunc, "channelParams");
    handleAsyncThunk(
      builder,
      setChannelParamsFunc,
      null,
      "Channel configuration updated successfully.",
    );
    handleAsyncThunk(builder, getAllHopTableFunc, "allHopTable");
    handleAsyncThunk(builder, getHopTableFunc, "hopTable");
    handleAsyncThunk(builder, setHopTableFunc, null);
    handleAsyncThunk(builder, getAllCryptoTableFunc, "allCryptoTable");
    handleAsyncThunk(builder, getCryptoTableFunc, "cryptoTable");
    handleAsyncThunk(builder, setCryptoTableFunc, null);
    handleAsyncThunk(builder, getChannelTableFunc, "channelTable");
    handleAsyncThunk(
      builder,
      setChannelTableFunc,
      null,
      "Channel table configuration saved successfully.",
    );
  },
});

export default configurationSlice.reducer;
