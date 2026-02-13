import React from "react";

export default function ErrorOverlay({ error, onClose }) {
    if (!error) return null;

    return (
        <div className="progress-overlay">
            <div
                className="progress-box"
                style={{
                    borderColor: "#ef4444",
                    borderStyle: "solid",
                    borderWidth: "1px",
                }}
            >
                <h3 style={{ color: "#ef4444" }}>Scanning Error</h3>
                <p style={{ margin: "1rem 0" }}>{error}</p>
                <button onClick={onClose} style={{ backgroundColor: "#ef4444" }}>
                    Close
                </button>
            </div>
        </div>
    );
}
