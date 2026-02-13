import React from "react";

export default function Header({
    selectFolder,
    selectFolderButtonRef,
    showFavourites,
    setShowFavourites,
    tracks,
    excludeKeyword,
    setExcludeKeyword,
    currentTrackIndex,
    filteredTracksLength,
    favouritesCount,
}) {
    return (
        <header>
            <div className="header-content">
                <button ref={selectFolderButtonRef} onClick={selectFolder}>
                    Select Folder
                </button>
                <button
                    onClick={() => setShowFavourites(!showFavourites)}
                    style={{
                        marginLeft: "1rem",
                        backgroundColor: showFavourites ? "#d97706" : "#4b5563",
                    }}
                    title={showFavourites ? "Show all tracks" : "Show favourites"}
                >
                    {showFavourites ? "All Tracks" : `Favourites (${favouritesCount})`}
                </button>
                {(tracks?.length > 0 || showFavourites) && (
                    <div className="search-controls">
                        <input
                            placeholder="Exclude keywords"
                            value={excludeKeyword}
                            onChange={(e) => setExcludeKeyword(e.target.value)}
                        />
                        <span>
                            {currentTrackIndex !== null ? `${currentTrackIndex + 1}/` : ""}
                            {filteredTracksLength} tracks
                        </span>
                    </div>
                )}
            </div>
        </header>
    );
}
