// ✅ Redesigned CategoryFilter Component — Mobile Dropdown Friendly
import React, { useState, useEffect } from "react";
import { FaChevronDown, FaXmark } from "react-icons/fa6";

export default function CategoryFilter({
  products,
  categories,
  filters,
  onFilterChange,
  campaignTitle,
  onClearCampaign,
}) {
  const [open, setOpen] = useState({
    category: false,
    subCategory: false,
    sizes: false,
    colors: false,
    priceRange: false,
  });
  const [expandedMobile, setExpandedMobile] = useState(false);
  const [priceInput, setPriceInput] = useState({ min: "", max: "" });

  const prices = products.map((p) => p.price);
  const minPrice = prices.length ? Math.min(...prices) : 0;
  const maxPrice = prices.length ? Math.max(...prices) : 0;

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
      label: "Kategori",
      key: "category",
      options: parentCats.map((c) => ({ value: c._id, label: c.name })),
    },
    { label: "Alt Kategori", key: "subCategory", options: subOptions },
    {
      label: "Beden",
      key: "sizes",
      options: sizes.map((s) => ({ value: s, label: s })),
    },
    {
      label: "Renk",
      key: "colors",
      options: colors.map((c) => ({ value: c, label: c })),
    },
  ];

  return (
    <aside
      className={`bg-white border border-light2 rounded-2xl shadow-md overflow-hidden transition-all duration-300 
        ${expandedMobile ? "max-h-[2000px]" : "max-h-[60px] md:max-h-none"}`}
    >
      <button
        onClick={() => setExpandedMobile((p) => !p)}
        className="md:hidden w-full px-6 py-4 flex items-center justify-between bg-dark1 text-white text-lg font-semibold uppercase tracking-wide"
      >
        Filtrele
        <FaChevronDown
          className={`transition-transform ${
            expandedMobile ? "rotate-180" : "rotate-0"
          }`}
        />
      </button>

      <div className="hidden md:block bg-dark1 text-white px-6 py-4 text-lg font-semibold uppercase tracking-wide">
        Filtrele
      </div>

      <div
        className={`divide-y divide-light2 ${
          expandedMobile ? "block" : "hidden md:block"
        }`}
      >
        {sections.map(({ label, key, options }) => (
          <div key={key}>
            <button
              onClick={() =>
                setOpen((prev) => ({ ...prev, [key]: !prev[key] }))
              }
              className="w-full flex items-center justify-between px-6 py-3 text-dark1 hover:bg-light1 transition font-medium"
            >
              <span>{label}</span>
              <FaChevronDown
                className={`transition-transform duration-200 ${
                  open[key] ? "rotate-180" : "rotate-0"
                }`}
              />
            </button>

            {open[key] && (
              <div className="px-6 py-2 grid grid-cols-2 gap-3">
                {options.length === 0 ? (
                  <p className="col-span-2 text-sm text-dark2 italic">
                    Seçenek yok
                  </p>
                ) : (
                  options.map(({ value, label }) => {
                    const checked = filters[key].includes(value);
                    return (
                      <button
                        key={value}
                        onClick={() => toggleFilter(key, value)}
                        className={`text-sm px-3 py-1 rounded-full border transition-all duration-200 ${
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

        <div>
          <button
            onClick={() =>
              setOpen((prev) => ({ ...prev, priceRange: !prev.priceRange }))
            }
            className="w-full flex items-center justify-between px-6 py-3 text-dark1 hover:bg-light1 transition font-medium"
          >
            <span>Fiyat Aralığı</span>
            <FaChevronDown
              className={`transition-transform duration-200 ${
                open.priceRange ? "rotate-180" : "rotate-0"
              }`}
            />
          </button>

          {open.priceRange && (
            <div className="px-6 pb-4 pt-2 space-y-3">
              <div className="flex gap-2">
                <input
                  type="number"
                  placeholder={minPrice}
                  value={priceInput.min}
                  onChange={(e) =>
                    setPriceInput((p) => ({ ...p, min: e.target.value }))
                  }
                  className="w-1/2 px-3 py-2 rounded border border-light2 bg-light1 text-dark1"
                />
                <input
                  type="number"
                  placeholder={maxPrice}
                  value={priceInput.max}
                  onChange={(e) =>
                    setPriceInput((p) => ({ ...p, max: e.target.value }))
                  }
                  className="w-1/2 px-3 py-2 rounded border border-light2 bg-light1 text-dark1"
                />
              </div>
              <button
                onClick={() => {
                  const low = Number(priceInput.min) || minPrice;
                  const high = Number(priceInput.max) || maxPrice;
                  onFilterChange({ ...filters, priceRange: [low, high] });
                }}
                className="w-full bg-dark1 hover:bg-dark2 text-white py-2 rounded-lg font-semibold"
              >
                Uygula
              </button>
              <p className="text-xs text-dark2">
                (min: {minPrice}, max: {maxPrice})
              </p>
            </div>
          )}
        </div>

        {campaignTitle && (
          <div className="flex items-center justify-between px-6 py-4 bg-light1 border-t border-light2">
            <span className="text-sm font-medium text-dark1 bg-white px-3 py-1 rounded-full">
              {campaignTitle}
            </span>
            <button
              onClick={onClearCampaign}
              className="text-red-500 hover:animate-shake"
              title="Kampanyayı temizle"
            >
              <FaXmark className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
