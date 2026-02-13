import { useState } from "react";
import "./App.css";

// Components
import Header from "./components/Header";
import TrackList from "./components/TrackList/TrackList";
import Player from "./components/Player/Player";
import ProgressOverlay from "./components/Overlays/ProgressOverlay";
import ErrorOverlay from "./components/Overlays/ErrorOverlay";

// Hooks
import { useFavourites } from "./hooks/useFavourites";
import { useTracks } from "./hooks/useTracks";
import { useAudioPlayer } from "./hooks/useAudioPlayer";

function App() {
  const [showFavourites, setShowFavourites] = useState(false);
  const { favourites, toggleFavourite } = useFavourites();

  const {
    tracks,
    progress,
    error,
    setError,
    selectFolder,
    filteredTracks,
    filters,
    setFilters,
    selectFolderButtonRef
  } = useTracks(favourites, showFavourites);

  const {
    audioRef,
    currentTrackIndex,
    pitch,
    setPitch,
    loop,
    setLoop,
    playTrack
  } = useAudioPlayer(filteredTracks);

  const openDirectoryAtPath = (path) => {
    window.api.openFolder(path);
  };

  return (
    <>
      <ProgressOverlay progress={progress} />
      <ErrorOverlay error={error} onClose={() => setError(null)} />

      <Header
        selectFolder={selectFolder}
        selectFolderButtonRef={selectFolderButtonRef}
        showFavourites={showFavourites}
        setShowFavourites={setShowFavourites}
        tracks={tracks}
        excludeKeyword={filters.exclude}
        setExcludeKeyword={setFilters.setExclude}
        currentTrackIndex={currentTrackIndex}
        filteredTracksLength={filteredTracks.length}
        favouritesCount={favourites.length}
      />

      {(tracks?.length > 0 || showFavourites) && (
        <>
          <TrackList
            filteredTracks={filteredTracks}
            currentTrackIndex={currentTrackIndex}
            playTrack={playTrack}
            favourites={favourites}
            toggleFavourite={toggleFavourite}
            openDirectoryAtPath={openDirectoryAtPath}
            filters={filters}
            setFilters={setFilters}
          />

          <Player
            audioRef={audioRef}
            pitch={pitch}
            setPitch={setPitch}
            loop={loop}
            setLoop={setLoop}
          />
        </>
      )}
    </>
  );
}

export default App;
