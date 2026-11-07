import test from "node:test";
import assert from "node:assert/strict";
import { buildLoopSlides, resolveCarouselLayout } from "./carouselLoop.js";

const items = (count) => Array.from({ length: count }, (_, index) => ({ _id: String(index) }));

test("empty, single and fully visible lists remain static without duplicate cards", () => {
  for (const count of [0, 1, 2, 4]) {
    const result = buildLoopSlides(items(count), { slidesPerView: 4 });
    assert.equal(result.loop, false);
    assert.equal(result.slides.length, count);
  }
});

test("fractional rails meet Swiper's loop minimum using complete logical cycles", () => {
  for (const [layout, minimumSlides] of [
    [{ slidesPerView: 1.6 }, 3],
    [{ slidesPerView: 1.6, slidesOffsetBefore: 16, slidesOffsetAfter: 16 }, 5],
    [{ slidesPerView: 2.5 }, 4],
    [{ slidesPerView: 100 / 30, slidesOffsetBefore: 16, slidesOffsetAfter: 16 }, 8],
    [{ slidesPerView: 4 }, 5],
  ]) {
    for (let count = 2; count <= 12; count += 1) {
      const { loop, slides } = buildLoopSlides(items(count), layout);
      assert.equal(loop, count > layout.slidesPerView);
      if (!loop) continue;
      assert.ok(slides.length >= minimumSlides);
      assert.ok(slides.length < minimumSlides + count);
      assert.equal(slides.length % count, 0);
      assert.equal(new Set(slides.map((slide) => slide.key)).size, slides.length);
      for (let index = 0; index < slides.length * 2; index += 1) {
        assert.equal(slides[index % slides.length].sourceIndex, index % count);
        assert.equal(slides[(slides.length - 1 - index % slides.length)].sourceIndex, count - 1 - index % count);
      }
    }
  }
});

test("responsive boundaries change loop eligibility and remove mobile offsets", () => {
  const base = { slidesPerView: 1.6, spaceBetween: 12, slidesOffsetBefore: 16, slidesOffsetAfter: 16 };
  const breakpoints = {
    1024: { slidesPerView: 4, spaceBetween: 24 },
    640: { slidesPerView: 2.5, spaceBetween: 16, slidesOffsetBefore: 0, slidesOffsetAfter: 0 },
  };
  assert.equal(buildLoopSlides(items(3), resolveCarouselLayout(base, breakpoints, 639)).loop, true);
  assert.equal(buildLoopSlides(items(3), resolveCarouselLayout(base, breakpoints, 640)).loop, true);
  assert.equal(buildLoopSlides(items(3), resolveCarouselLayout(base, breakpoints, 1024)).loop, false);
  assert.deepEqual(resolveCarouselLayout(base, breakpoints, 1280), {
    slidesPerView: 4, spaceBetween: 24, slidesOffsetBefore: 0, slidesOffsetAfter: 0,
  });
});
