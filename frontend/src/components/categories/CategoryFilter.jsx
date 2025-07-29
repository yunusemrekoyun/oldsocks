import React, { useState, useEffect } from "react";
import { FaChevronDown, FaCheck } from "react-icons/fa";

export default function CategoryFilter({
  products,
  categories,
  filters,
  onFilterChange,
  campaignTitle,
  onClearCampaign,
}) {
  const [open, setOpen] = useState({
    category: true,
    subCategory: false,
    sizes: false,
    colors: false,
    priceRange: false,
  });
  const [priceInput, setPriceInput] = useState({ min: "", max: "" });

  // Dinamik fiyat aralığı
  const prices = products.map((p) => p.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

  // filters.priceRange ile eşitle
  useEffect(() => {
    const [low, high] = filters.priceRange;
    setPriceInput({
      min: low === minPrice ? "" : low,
      max: high === maxPrice ? "" : high,
    });
  }, [filters.priceRange, minPrice, maxPrice]);

  const toggleFilter = (key, val) => {
    const prev = filters[key];
    const next = prev.includes(val)
      ? prev.filter((x) => x !== val)
      : [...prev, val];
    onFilterChange({ ...filters, [key]: next });
  };

  // Parent & subcategory hiyerarşisi
  const parentCats = categories.filter((c) => !c.parent);
  const allSub = parentCats.flatMap((p) =>
    (p.children || []).map((ch) => ({
      value: ch._id,
      label: ch.name,
      parent: p._id,
    }))
  );
  const subCats = Array.from(new Map(allSub.map((i) => [i.value, i])).values());
  const subOptions = filters.category.length
    ? subCats.filter((s) => filters.category.includes(s.parent))
    : [];

  const sizes = Array.from(new Set(products.flatMap((p) => p.sizes))).sort();
  const colors = Array.from(new Set(products.map((p) => p.color))).filter(
    Boolean
  );

  const sections = [
    {
      label: "Category",
      key: "category",
      options: parentCats.map((c) => ({ value: c._id, label: c.name })),
    },
    { label: "Subcategory", key: "subCategory", options: subOptions },
    {
      label: "Size",
      key: "sizes",
      options: sizes.map((s) => ({ value: s, label: s })),
    },
    {
      label: "Color",
      key: "colors",
      options: colors.map((c) => ({ value: c, label: c })),
    },
  ];

  return (
  <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-light2">
    <div className="bg-gradient-to-r from-dark1 to-dark2 px-6 py-4 text-white font-bold text-lg tracking-wide uppercase">
      Filtrele
    </div>

    <div className="divide-y divide-light2">
      {sections.map(({ label, key, options }) => (
        <div key={key}>
          <button
            onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
            className="w-full flex justify-between items-center px-6 py-4 text-dark1 font-semibold hover:bg-light1 transition"
          >
            <span className="flex items-center gap-2">
              <FaChevronDown
                className={`transform transition-transform ${
                  open[key] ? "rotate-180" : "rotate-0"
                }`}
              />
              {label}
            </span>
            <span className="text-xs text-dark2">
              {filters[key]?.length || 0} seçildi
            </span>
          </button>

          {open[key] && (
            <div className="px-6 pb-4 pt-2 grid grid-cols-2 gap-3">
              {options.length === 0 ? (
                <span className="col-span-2 text-sm text-dark2 italic">
                  Seçenek yok
                </span>
              ) : (
                options.map(({ value, label }) => {
                  const checked = filters[key].includes(value);
                  return (
                    <button
                      key={value}
                      onClick={() => toggleFilter(key, value)}
                      className={`text-sm px-3 py-1 rounded-full border transition ${
                        checked
                          ? "bg-dark1 text-white border-dark1"
                          : "border-light2 text-dark2 hover:bg-light2"
                      }`}
                    >
                      {label}
                    </button>
                  );
                })
              )}
            </div>
          )}
        </div>
      ))}

      {/* Price Range */}
      <div>
        <button
          onClick={() =>
            setOpen((o) => ({ ...o, priceRange: !o.priceRange }))
          }
          className="w-full flex justify-between items-center px-6 py-4 text-dark1 font-semibold hover:bg-light1 transition"
        >
          <span className="flex items-center gap-2">
            <FaChevronDown
              className={`transform transition-transform ${
                open.priceRange ? "rotate-180" : "rotate-0"
              }`}
            />
            Fiyat Aralığı
          </span>
        </button>

        {open.priceRange && (
          <div className="px-6 pb-4 pt-2 space-y-2">
            <div className="flex gap-2">
              <input
                type="number"
                placeholder={minPrice}
                value={priceInput.min}
                onChange={(e) =>
                  setPriceInput((p) => ({ ...p, min: e.target.value }))
                }
                className="w-1/2 px-3 py-1 rounded border border-light2 bg-light1 text-dark1"
              />
              <input
                type="number"
                placeholder={maxPrice}
                value={priceInput.max}
                onChange={(e) =>
                  setPriceInput((p) => ({ ...p, max: e.target.value }))
                }
                className="w-1/2 px-3 py-1 rounded border border-light2 bg-light1 text-dark1"
              />
            </div>
            <button
              onClick={() => {
                const low = Number(priceInput.min) || minPrice;
                const high = Number(priceInput.max) || maxPrice;
                onFilterChange({ ...filters, priceRange: [low, high] });
              }}
              className="w-full bg-dark1 hover:bg-dark2 text-white py-2 rounded font-semibold transition"
            >
              Uygula
            </button>
            <p className="text-xs text-dark2">
              (min: {minPrice}, max: {maxPrice})
            </p>
          </div>
        )}
      </div>

      {/* Kampanya Etiketi */}
      {campaignTitle && (
        <div className="px-6 py-4 flex items-center justify-between bg-light1">
          <span className="bg-white text-dark1 px-3 py-1 rounded-full text-sm font-medium">
            {campaignTitle}
          </span>
          <button
            onClick={onClearCampaign}
            className="text-red-500 text-xl leading-none"
            title="Kampanyayı temizle"
          >
            ×
          </button>
        </div>
      )}
    </div>
  </div>
);
}
