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
    <div className="space-y-4">
      {sections.map(({ label, key, options }) => (
        <div key={key}>
          <div
            className="flex justify-between items-center bg-light2 rounded-xl px-4 py-3 cursor-pointer hover:bg-dark2/5 transition"
            onClick={() => setOpen((o) => ({ ...o, [key]: !o[key] }))}
          >
            <span className="text-dark1 font-medium">{label}</span>
            <FaChevronDown
              className={`text-dark2 transform ${
                open[key] ? "rotate-180" : ""
              } transition`}
            />
          </div>
          {open[key] && (
            <div className="mt-2 grid grid-cols-2 gap-2 px-2">
              {options.length === 0 ? (
                <div className="col-span-2 text-sm text-dark2">Seçenek yok</div>
              ) : (
                options.map(({ value, label }) => {
                  const checked = filters[key].includes(value);
                  return (
                    <div
                      key={value}
                      className="flex items-center space-x-2 cursor-pointer"
                      onClick={() => toggleFilter(key, value)}
                    >
                      <div
                        className={`w-4 h-4 border rounded ${
                          checked ? "bg-dark1 border-dark1" : "border-gray-300"
                        } flex items-center justify-center`}
                      >
                        {checked && <FaCheck className="text-white w-3 h-3" />}
                      </div>
                      <span className="text-sm text-dark1">{label}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      ))}

      {/* Price Range */}
      <div>
        <div
          className="flex justify-between items-center bg-light2 rounded-xl px-4 py-3 cursor-pointer hover:bg-dark2/5 transition"
          onClick={() => setOpen((o) => ({ ...o, priceRange: !o.priceRange }))}
        >
          <span className="text-dark1 font-medium">Price range</span>
          <FaChevronDown
            className={`text-dark2 transform ${
              open.priceRange ? "rotate-180" : ""
            } transition`}
          />
        </div>
        {open.priceRange && (
          <div className="mt-2 px-4 space-y-2">
            <div className="flex items-center space-x-2">
              <input
                type="number"
                placeholder={minPrice}
                value={priceInput.min}
                onChange={(e) =>
                  setPriceInput((p) => ({ ...p, min: e.target.value }))
                }
                className="w-1/2 border px-2 py-1 rounded"
              />
              <input
                type="number"
                placeholder={maxPrice}
                value={priceInput.max}
                onChange={(e) =>
                  setPriceInput((p) => ({ ...p, max: e.target.value }))
                }
                className="w-1/2 border px-2 py-1 rounded"
              />
            </div>
            <div className="flex justify-end">
              <button
                className="px-3 py-1 bg-dark1 text-white rounded"
                onClick={() => {
                  const low = Number(priceInput.min) || minPrice;
                  const high = Number(priceInput.max) || maxPrice;
                  onFilterChange({ ...filters, priceRange: [low, high] });
                }}
              >
                Apply
              </button>
            </div>
            <div className="text-xs text-dark2">
              (min: {minPrice}, max: {maxPrice})
            </div>
          </div>
        )}
      </div>

      {/* Kampanya Baloncuğu */}
      {campaignTitle && (
        <div className="mt-6 flex items-center space-x-2">
          <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
            {campaignTitle}
          </span>
          <button
            onClick={onClearCampaign}
            className="text-red-500 text-lg leading-none"
            title="Kampanyayı temizle"
          >
            ×
          </button>
        </div>
      )}
    </div>
  );
}
