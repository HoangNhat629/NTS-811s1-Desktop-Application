import "./App.css";
import { HashRouter as Router, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import { SettingPage } from "./pages/System/SettingPage";
import { FREQPage } from "./pages/System/FREQPage";
import { RadioPage } from "./pages/System/RadioPage";
import { ToastContainer } from "react-toastify";
import { OpenRouting } from "./routing/OpenRouting";
import { PrivateRouting } from "./routing/PrivateRouting";
import { CryptoTable } from "./pages/System/CryptoTable";
import ConnectionPage from "./pages/Connection/ConnectionPage";
import { PageNotFound } from "./pages/System/PageNotFound";
import { OutletDisableProvider } from "./context/OutletDisableContext";
import { useEffect } from "react";
import { IdleTimeoutProvider } from "./context/IdleTimeoutContext";
import { SessionTimeoutWrapper } from "./context/SessionTimeoutWrapper";

function App() {
  useEffect(() => {
    if (!import.meta.env.DEV) {
      const blockContext = (e) => e.preventDefault();
      const blockKeys = (e) => {
        if (e.key === "F12" || (e.ctrlKey && e.shiftKey && e.key === "I")) {
          e.preventDefault();
        }
      };

      document.addEventListener("contextmenu", blockContext);
      document.addEventListener("keydown", blockKeys);

      return () => {
        document.removeEventListener("contextmenu", blockContext);
        document.removeEventListener("keydown", blockKeys);
      };
    }
  }, []);
  return (
    <OutletDisableProvider>
      <div id="app" data-theme="light">
        <Router>
          <SessionTimeoutWrapper>
            <Routes>
              <Route
                path="/"
                element={
                  <OpenRouting>
                    <Login />
                  </OpenRouting>
                }
              />
              <Route
                path="/connection"
                element={
                  <PrivateRouting>
                    <IdleTimeoutProvider>
                      <ConnectionPage />
                    </IdleTimeoutProvider>
                  </PrivateRouting>
                }
              />
              <Route
                path="/setting"
                element={
                  <PrivateRouting>
                    <IdleTimeoutProvider>
                      <SettingPage />
                    </IdleTimeoutProvider>
                  </PrivateRouting>
                }
              >
                <Route index element={<RadioPage />} />
                <Route path="radio" element={<RadioPage />} />
                <Route path="freq" element={<FREQPage />} />
                <Route path="crypto" element={<CryptoTable />} />
                <Route path="not-found" element={<PageNotFound />} />
              </Route>
            </Routes>
            <ToastContainer
              position="top-right"
              autoClose={4000}
              hideProgressBar={false}
              newestOnTop
              closeOnClick
              pauseOnHover
              draggable
              theme="light"
              limit={3}
            />
          </SessionTimeoutWrapper>
        </Router>
      </div>
    </OutletDisableProvider>
  );
}

export default App;
