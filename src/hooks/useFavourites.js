import { useState, useEffect } from "react";

export function useFavourites() {
    const [favourites, setFavourites] = useState(() => {
        try {
            const saved = localStorage.getItem("favourites");
            return saved ? JSON.parse(saved) : [];
        } catch (e) {
            console.error("Failed to load favourites", e);
            return [];
        }
    });

    useEffect(() => {
        localStorage.setItem("favourites", JSON.stringify(favourites));
    }, [favourites]);

    const toggleFavourite = (track) => {
        setFavourites((prev) => {
            const exists = prev.find((t) => t.path === track.path);
            if (exists) {
                return prev.filter((t) => t.path !== track.path);
            } else {
                return [...prev, track];
            }
        });
    };

    return { favourites, toggleFavourite };
}
