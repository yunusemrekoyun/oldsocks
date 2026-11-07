import { useMemo, useRef, useState } from "react";
import LoopCarousel from "../common/LoopCarousel";
import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import useHomeProducts from "../../hooks/useHomeProducts";
import { useStorefrontSettings } from "../../context/storefrontSettings";
import { pickHomeProducts } from "../../utils/homeProductSelection";
import { buildVariantColorMap, getVariantColors } from "../../utils/productVariants";
import NewProductItem from "./NewProductItem";
import ProductGridItem from "./ProductGridItem";

export default function HomeProductSection({ sectionKey }) {
  const { data, loading } = useHomeProducts();
  const settings = useStorefrontSettings();
  const section = settings.sections?.[sectionKey];
  const [randomValues] = useState(() => Array.from({ length: 256 }, () => Math.random()));
  const random = useMemo(() => {
    let index = 0;
    return () => randomValues[index++ % randomValues.length];
  }, [randomValues]);
  const products = useMemo(
    () => pickHomeProducts(data?.sections?.[sectionKey], section, random),
    [data, sectionKey, section, random]
  );
  const variantColorMap = useMemo(() => buildVariantColorMap(data?.variants || []), [data]);
  const swiperRef = useRef(null);

  if (loading) {
    return <section className="bg-light1 py-12 text-center">Ürünler yükleniyor…</section>;
  }
  if (!products.length) return null;
  const Card = sectionKey === "new" ? NewProductItem : ProductGridItem;
  const arrow = "absolute top-[38%] z-10 hidden h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white text-dark1 shadow-lg ring-1 ring-black/5 transition hover:bg-dark1 hover:text-white disabled:pointer-events-none disabled:opacity-0 lg:flex";

  // Yana kaydırılan şerit: telefonda 1,6 kart görünür (yarım kart kaydırılabildiğini belli eder),
  // masaüstünde 4 kart ve oklar.
  return <section className="bg-light1 py-8 sm:py-12">
    <div className="container mx-auto px-4">
      <h2 className="mb-5 text-center text-2xl uppercase text-black sm:mb-8 sm:text-3xl md:text-4xl">{section.heading}</h2>
      {/* Telefonda şerit ekran kenarına kadar uzanır; ilk kart sayfa hizasında başlar. */}
      <div className="relative -mx-4 sm:mx-0">
        {products.length > 4 && <>
          <button type="button" aria-label="Önceki ürünler" onClick={() => swiperRef.current?.slidePrev()} className={`${arrow} -left-5`}><FaChevronLeft /></button>
          <button type="button" aria-label="Sonraki ürünler" onClick={() => swiperRef.current?.slideNext()} className={`${arrow} -right-5`}><FaChevronRight /></button>
        </>}
        <LoopCarousel
          items={products}
          carouselId={`home-${sectionKey}`}
          label={section.heading}
          className="home-rail"
          slidesPerView={1.6}
          spaceBetween={12}
          slidesOffsetBefore={16}
          slidesOffsetAfter={16}
          breakpoints={{
            640: { slidesPerView: 2.5, spaceBetween: 16, slidesOffsetBefore: 0, slidesOffsetAfter: 0 },
            1024: { slidesPerView: 4, spaceBetween: 24, slidesOffsetBefore: 0, slidesOffsetAfter: 0 },
          }}
          onSwiper={(swiper) => { swiperRef.current = swiper; }}
          renderItem={(product) => {
            const final = Number(product.price || 0);
            const original = Number(product.originalPrice || 0);
            const hasDiscount = original > final && final > 0;
            return <Card
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
          }}
        />
      </div>
    </div>
  </section>;
}
