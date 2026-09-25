import { useMemo, useState } from "react";
import useProductsCache from "../../hooks/useProductsCache";
import { useStorefrontSettings } from "../../context/storefrontSettings";
import { selectHomeProducts } from "../../utils/homeProductSelection";
import { buildVariantColorMap, getVariantColors } from "../../utils/productVariants";
import NewProductItem from "./NewProductItem";
import ProductGridItem from "./ProductGridItem";

export default function HomeProductSection({ sectionKey }) {
  const { data: allProducts, loading } = useProductsCache();
  const settings = useStorefrontSettings();
  const section = settings.sections?.[sectionKey];
  const [randomValues] = useState(() => Array.from({ length: 256 }, () => Math.random()));
  const random = useMemo(() => {
    let index = 0;
    return () => randomValues[index++ % randomValues.length];
  }, [randomValues]);
  const products = useMemo(
    () => selectHomeProducts(allProducts, section, settings.bestSellingProductIds, random),
    [allProducts, section, settings.bestSellingProductIds, random]
  );
  const variantColorMap = useMemo(() => buildVariantColorMap(allProducts || []), [allProducts]);

  if (loading || !allProducts) {
    return <section className="bg-light1 py-12 text-center">Ürünler yükleniyor…</section>;
  }
  if (!products.length) return null;
  const Card = sectionKey === "new" ? NewProductItem : ProductGridItem;
  const widths = ["0", "calc(25% - 1.125rem)", "calc(50% - 0.75rem)", "calc(75% - 0.375rem)", "100%"];
  const count = Math.min(products.length, 4);

  return <section className="bg-light1 py-12">
    <div className="container mx-auto px-4">
      <h2 className="mb-8 text-center text-3xl uppercase text-black md:text-4xl">{section.heading}</h2>
      <div className="home-product-grid" style={{ "--home-count": count, "--home-desktop-width": widths[count] }}>
        {products.map((product) => {
          const final = Number(product.price || 0);
          const original = Number(product.originalPrice || 0);
          const hasDiscount = original > final && final > 0;
          return <Card
            key={product._id}
            id={product._id}
            video={product.video}
            poster={product.media?.images?.[0] || product.poster || product.images?.[0] || null}
            name={product.name}
            price={hasDiscount ? original : final}
            discountedPrice={hasDiscount ? final : null}
            discountRate={hasDiscount ? Math.round(100 - final / original * 100) : 0}
            stock={Array.isArray(product.sizes) ? product.sizes.reduce((sum, row) => sum + Number(row.stock || 0), 0) : 0}
            variantColors={getVariantColors(product, variantColorMap)}
          />;
        })}
      </div>
    </div>
  </section>;
}
