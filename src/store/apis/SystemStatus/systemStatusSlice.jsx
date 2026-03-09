import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { systemStatusService } from "./systemStatusService";
import { toast } from "react-toastify";
import { TOAST_ERROR_ID, TOAST_SUCCESS_ID } from "../../../constants/toastId";

export const getSysStatFunc = createAsyncThunk(
  "system_status/getSysStat",
  async (thunkApi) => {
    try {
      return await systemStatusService.getSysStat();
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const getBoardInfoFunc = createAsyncThunk(
  "system_status/getBoardinfo",
  async (thunkApi) => {
    try {
      return await systemStatusService.getBoardInfo();
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const getRadInfoFunc = createAsyncThunk(
  "system_status/get-rad-info",
  async (thunkApi) => {
    try {
      return await systemStatusService.getRadInfo();
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);

export const getRadRssiFunc = createAsyncThunk(
  "system_status/get-rad-rssi",
  async (thunkApi) => {
    try {
      return await systemStatusService.getRadRssi();
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  },
);
export const getHardwareStatusFunc = createAsyncThunk(
  "setting/get-hardware-status",
  async (thunkApi) => {
    try {
      return await systemStatusService.getHwsStatus();
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

export const systemStatusSlice = createSlice({
  name: "system_status",
  initialState: initialState,
  reducers: {},
  extraReducers: (builder) => {
    handleAsyncThunk(builder, getSysStatFunc, "devInf");
    handleAsyncThunk(builder, getBoardInfoFunc, "boardInfo");
    handleAsyncThunk(builder, getRadInfoFunc, "radInfo");
    handleAsyncThunk(builder, getRadRssiFunc, "radRssi");
    handleAsyncThunk(builder, getHardwareStatusFunc, "hardwareStatus");
  },
});

export default systemStatusSlice.reducer;
