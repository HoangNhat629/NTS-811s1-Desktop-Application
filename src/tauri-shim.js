import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";

const listeners = new Map();

const ipcRenderer = {
  send: (channel, data) => {
    if (channel === "ping:start") {
      return invoke("start_ping", { host: data.host, port: Number(data.port) });
    } else if (channel === "ping:stop") {
      return invoke("stop_ping", { host: data.host || "", port: Number(data.port) || 0 });
    }
    return invoke(channel, data);
  },
  on: (channel, func) => {
    const wrapped = (event) => func(event.payload);
    listen(channel, wrapped)
      .then((unlisten) => {
        listeners.set(func, unlisten);
      })
      .catch(() => {});
  },
  once: (channel, func) => {
    const wrapped = (event) => {
      try {
        func(event.payload);
      } catch (e) {}
      const un = listeners.get(func);
      if (un) {
        un();
        listeners.delete(func);
      }
    };
    listen(channel, wrapped)
      .then((unlisten) => {
        listeners.set(func, unlisten);
      })
      .catch(() => {});
  },
  removeListener: (_channel, func) => {
    const un = listeners.get(func);
    if (un) {
      un();
      listeners.delete(func);
    }
  },
};

const electronAPI = {
  ipcRenderer,
  readXmlConfig: () => invoke("read_xml_config"),
  appVersion: () => invoke("app_version"),
  readSessionCloseTime: () => invoke("get_session_close_time"),
  setSessionCloseTime: () => invoke("set_session_close_time"),
  clearSessionCloseTime: () => invoke("clear_session_close_time"),
};

export { electronAPI };

