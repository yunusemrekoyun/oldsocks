// src/pages/admin/ProductListPage.jsx
import React, { useState, useEffect, useMemo, useRef } from "react";
import { FaTrashAlt, FaPen, FaPalette, FaPlus, FaSearch } from "react-icons/fa";
import api from "../../../api";
import ToastAlert from "../../components/ui/ToastAlert";
import ProductFormModal from "../modals/ProductFormModal";
import Window from "../../components/ui/Window";
import EditProductForm from "../forms/EditProductForm";
import AddNewColorForm from "../forms/AddNewColorForm";

/* ─── Skeleton ─── */
const CardSkeleton = () => (
  <div className="animate-pulse rounded-xl border border-gray-100 overflow-hidden">
    <div className="h-48 bg-gray-200" />
    <div className="p-4 space-y-2">
      <div className="h-4 bg-gray-200 rounded w-2/3" />
      <div className="h-3 bg-gray-200 rounded w-1/2" />
      <div className="h-8 bg-gray-200 rounded w-24 mt-3" />
    </div>
  </div>
);

const Badge = ({ children, color = "gray" }) => {
  const map = {
    green: "bg-green-100 text-green-800",
    red: "bg-red-100 text-red-800",
    blue: "bg-blue-100 text-blue-800",
    gray: "bg-gray-100 text-gray-700",
    amber: "bg-amber-100 text-amber-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs ${map[color]}`}
    >
      {children}
    </span>
  );
};

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);

  const [activeProduct, setActiveProduct] = useState(null); // edit / new-color / new
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [formMode, setFormMode] = useState("new"); // new | edit | new-color

  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);

  // üst bar ui
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [catFilter, setCatFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // newest | priceAsc | priceDesc | stockAsc | stockDesc
  const searchRef = useRef(null);

  /* ---------------- Fetch ---------------- */
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const [{ data: prods }, { data: cats }] = await Promise.all([
        api.get("/products"),
        api.get("/categories"),
      ]);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error("Ürünler alınamadı", err);
      setToast({ msg: "Ürünler alınamadı.", type: "error" });
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    fetchProducts();
  }, []);

  // debounce
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(q.trim().toLowerCase()), 250);
    return () => clearTimeout(t);
  }, [q]);

  /* ---------------- CRUD Handlers ---------------- */
  const handleDelete = async () => {
    const backup = products;
    setProducts((prev) => prev.filter((p) => p._id !== deleteId));
    try {
      await api.delete(`/products/${deleteId}`);
      setToast({ msg: "Ürün silindi.", type: "success" });
    } catch {
      setProducts(backup);
      setToast({ msg: "Ürün silinemedi.", type: "error" });
    } finally {
      setDeleteId(null);
    }
  };

  const openNewForm = () => {
    setFormMode("new");
    setActiveProduct(null);
    setIsFormOpen(true);
  };

  const openEditForm = (prod) => {
    setFormMode("edit");
    setActiveProduct(prod);
    setIsFormOpen(true);
  };

  const openNewColorForm = (baseProd) => {
    setFormMode("new-color");
    setActiveProduct({ ...baseProd });
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);
  const onSaved = () => {
    fetchProducts();
    closeForm();
  };

  /* ---------------- Derived list ---------------- */
  const filtered = useMemo(() => {
    let list = [...products];

    if (debouncedQ) {
      list = list.filter((p) =>
        `${p.name} ${p.category?.name || ""}`.toLowerCase().includes(debouncedQ)
      );
    }
    if (catFilter !== "all") {
      list = list.filter(
        (p) =>
          p.category?._id === catFilter || p.category?.parent?._id === catFilter
      );
    }

    list.sort((a, b) => {
      const stockA = (a.sizes || []).reduce((t, s) => t + (s.stock || 0), 0);
      const stockB = (b.sizes || []).reduce((t, s) => t + (s.stock || 0), 0);
      if (sortBy === "priceAsc") return (a.price || 0) - (b.price || 0);
      if (sortBy === "priceDesc") return (b.price || 0) - (a.price || 0);
      if (sortBy === "stockAsc") return stockA - stockB;
      if (sortBy === "stockDesc") return stockB - stockA;

      const A = a.createdAt || a._id;
      const B = b.createdAt || b._id;
      return A < B ? 1 : -1;
    });
    return list;
  }, [products, debouncedQ, catFilter, sortBy]);

  /* ---------------- Helpers ---------------- */
  const fmt = (n) => `₺${Number(n || 0).toLocaleString("tr-TR")}`;
  const imgOrPlaceholder = (src) =>
    src || "https://via.placeholder.com/640x480?text=Product";

  /* ---------------- Render ---------------- */
  return (
    <div className="p-4 sm:p-6 space-y-6 sm:space-y-8">
      {/* Üst bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-800">
            Ürünler
          </h1>
          <p className="text-sm text-gray-600">
            Arayın, filtreleyin, düzenleyin.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-[auto_auto_auto_auto] gap-3 items-center">
          {/* search */}
          <div className="relative">
            <input
              ref={searchRef}
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Ara (ad, kategori)…"
              className="w-full sm:w-64 pl-9 pr-3 py-2 border rounded-lg text-sm"
            />
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          </div>

          {/* kategori filtresi */}
          <select
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
            className="w-full sm:w-56 border rounded-lg p-2 text-sm"
          >
            <option value="all">Tüm Kategoriler</option>
            {categories
              .filter((c) => !c.parent)
              .map((c) => (
                <optgroup key={c._id} label={c.name}>
                  <option value={c._id}>{c.name} (Ana)</option>
                  {(c.children || []).map((ch) => (
                    <option key={ch._id} value={ch._id}>
                      └ {ch.name}
                    </option>
                  ))}
                </optgroup>
              ))}
          </select>

          {/* sıralama */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full sm:w-56 border rounded-lg p-2 text-sm"
          >
            <option value="newest">En Yeni</option>
            <option value="priceAsc">Fiyat (Artan)</option>
            <option value="priceDesc">Fiyat (Azalan)</option>
            <option value="stockDesc">Stok (Yüksek → Düşük)</option>
            <option value="stockAsc">Stok (Düşük → Yüksek)</option>
          </select>

          <button
            onClick={openNewForm}
            className="w-full sm:w-auto inline-flex justify-center items-center gap-2 px-4 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm shadow transition-all"
          >
            <FaPlus /> Yeni Ürün
          </button>
        </div>
      </div>

      {/* Yükleniyor / Liste */}
      {loading ? (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {Array.from({ length: 10 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed p-10 sm:p-12 text-center">
          <p className="text-lg font-medium mb-2">Kayıt bulunamadı</p>
          <p className="text-gray-600 mb-4">
            Filtreleri temizleyin veya yeni bir ürün ekleyin.
          </p>
          <button
            onClick={openNewForm}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Ürün Ekle
          </button>
        </div>
      ) : (
        <div className="grid gap-4 sm:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {filtered.map((p) => {
            const stock = (p.sizes || []).reduce(
              (t, s) => t + (s.stock || 0),
              0
            );

            // Yeni mantık: indirim görünümü discount > 0 ise
            const discountPct = Number(p.discount || 0);
            const hasDiscount = discountPct > 0;

            // Gösterimde indirimli fiyatı p.price'tan al (backend öyle saklıyor),
            // fallback: original * (1 - discount/100)
            const original = Number(p.originalPrice || 0);
            const discounted =
              p.price != null
                ? Number(p.price)
                : Math.max(0, Math.round(original * (1 - discountPct / 100)));

            return (
              <div
                key={p._id}
                className="relative bg-white rounded-xl border border-gray-100 hover:shadow-xl transition-shadow overflow-hidden group"
              >
                {/* Görsel */}
                <div className="relative h-48">
                  <img
                    src={imgOrPlaceholder(p.images?.[0])}
                    alt={p.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {/* üstten degrade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/15 to-transparent pointer-events-none" />

                  {/* hover overlay + hızlı düzenle */}
                  <button
                    onClick={() => openEditForm(p)}
                    className="absolute inset-0 hidden group-hover:flex items-center justify-center bg-white/55 backdrop-blur-sm transition rounded-none"
                    title="Düzenle"
                  >
                    <span className="inline-flex items-center gap-2 px-3 py-2 bg-white border rounded-lg shadow-sm">
                      <FaPen className="opacity-70" />
                      Düzenle
                    </span>
                  </button>

                  {/* rozetler */}
                  <div className="absolute top-2 left-2 flex gap-2">
                    {hasDiscount && (
                      <Badge color="amber">İndirim {discountPct}%</Badge>
                    )}
                    <Badge color={stock > 0 ? "green" : "red"}>
                      Stok: {stock}
                    </Badge>
                  </div>
                </div>

                {/* Bilgiler */}
                <div className="p-4">
                  <p className="text-gray-900 font-medium truncate">{p.name}</p>
                  <p className="text-gray-500 text-sm truncate">
                    {p.category?.name || "-"}
                  </p>

                  {/* Fiyat bölümü */}
                  <div className="mt-2 flex items-baseline gap-2">
                    {hasDiscount ? (
                      <>
                        <p className="text-xs line-through text-gray-400">
                          {fmt(original)}
                        </p>
                        <p className="text-blue-700 font-semibold">
                          {fmt(discounted)}
                        </p>
                      </>
                    ) : (
                      <p className="text-blue-700 font-semibold">
                        {fmt(original || p.price)}
                      </p>
                    )}
                    {p.color && (
                      <span className="ml-auto text-xs px-2 py-0.5 bg-gray-100 rounded">
                        {p.color}
                      </span>
                    )}
                  </div>

                  {/* Aksiyon Çubuğu */}
                  <div className="mt-4 flex items-center justify-end gap-2">
                    <div className="flex items-center gap-2">
                      {!p.parentProductId && (
                        <button
                          onClick={() => openNewColorForm(p)}
                          className="text-sm inline-flex items-center gap-2 px-3 py-1 rounded border hover:bg-gray-50"
                          title="Yeni Renk Ekle"
                        >
                          <FaPalette />
                        </button>
                      )}
                      <button
                        onClick={() => setDeleteId(p._id)}
                        className="text-sm inline-flex items-center gap-2 px-3 py-1 rounded border border-red-200 text-red-600 hover:bg-red-50"
                        title="Sil"
                      >
                        <FaTrashAlt />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Silme Onayı */}
      {deleteId && (
        <Window title="Onayla" onClose={() => setDeleteId(null)}>
          <div className="space-y-5 text-sm">
            <p>Bu ürünü silmek istediğinize emin misiniz?</p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeleteId(null)}
                className="px-4 py-2 border rounded hover:bg-gray-100"
              >
                Vazgeç
              </button>
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Sil
              </button>
            </div>
          </div>
        </Window>
      )}

      {/* Form Penceresi */}
      {isFormOpen && (
        <Window
          title={
            formMode === "new-color"
              ? "Yeni Renk Ekle"
              : formMode === "edit"
              ? "Ürünü Güncelle"
              : "Yeni Ürün"
          }
          onClose={closeForm}
        >
          {formMode === "new-color" ? (
            <AddNewColorForm
              product={activeProduct}
              onClose={closeForm}
              onSaved={onSaved}
            />
          ) : formMode === "edit" ? (
            <EditProductForm
              product={activeProduct}
              onClose={closeForm}
              onSaved={onSaved}
            />
          ) : (
            <ProductFormModal onClose={closeForm} onSaved={onSaved} />
          )}
        </Window>
      )}

      {/* Toast */}
      {toast && (
        <ToastAlert
          msg={toast.msg}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  );
}
