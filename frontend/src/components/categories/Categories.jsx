import { useNavigate } from "react-router-dom";
import { Autoplay } from "swiper/modules";
import CategoryItem from "./CategoryItem";
import LoopCarousel from "../common/LoopCarousel";
import useCategoriesCache from "../../hooks/useCategoriesCache";

export default function Categories() {
  const { data: cachedCategories, loading } = useCategoriesCache();
  const navigate = useNavigate();
  const categories = Array.isArray(cachedCategories)
    ? cachedCategories.filter((category) => category.parent === null)
      .sort((a, b) => a.name.localeCompare(b.name, "tr"))
    : [];

  if (loading) {
    return <section className="bg-light2 py-10 text-center">Kategoriler yükleniyor…</section>;
  }
  if (!categories.length) {
    return <section className="bg-light2 py-10 text-center">Kategori bulunamadı.</section>;
  }

  return <section className="bg-light2/60 backdrop-blur-sm py-6 sm:py-10">
    <div className="container mx-auto overflow-hidden px-4">
      <LoopCarousel
        items={categories}
        carouselId="categories"
        label="Kategoriler"
        modules={[Autoplay]}
        slidesPerView={2}
        breakpoints={{ 640: { slidesPerView: 4 } }}
        speed={500}
        autoplay={{ delay: 7000, disableOnInteraction: false, pauseOnMouseEnter: true }}
        renderItem={(category) => <div className="h-full select-none px-1 [&_img]:pointer-events-none [&_img]:select-none">
          <CategoryItem
            image={category.image}
            alt={category.name}
            onClick={() => navigate(`/shop?kategori=${encodeURIComponent(category._id)}`)}
          />
        </div>}
      />
    </div>
  </section>;
}
