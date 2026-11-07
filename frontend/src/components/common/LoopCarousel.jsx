import { useEffect, useRef, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { A11y } from "swiper/modules";
import { buildLoopSlides, resolveCarouselLayout } from "../../utils/carouselLoop";
import "swiper/css";
import "swiper/css/a11y";

export default function LoopCarousel({
  items,
  renderItem,
  label,
  carouselId,
  slidesPerView = 1,
  spaceBetween = 0,
  slidesOffsetBefore = 0,
  slidesOffsetAfter = 0,
  breakpoints,
  modules = [],
  autoplay = false,
  speed = 300,
  onSwiper,
  ...props
}) {
  const swiperRef = useRef(null);
  const [width, setWidth] = useState(() => window.innerWidth);
  const [reducedMotion, setReducedMotion] = useState(() => window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const resize = () => setWidth(window.innerWidth);
    const motion = () => setReducedMotion(media.matches);
    window.addEventListener("resize", resize);
    media.addEventListener("change", motion);
    return () => {
      window.removeEventListener("resize", resize);
      media.removeEventListener("change", motion);
    };
  }, []);

  const layout = resolveCarouselLayout({ slidesPerView, spaceBetween, slidesOffsetBefore, slidesOffsetAfter }, breakpoints, width);
  const { loop, slides } = buildLoopSlides(items, layout);

  return <Swiper
    {...props}
    {...layout}
    // loop cannot safely change through Swiper breakpoints. Recreate at a layout boundary.
    key={`${layout.slidesPerView}-${loop}-${slides.length}-${reducedMotion}`}
    modules={[A11y, ...modules]}
    loop={loop}
    autoplay={loop && !reducedMotion ? autoplay : false}
    speed={reducedMotion ? 0 : speed}
    watchSlidesProgress
    grabCursor={loop}
    allowTouchMove={loop}
    a11y={{ slideRole: null, slideLabelMessage: "", wrapperLiveRegion: false }}
    role="region"
    aria-label={label}
    aria-roledescription="kaydırılabilir liste"
    aria-description={loop ? "Diğer öğeler için sol ve sağ ok tuşlarını kullanın." : undefined}
    tabIndex={loop ? 0 : undefined}
    data-carousel={carouselId}
    onSwiper={(swiper) => {
      swiperRef.current = swiper;
      onSwiper?.(swiper);
    }}
    onKeyDown={(event) => {
      if (event.target !== event.currentTarget) return;
      if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
        event.preventDefault();
        swiperRef.current?.[event.key === "ArrowLeft" ? "slidePrev" : "slideNext"](0);
      }
    }}
    onFocusCapture={() => swiperRef.current?.autoplay?.stop()}
    onBlurCapture={(event) => {
      if (!event.currentTarget.contains(event.relatedTarget) && autoplay && loop && !reducedMotion) {
        swiperRef.current?.autoplay?.start();
      }
    }}
  >
    {slides.map(({ item, sourceIndex, key }) => <SwiperSlide
      key={key}
      className="!h-auto"
      data-carousel-item={item._id || item.id || sourceIndex}
      data-carousel-source-index={sourceIndex}
    >
      {({ isVisible }) => <div
        className="h-full"
        role="group"
        aria-label={`${sourceIndex + 1} / ${items.length}`}
        inert={isVisible ? undefined : ""}
        aria-hidden={isVisible ? undefined : true}
      >
        {renderItem(item, sourceIndex)}
      </div>}
    </SwiperSlide>)}
  </Swiper>;
}
