import { useMemo } from "react";
import { Link } from "react-router-dom";
import { FaRegHeart } from "react-icons/fa";
import Products from "../components/products/Products";
import useFavorites from "../hooks/useFavorites";
import useProductsCache from "../hooks/useProductsCache";
import usePageMeta from "../hooks/usePageMeta";
import { buildVariantColorMap } from "../utils/productVariants";

export default function FavoritesPage() {
  const { ids, removeFavorites } = useFavorites();
  const { data, loading, error, retry } = useProductsCache();
  const catalog = useMemo(() => Array.isArray(data) ? data : [], [data]);
  const byId = useMemo(() => new Map(catalog.map((product) => [String(product._id), product])), [catalog]);
  const products = useMemo(() => ids.map((id) => byId.get(id)).filter(Boolean), [ids, byId]);
  const missing = useMemo(() => ids.filter((id) => !byId.has(id)), [ids, byId]);
  const variantColorMap = useMemo(() => buildVariantColorMap(catalog), [catalog]);

  usePageMeta({
    title: "Favorilerim",
    description: "OLDSOCKS favori ürünleriniz.",
    canonicalPath: "/favorites",
    noindex: true,
  });

  const shopLink = (
    <Link to="/shop" className="inline-flex min-h-11 items-center justify-center rounded-full bg-dark1 px-6 py-3 text-sm font-medium text-white transition hover:bg-black focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark1">
      Mağazayı Keşfet
    </Link>
  );

  return (
    <section className="mx-auto min-h-[60vh] max-w-7xl px-4 py-8 text-dark1 sm:px-6 sm:py-14 lg:px-8">
      <div className="border-b border-light2 pb-6">
        <h1 className="font-playfair text-3xl font-bold sm:text-4xl">Favorilerim</h1>
        <p className="mt-3 max-w-xl text-sm leading-relaxed text-dark2">
          Beğendiğiniz ürünleri burada bir arada tutun. Favorileriniz bu tarayıcıda saklanır; giriş yapmanız gerekmez.
        </p>
        <p className="mt-2 text-xs text-dark2/70">Tarayıcı verilerini temizlediğinizde listeniz de silinir.</p>
      </div>

      {ids.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-center">
          <FaRegHeart className="mb-5 h-9 w-9 text-dark2/40" aria-hidden="true" />
          <h2 className="text-xl font-semibold">Henüz favoriniz yok</h2>
          <p className="mb-6 mt-2 max-w-sm text-sm leading-relaxed text-dark2">Ürün kartlarındaki kalbe dokunarak beğendiklerinizi kaydedin.</p>
          {shopLink}
        </div>
      ) : loading ? (
        <div className="py-16 text-center text-sm" role="status">Favori ürünleriniz yükleniyor…</div>
      ) : error ? (
        <div className="py-16 text-center" role="alert">
          <h2 className="text-lg font-semibold">Ürünler şu an yüklenemedi</h2>
          <p className="mt-2 text-sm text-dark2">Favorileriniz kayıtlı. Bağlantınızı kontrol edip tekrar deneyin.</p>
          <button type="button" onClick={retry} className="mt-6 min-h-11 rounded-full border border-dark1 px-6 text-sm font-medium transition hover:bg-dark1 hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dark1">Tekrar Dene</button>
        </div>
      ) : (
        <>
          {missing.length > 0 && (
            <div className="mt-6 flex flex-col gap-3 rounded-xl border border-light2 bg-light1/60 p-4 text-sm sm:flex-row sm:items-center sm:justify-between" role="status">
              <p>{missing.length} favori ürününüz artık mağazada bulunmuyor.</p>
              <button type="button" onClick={() => removeFavorites(missing)} className="min-h-11 shrink-0 rounded-lg px-3 font-medium underline underline-offset-4 hover:bg-light2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-dark1">Bu ürünleri listeden kaldır</button>
            </div>
          )}
          {products.length > 0 ? (
            <>
              <p className="mt-6 text-sm text-dark2" aria-live="polite">{products.length} favori ürün</p>
              <Products products={products} variantColorMap={variantColorMap} />
            </>
          ) : (
            <div className="py-14 text-center">
              <p className="mb-6 text-sm text-dark2">Yeni favoriler bulmak için mağazaya göz atın.</p>
              {shopLink}
            </div>
          )}
        </>
      )}
    </section>
  );
}
