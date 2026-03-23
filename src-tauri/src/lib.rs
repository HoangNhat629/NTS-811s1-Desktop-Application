use std::{
    process::Command,
    sync::{
        atomic::{AtomicBool, Ordering},
        Arc, Mutex, OnceLock,
    },
    thread,
    time::{Duration, SystemTime, UNIX_EPOCH},
};
use serde_json::Value;
#[cfg(target_os = "windows")]
use std::os::windows::process::CommandExt;

use chrono::Utc;
use tauri::{AppHandle, Window, Manager, Emitter, RunEvent};

#[derive(Clone, serde::Serialize)]
struct PingStatus {
    host: String,
    port: u16,
    online: bool,
    timestamp: i64,
}

struct PingHandle {
    stop_flag: Arc<AtomicBool>,
}

static ACTIVE_PING: OnceLock<Mutex<Option<PingHandle>>> = OnceLock::new();

fn active_ping() -> &'static Mutex<Option<PingHandle>> {
    ACTIVE_PING.get_or_init(|| Mutex::new(None))
}

#[tauri::command]
fn app_version() -> String {
    option_env!("CARGO_PKG_VERSION")
        .unwrap_or("unknown")
        .to_string()
}

#[tauri::command]
fn read_xml_config(app: AppHandle) -> Result<String, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {e}"))?;

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Cannot create app data dir: {e}"))?;

    let target_path = app_data_dir.join("mission_schedule_config.xml");

    if !target_path.exists() {
        let bundled_path = app
            .path()
            .resolve("resources/mission_schedule_config.xml", tauri::path::BaseDirectory::Resource)
            .map_err(|e| format!("Bundled XML not found: {e}"))?;

        std::fs::copy(&bundled_path, &target_path)
            .map_err(|e| format!("Cannot copy default XML: {e}"))?;
    }

    std::fs::read_to_string(&target_path)
        .map_err(|e| format!("Cannot read XML: {e}"))
}

#[tauri::command]
fn start_ping(window: Window, host: String, port: u16) -> Result<(), String> {
    // stop previous ping if exists
    {
        let mut active = active_ping().lock().unwrap();
        if let Some(h) = active.take() {
            h.stop_flag.store(true, Ordering::SeqCst);
        }
    }

    let stop_flag = Arc::new(AtomicBool::new(false));
    let stop_clone = stop_flag.clone();
    let w = window.clone();
    let host_clone = host.clone();

    thread::spawn(move || {
        while !stop_clone.load(Ordering::SeqCst) {
            #[cfg(target_os = "windows")]
            let output = Command::new("ping")
                .args([&host_clone, "-n", "1"])
                .creation_flags(0x08000000)
                .output();

            #[cfg(not(target_os = "windows"))]
            let output = Command::new("ping")
                .args(["-c", "1", &host_clone])
                .output();

            let online = output
                .ok()
                .map(|o| {
                    let out = String::from_utf8_lossy(&o.stdout);
                    out.contains("TTL=") || out.contains("ttl=")
                })
                .unwrap_or(false);

            if stop_clone.load(Ordering::SeqCst) {
                break;
            }

            let status = PingStatus {
                host: host_clone.clone(),
                port,
                online,
                timestamp: Utc::now().timestamp_millis(),
            };

            eprintln!("Emitting ping:status for {}:{} - online: {}", host_clone, port, online);
            let _ = w.emit("ping:status", &status);

            for _ in 0..5 {
                if stop_clone.load(Ordering::SeqCst) {
                    break;
                }
                thread::sleep(Duration::from_secs(1));
            }
        }
    });

    *active_ping().lock().unwrap() = Some(PingHandle { stop_flag });

    Ok(())
}

#[tauri::command]
fn stop_ping(_host: String, _port: u16) -> Result<(), String> {
    if let Some(h) = active_ping().lock().unwrap().take() {
        h.stop_flag.store(true, Ordering::SeqCst);
        Ok(())
    } else {
        Err("No active ping found".into())
    }
}

#[tauri::command]
fn set_session_close_time(app: AppHandle) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {e}"))?;

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Cannot create app data dir: {e}"))?;

    let timestamp = SystemTime::now()
        .duration_since(UNIX_EPOCH)
        .map_err(|e| format!("Time error: {e}"))?
        .as_millis();

    let file_path = app_data_dir.join("session_close_time");
    std::fs::write(file_path, timestamp.to_string())
        .map_err(|e| format!("Cannot write session time: {e}"))?;

    Ok(())
}

#[tauri::command]
fn get_session_close_time(app: AppHandle) -> Result<Option<u64>, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {e}"))?;

    let file_path = app_data_dir.join("session_close_time");

    if !file_path.exists() {
        return Ok(None);
    }

    let content = std::fs::read_to_string(file_path)
        .map_err(|e| format!("Cannot read session time: {e}"))?;

    let timestamp: u64 = content.trim().parse()
        .map_err(|e| format!("Invalid timestamp: {e}"))?;

    Ok(Some(timestamp))
}

#[tauri::command]
fn clear_session_close_time(app: AppHandle) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {e}"))?;

    let file_path = app_data_dir.join("session_close_time");

    if file_path.exists() {
        std::fs::remove_file(file_path)
            .map_err(|e| format!("Cannot remove session time file: {e}"))?;
    }

    Ok(())
}

#[tauri::command]
fn create_file_draft(app: AppHandle, payload: Value) -> Result<(), String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {e}"))?;

    std::fs::create_dir_all(&app_data_dir)
        .map_err(|e| format!("Cannot create app data dir: {e}"))?;

    let file_path = app_data_dir.join("file_draft_config.json");

    std::fs::write(
        &file_path,
        serde_json::to_string_pretty(&payload)
            .map_err(|e| e.to_string())?,
    )
    .map_err(|e| format!("Cannot write file: {e}"))?;

    println!("File draft created {:?}", file_path);
    Ok(())
}

#[tauri::command]
fn read_file_draft(app: AppHandle) -> Result<Value, String> {
    let app_data_dir = app
        .path()
        .app_data_dir()
        .map_err(|e| format!("Cannot resolve app data dir: {e}"))?;
    
    let file_path = app_data_dir.join("file_draft_config.json");

    if !file_path.exists() {
        return Err("Draft file does not exist".into());
    }

    let content = std::fs::read_to_string(&file_path)
        .map_err(|e| format!("Cannot read file: {e}"))?;

    let json: Value =
        serde_json::from_str(&content)
            .map_err(|e| format!("Invalid JSON: {e}"))?;

    println!("File draft loaded {:?}", file_path);

    Ok(json)
}

fn delete_file_draft(app: &AppHandle) {
    if let Ok(dir) = app.path().app_data_dir() {
        let file = dir.join("file_draft_config.json");

        if file.exists() {
            let _ = std::fs::remove_file(file);
        }
    }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            app_version,
            read_xml_config,
            start_ping,
            stop_ping,
            set_session_close_time,
            get_session_close_time,
            clear_session_close_time,
            create_file_draft, 
            read_file_draft 
        ])
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(move |_app, event| match event {
            RunEvent::WindowEvent { label, event, .. } => {
                if let tauri::WindowEvent::CloseRequested { .. } = event {
                    // App is closing, record the close time directly
                    if let Ok(app_data_dir) = _app.path().app_data_dir() {
                        let _ = std::fs::create_dir_all(&app_data_dir);
                        if let Ok(timestamp) = SystemTime::now().duration_since(UNIX_EPOCH) {
                            let file_path = app_data_dir.join("session_close_time");
                            let _ = std::fs::write(file_path, timestamp.as_millis().to_string());
                        }
                    }

                    delete_file_draft(_app);
                }
            }
            RunEvent::Exit => {
                delete_file_draft(_app);
            }
            _ => {}
        });
}