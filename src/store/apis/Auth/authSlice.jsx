import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { authService } from "./authService";

export const loginFunc = createAsyncThunk(
  "auth/login",
  async (loginData, thunkApi) => {
    try {
      return await authService.login(loginData);
    } catch (err) {
      return thunkApi.rejectWithValue(err);
    }
  }
);

const initialState = {
  isError: false,
  isLoading: false,
  isSuccess: false,
  message: "",
};

export const authSlice = createSlice({
  name: "auth",
  initialState: initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(loginFunc.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loginFunc.fulfilled, (state, action) => {
        state.isError = false;
        state.isLoading = false;
        state.isSuccess = true;
        state.message = "Success";
      })
      .addCase(loginFunc.rejected, (state, action) => {
        state.isError = true;
        state.isLoading = false;
        state.isSuccess = false;
        state.message = action.payload;
      })
  },
});

export default authSlice.reducer;