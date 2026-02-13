import React from "react";

export default function ProgressOverlay({ progress }) {
    if (!progress) return null;

    return (
        <div className="progress-overlay">
            <div className="progress-box">
                <h3>Scanning Files...</h3>
                <p>
                    {progress.current} / {progress.total}
                </p>
                <progress value={progress.current} max={progress.total}></progress>
                {progress.currentFile && (
                    <p className="progress-path" title={progress.currentFile}>
                        {progress.currentFile.length > 60
                            ? `...${progress.currentFile.slice(-57)}`
                            : progress.currentFile}
                    </p>
                )}
            </div>
        </div>
    );
}
