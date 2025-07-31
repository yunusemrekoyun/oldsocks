import React, { useEffect, useState } from "react";
import api from "../../../api";

// Durum kodlarını Türkçeye çeviren eşleme
const STATUS_LABELS = {
  pending: "Sipariş oluşturuldu",
  paid: "Ödeme alındı",
  shipped: "Kargoya verildi",
  completed: "Sipariş tamamlandı",
  cancelled: "İptal edildi",
};

export default function OrdersList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    api
      .get("/orders")
      .then((res) => setOrders(res.data))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Yükleniyor…</div>;

  const filtered = orders.filter(
    (o) =>
      (o.orderNumber || "").includes(search) ||
      (o.paymentId || "").includes(search)
  );

  return (
    <div>
      <div className="mb-4">
        <input
          type="text"
          placeholder="Sipariş numarası ara..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <p className="text-center text-gray-500">Hiç sipariş bulunamadı.</p>
        )}

        {filtered.map((order) => (
          <div key={order._id} className="bg-white p-4 rounded shadow-md">
            <h3 className="font-semibold mb-1">
              Sipariş No: {order.orderNumber}
            </h3>
            <p className="text-sm text-gray-600 mb-1">
              Tarih: {new Date(order.createdAt).toLocaleString()}
            </p>
            <p className="text-sm mb-1">
              Durum:{" "}
              <span className="font-medium">
                {STATUS_LABELS[order.status] || order.status}
              </span>
            </p>
            <p className="text-sm font-medium mb-2">
              Toplam: ₺{order.totalPrice.toFixed(2)}
            </p>

            {/* Adres */}
            <div className="mb-2">
              <p className="font-medium">Adres:</p>
              <p className="text-sm">{order.address.title}</p>
              <p className="text-sm">{order.address.mainaddress}</p>
              <p className="text-sm">
                {order.address.street}, {order.address.district}
              </p>
              <p className="text-sm">
                {order.address.city} / {order.address.postalCode}
              </p>
            </div>

            {/* Ürünler */}
            <div>
              <p className="font-medium mb-1">Ürünler:</p>
              <ul className="list-disc list-inside">
                {order.items.map((it) => (
                  <li key={it.productId}>
                    {it.name} — Adet: {it.qty} × ₺{it.price.toFixed(2)}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
