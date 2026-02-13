import { useState, useEffect, useRef } from "react";

export function useAudioPlayer(filteredTracks) {
    const audioRef = useRef(null);
    const [currentTrackIndex, setCurrentTrackIndex] = useState(null);
    const [pitch, setPitch] = useState(0); // pitch in semitones
    const [loop, setLoop] = useState(false); // loop state

    // Keep the audio element's playbackRate in sync with the chosen pitch (semitones)
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.playbackRate = Math.pow(2, pitch / 12);
        }
    }, [pitch]);

    // Keep audio element's loop property in sync with state
    useEffect(() => {
        if (audioRef.current) {
            audioRef.current.loop = loop;
        }
    }, [loop]);

    const playTrack = (index) => {
        if (index >= 0 && index < filteredTracks.length) {
            if (audioRef.current) {
                audioRef.current.src = encodeURI(
                    `localfile://${filteredTracks[index].path}`
                );
                // apply current pitch (semitones) to playbackRate
                audioRef.current.playbackRate = Math.pow(2, pitch / 12);
                audioRef.current.play();
                setCurrentTrackIndex(index);
            }
        }
    };

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!filteredTracks || !filteredTracks.length) return;
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
                if (e.shiftKey) {
                    setPitch((p) => Math.min(p + 1, 12));
                } else if (audioRef.current) {
                    audioRef.current.currentTime += 10;
                }
            } else if (e.key === "ArrowLeft") {
                e.preventDefault();
                if (e.shiftKey) {
                    setPitch((p) => Math.max(p - 1, -12));
                } else if (audioRef.current) {
                    audioRef.current.currentTime -= 10;
                }
            } else if (e.key.toLowerCase() === "l") {
                setLoop((l) => !l);
            } else if (e.key === "1") {
                setPitch(0);
            } else if (e.key === "Enter") {
                e.preventDefault();
                if (audioRef.current.paused) {
                    audioRef.current.play();
                } else {
                    audioRef.current.pause();
                }
            }
        };
        window.addEventListener("keydown", handleKeyDown);
        return () => window.removeEventListener("keydown", handleKeyDown);
    }, [currentTrackIndex, filteredTracks, pitch, loop]); // Added pitch and loop to deps for correctness though logic uses refs mostly

    return {
        audioRef,
        currentTrackIndex,
        setCurrentTrackIndex,
        pitch,
        setPitch,
        loop,
        setLoop,
        playTrack
    };
}
