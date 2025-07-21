// src/components/categories/CategoryFilter.jsx
import React, { useState, useEffect } from "react";
import { FaChevronDown, FaCheck } from "react-icons/fa";

export default function CategoryFilter({
  products,
  categories,
  filters,
  onFilterChange,
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

  // Parent seçilince subCategory panelini aç
  useEffect(() => {
    if (filters.category.length) {
      setOpen((o) => ({ ...o, subCategory: true }));
    }
  }, [filters.category]);

  const toggleFilter = (key, val) => {
    const prev = filters[key];
    let next;
    if (Array.isArray(prev)) {
      next = prev.includes(val)
        ? prev.filter((x) => x !== val)
        : [...prev, val];
    } else {
      next = val;
    }
    onFilterChange({ ...filters, [key]: next });
  };

  // Parent kategoriler
  const parentCats = categories.filter((c) => !c.parent);

  // Alt kategorileri çıkar ve tekilleştir
  const allSub = parentCats.flatMap((parent) =>
    (parent.children || []).map((child) => ({
      value: child._id,
      label: child.name,
      parent: parent._id,
    }))
  );
  const subCats = Array.from(
    new Map(allSub.map((item) => [item.value, item])).values()
  );

  // Seçili parent’a göre alt gruplar
  const subOptions =
    filters.category.length > 0
      ? subCats.filter((item) => filters.category.includes(item.parent))
      : [];

  // Diğer dinamik seçenekler
  const sizes = Array.from(new Set(products.flatMap((p) => p.sizes))).sort();
  const colors = Array.from(new Set(products.map((p) => p.color))).filter(
    Boolean
  );

  // Bölümler
  const sections = [
    {
      label: "Category",
      key: "category",
      options: parentCats.map((c) => ({ value: c._id, label: c.name })),
    },
    {
      label: "Subcategory",
      key: "subCategory",
      options: subOptions,
    },
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

  // Clear Filters kontrolü
  const anyActive =
    filters.category.length > 0 ||
    filters.subCategory.length > 0 ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.priceRange[0] > minPrice ||
    filters.priceRange[1] < maxPrice;
  const defaultFilters = {
    category: [],
    subCategory: [],
    sizes: [],
    colors: [],
    priceRange: [minPrice, maxPrice],
  };

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
              {key === "subCategory" && !filters.category.length ? (
                <div className="col-span-2 text-sm text-dark2">
                  Önce parent seçin
                </div>
              ) : options.length === 0 ? (
                <div className="col-span-2 text-sm text-dark2">Seçenek yok</div>
              ) : (
                options.map(({ value, label: L }) => {
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
                      <span className="text-sm text-dark1">{L}</span>
                    </div>
                  );
                })
              )}
            </div>
          )}
        </div>
      ))}

      {/* Price range */}
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
                value={priceInput.min}
                placeholder={minPrice}
                className="w-1/2 border px-2 py-1 rounded"
                onChange={(e) =>
                  setPriceInput((p) => ({ ...p, min: e.target.value }))
                }
              />
              <input
                type="number"
                value={priceInput.max}
                placeholder={maxPrice}
                className="w-1/2 border px-2 py-1 rounded"
                onChange={(e) =>
                  setPriceInput((p) => ({ ...p, max: e.target.value }))
                }
              />
            </div>
            <div className="flex justify-end">
              <button
                type="button"
                className="px-3 py-1 bg-dark1 text-white rounded"
                onClick={() => {
                  const low = Number(priceInput.min) || minPrice;
                  const high = Number(priceInput.max) || maxPrice;
                  onFilterChange({
                    ...filters,
                    priceRange: [low, high],
                  });
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

      {/* Clear filters */}
      {anyActive && (
        <div className="text-center mt-4">
          <button
            type="button"
            className="text-red-600 underline text-sm"
            onClick={() => onFilterChange(defaultFilters)}
          >
            Clear filters
          </button>
        </div>
      )}
    </div>
  );
}
