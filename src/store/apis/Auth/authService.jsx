import axios from "axios";
import { config } from "../../../utils/axiosConfig";
const login = async (loginData) => {
  try {
    const res = await axios.post("/api/login", loginData, config);
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

export const authService = {
  login,
};
