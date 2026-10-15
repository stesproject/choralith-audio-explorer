use std::collections::HashMap;
use std::fs;
use std::path::Path;
use std::time::UNIX_EPOCH;

use lofty::prelude::*;
use lofty::probe::Probe;
use serde::{Deserialize, Serialize};
use tauri::Emitter;
use walkdir::WalkDir;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Track {
    pub path: String,
    pub title: String,
    pub artist: String,
    pub album: String,
    pub length: f64,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanProgress {
    pub current: usize,
    pub total: usize,
    pub current_file: String,
    pub scanned_count: usize,
    pub from_cache_count: usize,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ScanResult {
    pub tracks: Vec<Track>,
    pub file_stats: HashMap<String, f64>,
    pub folder_path: String,
    pub scanned_count: usize,
    pub from_cache_count: usize,
}

fn is_audio_file(path: &Path) -> bool {
    matches!(
        path.extension()
            .and_then(|ext| ext.to_str())
            .map(|s| s.to_ascii_lowercase())
            .as_deref(),
        Some("mp3" | "wav" | "ogg" | "flac")
    )
}

fn get_file_mtime(path: &Path) -> f64 {
    fs::metadata(path)
        .and_then(|m| m.modified())
        .ok()
        .and_then(|time| time.duration_since(UNIX_EPOCH).ok())
        .map(|d| d.as_millis() as f64)
        .unwrap_or(0.0)
}

fn extract_metadata(path: &Path, file_name: &str) -> (String, String, String, f64) {
    match Probe::open(path).and_then(|p| p.read()) {
        Ok(tagged_file) => {
            let duration = tagged_file.properties().duration().as_secs_f64();
            let tag = tagged_file.primary_tag().or_else(|| tagged_file.first_tag());
            let title = tag
                .and_then(|t| t.title().as_deref().map(ToString::to_string))
                .filter(|s| !s.trim().is_empty())
                .unwrap_or_else(|| file_name.to_string());
            let artist = tag
                .and_then(|t| t.artist().as_deref().map(ToString::to_string))
                .unwrap_or_default();
            let album = tag
                .and_then(|t| t.album().as_deref().map(ToString::to_string))
                .unwrap_or_default();

            (title, artist, album, duration)
        }
        Err(_) => (file_name.to_string(), String::new(), String::new(), 0.0),
    }
}

#[tauri::command]
async fn scan_folder(
    app: tauri::AppHandle,
    folder: String,
    cached_tracks: Option<Vec<Track>>,
    cached_stats: Option<HashMap<String, f64>>,
) -> Result<ScanResult, String> {
    let folder_path = Path::new(&folder);
    if !folder_path.exists() || !folder_path.is_dir() {
        return Err(format!("Directory does not exist: {}", folder));
    }

    // Collect all audio files recursively
    let mut audio_files = Vec::new();
    for entry in WalkDir::new(folder_path).into_iter().filter_map(|e| e.ok()) {
        let path = entry.path();
        if path.is_file() && is_audio_file(path) {
            audio_files.push(path.to_path_buf());
        }
    }

    let total = audio_files.len();
    let mut tracks = Vec::with_capacity(total);
    let mut file_stats = HashMap::with_capacity(total);

    let mut cached_track_map: HashMap<String, Track> = HashMap::new();
    if let Some(c_tracks) = cached_tracks {
        for track in c_tracks {
            cached_track_map.insert(track.path.clone(), track);
        }
    }
    let cached_stats_map = cached_stats.unwrap_or_default();

    let mut scanned_count = 0;
    let mut from_cache_count = 0;

    for (i, file_path) in audio_files.iter().enumerate() {
        let path_str = file_path.to_string_lossy().to_string();
        let mtime = get_file_mtime(file_path);
        file_stats.insert(path_str.clone(), mtime);

        let is_cached = cached_stats_map
            .get(&path_str)
            .map(|&cached_mtime| cached_mtime == mtime)
            .unwrap_or(false)
            && cached_track_map.contains_key(&path_str);

        if is_cached {
            if let Some(track) = cached_track_map.remove(&path_str) {
                tracks.push(track);
                from_cache_count += 1;
            }
        } else {
            let file_name = file_path
                .file_name()
                .and_then(|n| n.to_str())
                .unwrap_or("")
                .to_string();

            let (title, artist, album, length) = extract_metadata(file_path, &file_name);
            tracks.push(Track {
                path: path_str.clone(),
                title,
                artist,
                album,
                length,
            });
            scanned_count += 1;
        }

        if (i + 1) % 5 == 0 || i + 1 == total {
            let _ = app.emit(
                "scan-progress",
                ScanProgress {
                    current: i + 1,
                    total,
                    current_file: path_str,
                    scanned_count,
                    from_cache_count,
                },
            );
        }
    }

    Ok(ScanResult {
        tracks,
        file_stats,
        folder_path: folder,
        scanned_count,
        from_cache_count,
    })
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::default().build())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .invoke_handler(tauri::generate_handler![scan_folder])
        .run(tauri::generate_context!())
        .expect("error while building tauri application");
}

