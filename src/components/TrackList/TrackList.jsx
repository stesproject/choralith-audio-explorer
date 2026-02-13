import React, { useRef, useEffect } from "react";

export default function TrackList({
    filteredTracks,
    currentTrackIndex,
    playTrack,
    favourites,
    toggleFavourite,
    openDirectoryAtPath,
    filters,
    setFilters,
}) {
    const tableRef = useRef(null);
    const rowRefs = useRef([]);

    // Focus table when tracks are loaded
    useEffect(() => {
        if (filteredTracks.length > 0 && tableRef.current) {
            if (document.activeElement === document.body) {
                tableRef.current.focus();
            }
        }
    }, [filteredTracks]);

    // Scroll active track into view
    useEffect(() => {
        if (currentTrackIndex !== null && rowRefs.current[currentTrackIndex]) {
            rowRefs.current[currentTrackIndex].scrollIntoView({
                block: "center",
            });
        }
    }, [currentTrackIndex, filteredTracks]);

    return (
        <main>
            <table ref={tableRef} tabIndex="0">
                <thead>
                    <tr>
                        <th style={{ width: "40px" }}></th>
                        <th>
                            <div className="th-content">
                                <span>Title</span>
                                <input
                                    className="col-filter"
                                    placeholder="Filter title..."
                                    value={filters.title}
                                    onChange={(e) => setFilters.setTitle(e.target.value)}
                                />
                            </div>
                        </th>
                        <th>
                            <div className="th-content">
                                <span>Artist</span>
                                <input
                                    className="col-filter"
                                    placeholder="Filter artist..."
                                    value={filters.artist}
                                    onChange={(e) => setFilters.setArtist(e.target.value)}
                                />
                            </div>
                        </th>
                        <th>
                            <div className="th-content">
                                <span>Album</span>
                                <input
                                    className="col-filter"
                                    placeholder="Filter album..."
                                    value={filters.album}
                                    onChange={(e) => setFilters.setAlbum(e.target.value)}
                                />
                            </div>
                        </th>
                        <th>
                            <div className="th-content">
                                <span>Length</span>
                                <input
                                    className="col-filter"
                                    placeholder="Max length..."
                                    value={filters.length}
                                    onChange={(e) => setFilters.setLength(e.target.value)}
                                />
                            </div>
                        </th>
                        <th>Open Directory</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredTracks.map((track, idx) => {
                        const isFav = favourites.some((t) => t.path === track.path);
                        return (
                            <tr
                                key={idx}
                                ref={(el) => (rowRefs.current[idx] = el)}
                                className={idx === currentTrackIndex ? "active" : ""}
                                onClick={() => {
                                    playTrack(idx);
                                }}
                            >
                                <td>
                                    <button
                                        className="fav-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggleFavourite(track);
                                        }}
                                        style={{
                                            background: "transparent",
                                            padding: "2px",
                                            color: isFav ? "#fbbf24" : "#9ca3af",
                                        }}
                                        title={
                                            isFav ? "Remove from favourites" : "Add to favourites"
                                        }
                                    >
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            viewBox="0 0 16 16"
                                        >
                                            {isFav ? (
                                                <path d="M3.612 15.443c-.386.198-.824-.149-.746-.592l.83-4.73L.173 6.765c-.329-.314-.158-.888.283-.95l4.898-.696L7.538.792c.197-.39.73-.39.927 0l2.184 4.327 4.898.696c.441.062.612.636.282.95l-3.522 3.356.83 4.73c.078.443-.36.79-.746.592L8 13.187l-4.389 2.256z" />
                                            ) : (
                                                <path d="M2.866 14.85c-.078.444.36.791.746.593l4.39-2.256 4.389 2.256c.386.198.824-.149.746-.592l-.83-4.73 3.522-3.356c.33-.314.16-.888-.282-.95l-4.898-.696L8.465.792a.513.513 0 0 0-.927 0L5.354 5.12l-4.898.696c-.441.062-.612.636-.283.95l3.523 3.356-.83 4.73zm4.905-2.767-3.686 1.894.694-3.957a.565.565 0 0 0-.163-.505L1.71 6.745l4.052-.576a.525.525 0 0 0 .393-.288L8 2.223l1.847 3.658a.525.525 0 0 0 .393.288l4.052.575-2.906 2.77a.565.565 0 0 0-.163.506l.694 3.957-3.686-1.894a.503.503 0 0 0-.461 0z" />
                                            )}
                                        </svg>
                                    </button>
                                </td>
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
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            width="16"
                                            height="16"
                                            fill="currentColor"
                                            className="bi bi-folder2-open"
                                            viewBox="0 0 16 16"
                                        >
                                            <path d="M1 3.5A1.5 1.5 0 0 1 2.5 2h2.764c.958 0 1.76.56 2.311 1.184C7.985 3.648 8.48 4 9 4h4.5A1.5 1.5 0 0 1 15 5.5v.64c.57.265.94.876.856 1.546l-.64 5.124A2.5 2.5 0 0 1 12.733 15H3.266a2.5 2.5 0 0 1-2.481-2.19l-.64-5.124A1.5 1.5 0 0 1 1 6.14zM2 6h12v-.5a.5.5 0 0 0-.5-.5H9c-.964 0-1.71-.629-2.174-1.154C6.374 3.334 5.82 3 5.264 3H2.5a.5.5 0 0 0-.5.5zm-.367 1a.5.5 0 0 0-.496.562l.64 5.124A1.5 1.5 0 0 0 3.266 14h9.468a1.5 1.5 0 0 0 1.489-1.314l.64-5.124A.5.5 0 0 0 14.367 7z" />
                                        </svg>
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </main>
    );
}
