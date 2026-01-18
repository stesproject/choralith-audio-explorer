import { useState, useMemo, useEffect, useRef } from "react";
import "./App.css";
import { getCachedTracks, cacheTracks } from "./cacheManager";

function App() {
  const [tracks, setTracks] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [excludeKeyword, setExcludeKeyword] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [progress, setProgress] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [pitch, setPitch] = useState(0); // pitch in semitones
  const [loop, setLoop] = useState(false); // loop state

  const selectFolderButton = useRef(null);
  const tracksTable = useRef(null);
  const audioPlayer = useRef(null);
  const rowRefs = useRef([]);

  const filteredTracks = useMemo(() => {
    const searchKeywords = searchKeyword
      .toLowerCase()
      .split(" ")
      .filter(Boolean);
    const excludeKeywords = excludeKeyword
      .toLowerCase()
      .split(" ")
      .filter(Boolean);

    return tracks.filter((track) => {
      const title = track.title?.toLowerCase() || "";
      const matchKeyword =
        searchKeywords.length === 0 ||
        searchKeywords.every((kw) => title.includes(kw));
      const excludeMatch =
        excludeKeywords.length === 0 ||
        excludeKeywords.every((kw) => !title.includes(kw));
      const lengthOk = !maxLength || track.length <= parseInt(maxLength);
      return matchKeyword && excludeMatch && lengthOk;
    });
  }, [tracks, searchKeyword, excludeKeyword, maxLength]);

  useEffect(() => {
    if (window.api) {
      const handler = (event, data) => setProgress(data);
      window.api.onScanProgress(handler);
    }
  }, []);

  useEffect(() => {
    if (currentTrackIndex !== null && rowRefs.current[currentTrackIndex]) {
      rowRefs.current[currentTrackIndex].scrollIntoView({
        block: "center",
      });
    }
  }, [currentTrackIndex, filteredTracks]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (!filteredTracks.length) return;
      if (
        ["INPUT", "TEXTAREA", "BUTTON"].includes(document.activeElement.tagName)
      ) {
        return;
      }

      if (e.key === "ArrowDown") {
        e.preventDefault();
        const next =
          currentTrackIndex === null
            ? 0
            : Math.min(currentTrackIndex + 1, filteredTracks.length - 1);
        playTrack(next);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        const prev =
          currentTrackIndex === null ? 0 : Math.max(currentTrackIndex - 1, 0);
        playTrack(prev);
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        setPitch((p) => Math.min(p + 1, 12));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        setPitch((p) => Math.max(p - 1, -12));
      } else if (e.key.toLowerCase() === "l") {
        setLoop((l) => !l);
      } else if (e.key === "1") {
        setPitch(0);
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (audioPlayer.current.paused) {
          audioPlayer.current.play();
        } else {
          audioPlayer.current.pause();
        }
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [currentTrackIndex, filteredTracks]);

  // Keep the audio element's playbackRate in sync with the chosen pitch (semitones)
  useEffect(() => {
    if (audioPlayer.current) {
      audioPlayer.current.playbackRate = Math.pow(2, pitch / 12);
    }
  }, [pitch]);

  // Keep audio element's loop property in sync with state
  useEffect(() => {
    if (audioPlayer.current) {
      audioPlayer.current.loop = loop;
    }
  }, [loop]);

  const selectFolder = async () => {
    try {
      const folderPath = await window.api.pickFolder();
      if (!folderPath) return;

      // Now that we have the path, check for cached data
      const cachedData = await getCachedTracks(folderPath);

      const result = await window.api.scanFolder(
        folderPath,
        cachedData?.tracks || [],
        cachedData?.fileStats || {}
      );

      if (result?.tracks?.length) {
        setTracks(result.tracks);
        selectFolderButton.current.blur();
        tracksTable.current.focus();

        // Update cache with new scan results
        await cacheTracks(folderPath, result.tracks, result.fileStats);

        // Log cache statistics
        if (result.fromCacheCount > 0) {
          console.log(`Loaded ${result.fromCacheCount} tracks from cache, scanned ${result.scannedCount} new/modified files`);
        }
      }

      // Clear progress once done
      setProgress(null);
    } catch (error) {
      console.error("Error selecting folder:", error);
      setProgress(null);
    }
  };

  const playTrack = (index) => {
    if (index >= 0 && index < filteredTracks.length) {
      if (audioPlayer.current) {
        audioPlayer.current.src = encodeURI(
          `localfile://${filteredTracks[index].path}`
        );
        // apply current pitch (semitones) to playbackRate
        audioPlayer.current.playbackRate = Math.pow(2, pitch / 12);
        audioPlayer.current.play();
        setCurrentTrackIndex(index);
      }
    }
  };

  const openDirectoryAtPath = (path) => {
    window.api.openFolder(path);
  };

  return (
    <>
      {progress && (
        <div className="progress-overlay">
          <div className="progress-box">
            <h3>Scanning Files...</h3>
            <p>
              {progress.current} / {progress.total}
            </p>
            <progress value={progress.current} max={progress.total}></progress>
            {progress.currentFile && (
              <p className="progress-path" title={progress.currentFile}>
                {progress.currentFile.length > 60 ? `...${progress.currentFile.slice(-57)}` : progress.currentFile}
              </p>
            )}
          </div>
        </div>
      )}
      <header>
        <div className="header-content">
          <button ref={selectFolderButton} onClick={selectFolder}>
            Select Folder
          </button>
          {tracks?.length > 0 && (
            <div className="search-controls">
              <input
                placeholder="Search keyword"
                value={searchKeyword}
                onChange={(e) => setSearchKeyword(e.target.value)}
              />
              <input
                placeholder="Exclude keyword"
                value={excludeKeyword}
                onChange={(e) => setExcludeKeyword(e.target.value)}
              />
              <input
                placeholder="Max Length (sec)"
                value={maxLength}
                onChange={(e) => setMaxLength(e.target.value)}
              />
              <span>{filteredTracks.length} tracks</span>
            </div>
          )}
        </div>
      </header>
      {tracks?.length > 0 && (
        <>
          <main>
            <table ref={tracksTable}>
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Artist</th>
                  <th>Album</th>
                  <th>Length</th>
                  <th>Open Directory</th>
                </tr>
              </thead>
              <tbody>
                {filteredTracks.map((track, idx) => (
                  <tr
                    key={idx}
                    ref={(el) => (rowRefs.current[idx] = el)}
                    className={idx === currentTrackIndex ? "active" : ""}
                    onClick={() => {
                      playTrack(idx);
                    }}
                  >
                    <td>{track.title}</td>
                    <td>{track.artist}</td>
                    <td>{track.album}</td>
                    <td>{Math.round(track.length)}s</td>
                    <td>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          openDirectoryAtPath(track.path);
                        }}
                        title="Open directory"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-folder2-open" viewBox="0 0 16 16">
                          <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v.64c.57.265.94.876.856 1.546l-.64 5.124A2.5 2.5 0 0 1 12.733 15H3.266a2.5 2.5 0 0 1-2.481-2.19l-.64-5.124A1.5 1.5 0 0 1 1 6.14zM2 6h12v-.5a.5.5 0 0 0-.5-.5H9c-.964 0-1.71-.629-2.174-1.154C6.374 3.334 5.82 3 5.264 3H2.5a.5.5 0 0 0-.5.5zm-.367 1a.5.5 0 0 0-.496.562l.64 5.124A1.5 1.5 0 0 0 3.266 14h9.468a1.5 1.5 0 0 0 1.489-1.314l.64-5.124A.5.5 0 0 0 14.367 7z" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </main>
          <div className="audio-player">
            <audio ref={audioPlayer} style={{ width: "100%" }} controls loop={loop} />
            <div className="pitch-control" style={{ marginTop: 8 }}>
              <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span>Pitch</span>
                <input
                  type="range"
                  min="-12"
                  max="12"
                  value={pitch}
                  onChange={(e) => setPitch(parseFloat(e.target.value))}
                />
                <span style={{ marginLeft: 8, width: 100 }}>
                  {Math.round(Math.pow(2, pitch / 12) * 100) / 100}x
                </span>
              </label>
              <button
                type="button"
                className="loop-btn"
                onClick={() => {
                  setLoop((l) => !l);
                  if (audioPlayer.current) {
                    audioPlayer.current.loop = !loop;
                  }
                }}
                style={{
                  background: loop ? "#cce" : "",
                }}
                title={loop ? "Disable loop" : "Enable loop"}
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  fill="currentColor"
                  class="bi bi-repeat"
                  viewBox="0 0 16 16"
                >
                  <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z" />
                </svg>
              </button>
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default App;
