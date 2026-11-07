import { FaHeart, FaRegHeart } from "react-icons/fa";
import useFavorites from "../../hooks/useFavorites";

export default function FavoriteButton({ productId, productName, className = "" }) {
  const { hasFavorite, toggleFavorite } = useFavorites();
  const saved = hasFavorite(productId);
  const label = `${saved ? "Favorilerden çıkar" : "Favorilere ekle"}: ${productName}`;

  return (
    <button
      type="button"
      aria-label={label}
      aria-pressed={saved}
      title={label}
      onPointerDown={(event) => event.stopPropagation()}
      onClick={(event) => {
        event.preventDefault();
        event.stopPropagation();
        toggleFavorite(productId);
      }}
      className={`flex h-11 w-11 items-center justify-center rounded-full border border-white/30 shadow-sm backdrop-blur-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark1 ${
        saved ? "bg-white/95 text-dark1 hover:bg-white" : "bg-dark1/60 text-white hover:bg-dark1/80"
      } ${className}`}
    >
      {saved ? <FaHeart className="h-4 w-4" aria-hidden="true" /> : <FaRegHeart className="h-4 w-4" aria-hidden="true" />}
    </button>
  );
}
