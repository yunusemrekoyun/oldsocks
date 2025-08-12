// src/pages/admin/ProductListPage.jsx  → DEĞİL
// src/pages/admin/OrdersPage.jsx       ← BU DOSYA
import React, { useState, useEffect } from "react";
import api from "../../../api";
import { Listbox } from "@headlessui/react";
import {
  FaCheck,
  FaChevronDown,
  FaBoxOpen,
  FaClock,
  FaTruck,
  FaCheckCircle,
  FaBan,
} from "react-icons/fa";

const STATUS_LABELS = {
  pending: "Sipariş oluşturuldu",
  paid: "Ödeme alındı",
  shipped: "Kargoya verildi",
  completed: "Sipariş tamamlandı",
  cancelled: "İptal edildi",
};

// (Yumuşak rozet renkleri)
const STATUS_STYLES = {
  pending: "bg-amber-100 text-amber-800",
  paid: "bg-blue-100 text-blue-800",
  shipped: "bg-indigo-100 text-indigo-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-700",
};

const STATUS_ICON = {
  pending: <FaClock className="inline -mt-0.5 mr-1" />,
  paid: <FaCheck className="inline -mt-0.5 mr-1" />,
  shipped: <FaTruck className="inline -mt-0.5 mr-1" />,
  completed: <FaCheckCircle className="inline -mt-0.5 mr-1" />,
  cancelled: <FaBan className="inline -mt-0.5 mr-1" />,
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    api
      .get("/orders/all")
      .then((res) => {
        const withSelect = res.data.map((o) => ({
          ...o,
          selectedStatus: o.status,
        }));
        setOrders(withSelect);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let result = [...orders];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter((o) => o.orderNumber?.toLowerCase().includes(s));
    }
    if (statusFilter) {
      result = result.filter((o) => o.status === statusFilter);
    }
    result.sort((a, b) =>
      sortOrder === "asc"
        ? new Date(a.createdAt) - new Date(b.createdAt)
        : new Date(b.createdAt) - new Date(a.createdAt)
    );

    setFilteredOrders(result);
  }, [orders, searchTerm, sortOrder, statusFilter]);

  const handleStatusChange = (id, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, selectedStatus: newStatus } : o))
    );
  };

  const updateStatus = async (id) => {
    const order = orders.find((o) => o._id === id);
    if (!order) return;
    setUpdatingId(id);
    try {
      await api.put(`/orders/${id}/status`, { status: order.selectedStatus });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === id ? { ...o, status: order.selectedStatus } : o
        )
      );
    } catch (err) {
      console.error("Status update failed", err);
      alert("Sipariş durumu güncellenemedi.");
    } finally {
      setUpdatingId(null);
    }
  };

  const fmtPrice = (n) =>
    `₺${Number(n || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  if (loading) {
    return (
      <div className="p-8 text-lg text-dark1">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* --- Üst Araçlar --- */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur border border-light2 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2 text-dark2">
            <FaBoxOpen />
            <h1 className="text-xl font-semibold text-dark1">Siparişler</h1>
            <span className="text-xs bg-light1 text-dark2 px-2 py-0.5 rounded">
              {filteredOrders.length}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <input
              type="text"
              placeholder="Sipariş no ara…"
              className="border border-light2 rounded-lg px-3 py-2 bg-white text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-dark1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />

            <select
              className="border border-light2 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-dark1"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Tüm Durumlar</option>
              {Object.entries(STATUS_LABELS).map(([k, v]) => (
                <option key={k} value={k}>
                  {v}
                </option>
              ))}
            </select>

            <select
              className="border border-light2 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-dark1"
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value)}
            >
              <option value="desc">Yeni → Eski</option>
              <option value="asc">Eski → Yeni</option>
            </select>
          </div>
        </div>
      </div>

      {/* --- Siparişler --- */}
      {filteredOrders.length === 0 ? (
        <div className="text-center text-dark2 bg-white border border-light2 rounded-xl p-10">
          Kriterlere uygun sipariş bulunamadı.
        </div>
      ) : (
        <div className="space-y-5">
          {filteredOrders.map((order) => {
            const count = order.items?.reduce((t, it) => t + (it.qty || 0), 0) || 0;
            const changed = order.selectedStatus !== order.status;
            const statusClass = STATUS_STYLES[order.status] || "bg-light1 text-dark1";
            const selectedClass = STATUS_STYLES[order.selectedStatus] || "bg-light1 text-dark1";

            return (
              <div
                key={order._id}
                className="bg-white border border-light2 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Üst şerit */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4 border-b border-light2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <div className="text-sm font-semibold text-dark1">
                      #{order.orderNumber}
                    </div>
                    <div className="text-xs text-dark2">
                      {new Date(order.createdAt).toLocaleString("tr-TR")}
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${statusClass}`}
                      title={STATUS_LABELS[order.status]}
                    >
                      {STATUS_ICON[order.status]}
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-sm text-dark2">
                      Adet: <b className="text-dark1">{count}</b>
                    </span>
                    <span className="text-sm text-dark2">
                      Toplam:{" "}
                      <b className="text-dark1">{fmtPrice(order.totalPrice)}</b>
                    </span>
                  </div>
                </div>

                {/* Ürün listesi */}
                <div className="px-5 py-4">
                  <div className="rounded-xl border border-light2 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-light1 text-dark2">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">Ürün</th>
                          <th className="text-left px-4 py-2 font-medium">Varyant</th>
                          <th className="text-right px-4 py-2 font-medium">Adet</th>
                          <th className="text-right px-4 py-2 font-medium">Birim</th>
                          <th className="text-right px-4 py-2 font-medium">Tutar</th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => (
                          <tr
                            key={idx}
                            className={idx % 2 === 0 ? "bg-white" : "bg-light1/50"}
                          >
                            <td className="px-4 py-2 text-dark1">{item.name}</td>
                            <td className="px-4 py-2 text-dark2">
                              {(item.size && `Beden: ${item.size}`) ||
                                (item.color && `Renk: ${item.color}`) ||
                                "-"}
                            </td>
                            <td className="px-4 py-2 text-right text-dark1">
                              {item.qty}
                            </td>
                            <td className="px-4 py-2 text-right text-dark1">
                              {fmtPrice(item.price)}
                            </td>
                            <td className="px-4 py-2 text-right text-dark1">
                              {fmtPrice(item.qty * item.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Alt satır: durum değiştir + kaydet */}
                  <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-dark2">Durum:</span>
                      <Listbox
                        value={order.selectedStatus}
                        onChange={(val) => handleStatusChange(order._id, val)}
                      >
                        <div className="relative">
                          <Listbox.Button
                            className={`flex items-center gap-2 pr-9 pl-3 py-2 rounded-lg border border-light2 shadow-sm text-sm ${selectedClass}`}
                          >
                            {STATUS_ICON[order.selectedStatus]}
                            {STATUS_LABELS[order.selectedStatus]}
                            <FaChevronDown className="absolute right-2 opacity-60" />
                          </Listbox.Button>
                          <Listbox.Options className="absolute mt-1 w-full bg-white border border-light2 rounded-lg shadow-lg z-10 text-sm overflow-hidden">
                            {Object.entries(STATUS_LABELS).map(([key, label]) => {
                              const cls = STATUS_STYLES[key] || "bg-light1 text-dark1";
                              return (
                                <Listbox.Option
                                  key={key}
                                  value={key}
                                  className={({ active, selected }) =>
                                    `px-3 py-2 cursor-pointer ${active ? "bg-light1" : "bg-white"}`
                                  }
                                >
                                  {({ selected }) => (
                                    <div className={`flex items-center gap-2 ${selected ? "font-semibold" : ""}`}>
                                      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${cls}`}>
                                        {STATUS_ICON[key]}
                                        {label}
                                      </span>
                                      {selected && <FaCheck className="ml-auto text-dark2" />}
                                    </div>
                                  )}
                                </Listbox.Option>
                              );
                            })}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>

                    <div className="flex items-center gap-2">
                      {changed && (
                        <button
                          onClick={() => updateStatus(order._id)}
                          disabled={updatingId === order._id}
                          className="px-4 py-2 rounded-lg bg-dark1 text-white hover:bg-dark2 transition disabled:opacity-60"
                        >
                          {updatingId === order._id ? "Kaydediliyor..." : "Güncelle"}
                        </button>
                      )}
                      {!changed && (
                        <span className="text-xs text-dark2">Güncel durumda</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}