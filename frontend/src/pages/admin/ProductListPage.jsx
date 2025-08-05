// src/pages/admin/ProductListPage.jsx
import React, { useState, useEffect } from "react";
import { FaEllipsisV } from "react-icons/fa";
import api from "../../../api";
import ToastAlert from "../../components/ui/ToastAlert";
import ProductFormModal from "./ProductFormModal";
import Window from "../../components/ui/Window";
import EditProductForm from "./EditProductForm";
import AddNewColorForm from "./AddNewColorForm";

export default function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [activeProduct, setActiveProduct] = useState(null); // edit / new-color / new
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [deleteId, setDeleteId] = useState(null);
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [openMenu, setOpenMenu] = useState(null); // hangi kart menüsü açık

  /* ----------------------------------------------------------- */
  /*  Veri Çekme                                                 */
  /* ----------------------------------------------------------- */
  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data } = await api.get("/products");
      setProducts(data);
    } catch (err) {
      console.error("Ürünler alınamadı", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  /* ----------------------------------------------------------- */
  /*  CRUD Handlers                                              */
  /* ----------------------------------------------------------- */
  const handleDelete = async () => {
    const backup = products;
    /* optimistic – ürünü anında listeden çıkar */
    setProducts((prev) => prev.filter((p) => p._id !== deleteId));

    try {
      await api.delete(`/products/${deleteId}`);
      setToast({ msg: "Ürün silindi.", type: "success" });
    } catch {
      /* hata → geri al */
      setProducts(backup);
      setToast({ msg: "Ürün silinemedi.", type: "error" });
    } finally {
      setDeleteId(null);
    }
  };

  /* ---------------- Yeni / Edit / Yeni Renk ------------------ */
  const openNewForm = () => {
    setActiveProduct(null);
    setIsFormOpen(true);
  };

  const openEditForm = async (prod) => {
    setLoading(true);
    try {
      const { data } = await api.get(`/products/${prod._id}`);
      setActiveProduct(data);
      setIsFormOpen(true);
    } catch (err) {
      console.error("Ürün alınamadı", err);
    } finally {
      setLoading(false);
    }
  };

  const openNewColorForm = (baseProd) => {
    /* sadece base ürüne yeni renk ekliyoruz */
    setActiveProduct({ ...baseProd, isNewColor: true });
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  const onSaved = () => {
    fetchProducts();
    closeForm();
  };

  /* ----------------------------------------------------------- */
  return (
    <div className="p-6 space-y-8">
      {/* Üst Başlık */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <h1 className="text-3xl font-semibold text-gray-800">Ürünler</h1>
        <button
          onClick={openNewForm}
          className="inline-block px-6 py-2 text-white bg-blue-600 hover:bg-blue-700 rounded-lg text-sm shadow transition-all"
        >
          + Yeni Ürün Ekle
        </button>
      </div>

      {/* Yükleniyor */}
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <p className="text-gray-500">Ürünler yükleniyor...</p>
        </div>
      ) : (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((p) => (
            <div
              key={p._id}
              className="relative bg-white rounded-xl shadow-md hover:shadow-lg transition-all overflow-hidden group"
            >
              {/* Görsel */}
              <img
                src={p.images?.[0]}
                alt={p.name}
                className="w-full h-52 object-cover"
              />

              {/* Bilgiler */}
              <div className="p-4 space-y-1 text-sm">
                <p className="text-gray-900 font-medium truncate">{p.name}</p>
                <p className="text-gray-500 truncate">{p.category?.name}</p>
                <p className="text-xs text-gray-400">
                  Stok: {p.sizes?.reduce((t, s) => t + (s.stock || 0), 0)}
                </p>
              </div>

              {/* Menü */}
              <div className="absolute top-3 right-3 z-10">
                <button
                  className="p-2 rounded-full hover:bg-gray-100 text-gray-600 transition"
                  onClick={() =>
                    setOpenMenu((m) => (m === p._id ? null : p._id))
                  }
                >
                  <FaEllipsisV />
                </button>

                {openMenu === p._id && (
                  <div className="absolute right-0 mt-2 w-44 bg-white shadow-lg rounded-lg overflow-hidden border border-gray-100">
                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        openEditForm(p);
                      }}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                    >
                      ✏️ Düzenle
                    </button>

                    {!p.parentProductId && (
                      <button
                        onClick={() => {
                          setOpenMenu(null);
                          openNewColorForm(p);
                        }}
                        className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                      >
                        🎨 Yeni Renk Ekle
                      </button>
                    )}

                    <button
                      onClick={() => {
                        setOpenMenu(null);
                        setDeleteId(p._id);
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      🗑️ Sil
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
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
            activeProduct?.isNewColor
              ? "Yeni Renk Ekle"
              : activeProduct
              ? "Ürünü Güncelle"
              : "Yeni Ürün"
          }
          onClose={closeForm}
        >
          {activeProduct?.isNewColor ? (
            <AddNewColorForm
              product={activeProduct}
              onClose={closeForm}
              onSaved={onSaved}
            />
          ) : activeProduct ? (
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
