import { useMemo } from "react";
import { RadioPage } from "./RadioPage";
import { FREQPage } from "./FREQPage";
import { CryptoTable } from "./CryptoTable";
import { useLocation } from "react-router-dom";

export const OutletWrapper = () => {
  const location = useLocation();
  const currentPath = useMemo(
    () => location.pathname.split("/").pop(),
    [location.pathname]
  );

  const outlets = useMemo(
    () => [
      { path: "radio", component: RadioPage, label: "Radio Page" },
      { path: "freq", component: FREQPage, label: "Frequency Page" },
      { path: "crypto", component: CryptoTable, label: "Crypto Page" },
    ],
    []
  );

  return (
    <>
      {outlets.map((outlet) => {
        const Component = outlet.component;
        return (
          <div
            key={outlet.path}
            style={{
              display: currentPath === outlet.path ? "block" : "none",
              width: "100%",
              height: "100%",
            }}
          >
            <Component />
          </div>
        );
      })}
    </>
  );
};
