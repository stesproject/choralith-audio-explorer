const { parentPort, workerData } = require("worker_threads");
const fs = require("fs");
const path = require("path");
const mm = require("music-metadata");

function isAudioFile(filename) {
  return [".mp3", ".wav", ".ogg", ".flac"].includes(
    path.extname(filename).toLowerCase()
  );
}

function getAllFiles(dir, allFiles = []) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      getAllFiles(fullPath, allFiles);
    } else {
      allFiles.push(fullPath);
    }
  }
  return allFiles;
}

/**
 * Get file modification time
 */
function getFileMtime(filePath) {
  try {
    const stats = fs.statSync(filePath);
    return stats.mtimeMs;
  } catch (err) {
    return 0;
  }
}

/**
 * Check if file needs to be scanned based on cache
 */
function needsScan(filePath, cachedStats) {
  if (!cachedStats || !cachedStats[filePath]) {
    return true; // File not in cache
  }
  const currentMtime = getFileMtime(filePath);
  return currentMtime !== cachedStats[filePath];
}

async function scanFolder(folder, cachedTracks = [], cachedStats = {}) {
  const allFiles = getAllFiles(folder);
  const audioFiles = allFiles.filter(isAudioFile);
  const total = audioFiles.length;
  const tracks = [];
  const fileStats = {};

  // Create a map of cached tracks by path for quick lookup
  const cachedTrackMap = {};
  for (const track of cachedTracks) {
    cachedTrackMap[track.path] = track;
  }

  let scannedCount = 0;
  let fromCacheCount = 0;

  for (let i = 0; i < total; i++) {
    const file = audioFiles[i];
    const mtime = getFileMtime(file);
    fileStats[file] = mtime;

    let trackData;

    // Use cached data if file hasn't changed
    if (!needsScan(file, cachedStats) && cachedTrackMap[file]) {
      trackData = cachedTrackMap[file];
      fromCacheCount++;
    } else {
      // Scan the file
      let metadata = {};
      try {
        const meta = await mm.parseFile(file);
        metadata = {
          title: meta.common.title || path.basename(file),
          artist: meta.common.artist || "",
          album: meta.common.album || "",
          length: meta.format.duration || 0,
        };
      } catch (err) {
        metadata = {
          title: path.basename(file),
          artist: "",
          album: "",
          length: 0,
        };
      }

      trackData = {
        path: file,
        ...metadata,
      };
      scannedCount++;
    }

    tracks.push(trackData);

    if (i % 5 === 0 || i === total - 1) {
      parentPort.postMessage({
        type: "progress",
        current: i + 1,
        total,
        currentFile: file,
        scannedCount,
        fromCacheCount,
      });
    }
  }

  parentPort.postMessage({
    type: "done",
    tracks,
    fileStats,
    scannedCount,
    fromCacheCount,
  });
}

const { folder, cachedTracks, cachedStats } = workerData;
scanFolder(folder, cachedTracks, cachedStats);
