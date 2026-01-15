import { useState, useMemo, useEffect, useRef } from "react";
import "./App.css";

function App() {
  const [tracks, setTracks] = useState([]);
  const [searchKeyword, setSearchKeyword] = useState("");
  const [excludeKeyword, setExcludeKeyword] = useState("");
  const [maxLength, setMaxLength] = useState("");
  const [progress, setProgress] = useState(null);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
  const [pitch, setPitch] = useState(0); // pitch in semitones

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

  const selectFolder = async () => {
    const files = await window.api.selectFolder();
    if (files?.length) {
      setTracks(files);
      selectFolderButton.current.blur();
      tracksTable.current.focus();
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
      {progress && progress.current < progress.total && (
        <div className="progress-overlay">
          <div className="progress-box">
            <h3>Scanning Files...</h3>
            <p>
              {progress.current} / {progress.total}
            </p>
            <progress value={progress.current} max={progress.total}></progress>
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
                        📂
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </main>
          <div className="audio-player">
            <audio ref={audioPlayer} style={{ width: "100%" }} controls />
            <div className="pitch-control" style={{ marginTop: 8 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
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
            </div>
          </div>
        </>
      )}
    </>
  );
}

export default App;
