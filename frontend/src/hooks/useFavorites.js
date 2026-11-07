import { useCallback, useSyncExternalStore } from "react";
import {
  clearFavorites,
  getFavoriteIds,
  getServerFavoriteIds,
  removeFavorite,
  removeFavorites,
  subscribeFavorites,
  toggleFavorite,
} from "../utils/favorites";

export default function useFavorites() {
  const ids = useSyncExternalStore(subscribeFavorites, getFavoriteIds, getServerFavoriteIds);
  const hasFavorite = useCallback((id) => ids.includes(String(id)), [ids]);
  return { ids, hasFavorite, toggleFavorite, removeFavorite, removeFavorites, clearFavorites };
}
