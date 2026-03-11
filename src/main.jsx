import ReactDOM from "react-dom/client";
import "./tauri-shim";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App.jsx";
import { storeConfig } from "./store/store.jsx";
import { Provider } from "react-redux";
import "./utils/i18n.jsx";
// mount into the #app element (pre-rendered in index.html) so that our
// pre-hydration theme script can target the same node and avoid a flash.
const root = ReactDOM.createRoot(document.getElementById("app"));
root.render(
  <Provider store={storeConfig}>
    <App />
  </Provider>
);
