export function resolveCarouselLayout(base, breakpoints, width) {
  return Object.entries(breakpoints || {})
    .filter(([minWidth]) => width >= Number(minWidth))
    .sort(([a], [b]) => Number(a) - Number(b))
    .reduce((layout, [, overrides]) => ({ ...layout, ...overrides }), { ...base });
}

// Swiper 14 needs extra slides to move behind the viewport before the next step.
// Offsets use its centered/bidirectional loop path, with a larger minimum pool.
// Repeat whole cycles so the logical order still joins last -> first in both directions.
export function buildLoopSlides(items, layout) {
  const list = Array.isArray(items) ? items : [];
  const perView = Math.max(1, Number(layout.slidesPerView) || 1);
  const loop = list.length > 1 && list.length > perView;
  let cycles = 1;

  if (loop) {
    const bothDirections = Boolean(layout.slidesOffsetBefore || layout.slidesOffsetAfter);
    let visible = Math.ceil(perView);
    if (bothDirections && visible % 2 === 0) visible += 1;
    const buffer = bothDirections ? Math.ceil(visible / 2) : 1;
    cycles = Math.ceil((visible + buffer) / list.length);
  }

  return {
    loop,
    slides: Array.from({ length: cycles }, (_, cycle) => list.map((item, sourceIndex) => ({
      item,
      sourceIndex,
      key: `${item._id || item.id || sourceIndex}-${cycle}`,
    }))).flat(),
  };
}
