import React from "react";
import { Navigate } from "react-router-dom";

export const OpenRouting = ({ children }) => {
  const getToken = localStorage.getItem("token_access");

  return getToken === null || getToken === undefined ? (
    children
  ) : (
    <Navigate to="/connection" replace={true} />
  );
};
