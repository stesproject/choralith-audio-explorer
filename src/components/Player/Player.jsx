import React from "react";

export default function Player({ audioRef, pitch, setPitch, loop, setLoop }) {
    return (
        <div className="audio-player">
            <audio ref={audioRef} style={{ width: "100%" }} controls loop={loop} />
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
                        if (audioRef.current) {
                            audioRef.current.loop = !loop;
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
                        className="bi bi-repeat"
                        viewBox="0 0 16 16"
                    >
                        <path d="M11 5.466V4H5a4 4 0 0 0-3.584 5.777.5.5 0 1 1-.896.446A5 5 0 0 1 5 3h6V1.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384l-2.36 1.966a.25.25 0 0 1-.41-.192m3.81.086a.5.5 0 0 1 .67.225A5 5 0 0 1 11 13H5v1.466a.25.25 0 0 1-.41.192l-2.36-1.966a.25.25 0 0 1 0-.384l2.36-1.966a.25.25 0 0 1 .41.192V12h6a4 4 0 0 0 3.585-5.777.5.5 0 0 1 .225-.67Z" />
                    </svg>
                </button>
            </div>
        </div>
    );
}
