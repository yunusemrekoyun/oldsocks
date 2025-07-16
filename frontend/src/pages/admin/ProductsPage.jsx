// src/pages/admin/ProductsPage.jsx
import React, { useState, useEffect } from "react";
import ProductFormModal from "./ProductFormModal";
import ProductListPanel from "./ProductListPanel";
import Window from "../../components/ui/Window";
import api from "../../../api";

export default function ProductsPage() {
  const [products, setProducts] = useState([]);
  const [activeProduct, setActiveProduct] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isListFull, setIsListFull] = useState(false);

  useEffect(() => {
    fetch();
  }, []);

  const fetch = async () => {
    try {
      const { data } = await api.get("/products");
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const openNewForm = () => {
    setActiveProduct(null);
    setIsFormOpen(true);
  };

  const openEditForm = (prod) => {
    setActiveProduct(prod);
    setIsFormOpen(true);
  };

  const closeForm = () => setIsFormOpen(false);

  const onSaved = () => {
    fetch();
    closeForm();
  };

  return (
    <div className="p-6 space-y-4">
      {/* Başlıklar */}
      <div className="flex space-x-4">
        <h1
          className="cursor-pointer text-lg font-semibold px-4 py-2 bg-blue-100 rounded hover:bg-blue-200"
          onClick={openNewForm}
        >
          Ürün Ekle
        </h1>
        <h1
          className="cursor-pointer text-lg font-semibold px-4 py-2 bg-green-100 rounded hover:bg-green-200"
          onClick={() => setIsListFull((f) => !f)}
        >
          {isListFull ? "Listeyi Küçült" : "Ürün Listesi"}
        </h1>
      </div>
      {isListFull && (
        <Window title="Ürün Listesi" onClose={() => setIsListFull(false)}>
          <ProductListPanel
            products={products}
            onEdit={openEditForm}
            onDelete={fetch}
            isFull={true}
          />
        </Window>
      )}
      {!isListFull && (
        <div className="relative">
          <ProductListPanel
            products={products}
            onEdit={openEditForm}
            onDelete={fetch}
            isFull={false}
          />
        </div>
      )}
      <div
        className={`${
          isListFull ? "fixed inset-0 bg-white z-20 p-10 overflow-auto" : ""
        }`}
      >
        <ProductListPanel
          products={products}
          onEdit={openEditForm}
          onDelete={fetch}
          isFull={isListFull}
        />
      </div>

      {isFormOpen && (
        <Window
          title={activeProduct ? "Ürün Düzenle" : "Yeni Ürün"}
          onClose={closeForm}
        >
          <ProductFormModal
            product={activeProduct}
            onClose={closeForm} // içten de kapatmak için
            onSaved={onSaved}
          />
        </Window>
      )}
    </div>
  );
}
