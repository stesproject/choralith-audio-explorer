import { useState, useEffect, useMemo, useRef } from "react";
import { getCachedTracks, cacheTracks } from "../cacheManager";

export function useTracks(favourites, showFavourites) {
    const [tracks, setTracks] = useState([]);
    const [progress, setProgress] = useState(null);
    const [error, setError] = useState(null);

    // Filtering states
    const [titleFilter, setTitleFilter] = useState("");
    const [artistFilter, setArtistFilter] = useState("");
    const [albumFilter, setAlbumFilter] = useState("");
    const [lengthFilter, setLengthFilter] = useState("");
    const [excludeKeyword, setExcludeKeyword] = useState("");

    const selectFolderButtonRef = useRef(null);

    useEffect(() => {
        if (window.api) {
            const handler = (event, data) => setProgress(data);
            window.api.onScanProgress(handler);
        }
    }, []);

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
                if (selectFolderButtonRef.current) {
                    selectFolderButtonRef.current.blur();
                }

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
            setError(error.message || "An unknown error occurred during scanning");
            setProgress(null);
        }
    };

    const filteredTracks = useMemo(() => {
        const excludeKeywords = excludeKeyword
            .toLowerCase()
            .split(" ")
            .filter(Boolean);

        const titleKeywords = titleFilter.toLowerCase().split(" ").filter(Boolean);

        const sourceTracks = showFavourites ? favourites : tracks;

        return sourceTracks.filter((track) => {
            const title = track.title?.toLowerCase() || "";
            const artist = track.artist?.toLowerCase() || "";
            const album = track.album?.toLowerCase() || "";

            const matchTitle = titleKeywords.length === 0 || titleKeywords.some(kw => title.includes(kw));
            const matchArtist = !artistFilter || artist.includes(artistFilter.toLowerCase());
            const matchAlbum = !albumFilter || album.includes(albumFilter.toLowerCase());
            const matchLength = !lengthFilter || track.length <= parseInt(lengthFilter);

            const excludeMatch =
                excludeKeywords.length === 0 ||
                excludeKeywords.every(
                    (kw) =>
                        !title.includes(kw) &&
                        !artist.includes(kw) &&
                        !album.includes(kw)
                );

            return matchTitle && matchArtist && matchAlbum && matchLength && excludeMatch;
        });
    }, [tracks, favourites, showFavourites, titleFilter, artistFilter, albumFilter, lengthFilter, excludeKeyword]);

    const filters = {
        title: titleFilter,
        artist: artistFilter,
        album: albumFilter,
        length: lengthFilter,
        exclude: excludeKeyword,
    };

    const setFilters = {
        setTitle: setTitleFilter,
        setArtist: setArtistFilter,
        setAlbum: setAlbumFilter,
        setLength: setLengthFilter,
        setExclude: setExcludeKeyword,
    };

    return {
        tracks,
        setTracks,
        progress,
        error,
        setError,
        selectFolder,
        filteredTracks,
        filters,
        setFilters,
        selectFolderButtonRef
    };
}
