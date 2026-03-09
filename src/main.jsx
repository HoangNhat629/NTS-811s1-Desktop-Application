import ReactDOM from "react-dom/client";
import "./tauri-shim";
import "bootstrap/dist/css/bootstrap.min.css";
import "./index.css";
import App from "./App.jsx";
import { storeConfig } from "./store/store.jsx";
import { Provider } from "react-redux";
import "./utils/i18n.jsx";
const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <Provider store={storeConfig}>
    <App />
  </Provider>
);
