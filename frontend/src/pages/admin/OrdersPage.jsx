import React, { useEffect, useState } from "react";
import AdminLayout from "../../components/layout/AdminLayout";
import api from "../../../api";
import { Listbox } from "@headlessui/react";

const STATUS_LABELS = {
  pending: "Sipariş oluşturuldu",
  paid: "Ödeme alındı",
  shipped: "Kargoya verildi",
  completed: "Sipariş tamamlandı",
  cancelled: "İptal edildi",
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
      result = result.filter((o) =>
        o.orderNumber.toLowerCase().includes(searchTerm.toLowerCase())
      );
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

  if (loading) return <div className="p-8 text-lg">Yükleniyor…</div>;

  return (
    <div className="p-6 space-y-6">
      {/* --- Üst Araçlar --- */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-4 rounded-lg shadow-md">
        <input
          type="text"
          placeholder="Sipariş numarası ara..."
          className="border border-light2 rounded px-4 py-2 w-full md:w-64"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <select
            className="appearance-none border border-light2 rounded px-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-dark1"
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
          >
            <option value="desc">Yeni → Eski</option>
            <option value="asc">Eski → Yeni</option>
          </select>
          <select
            className="appearance-none border border-light2 rounded px-4 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-dark1"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Tüm Durumlar</option>
            {Object.entries(STATUS_LABELS).map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* --- Siparişler --- */}
      {filteredOrders.length === 0 ? (
        <p className="text-center text-gray-500 mt-8">Sipariş bulunamadı.</p>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredOrders.map((order) => (
            <div
              key={order._id}
              className="bg-white rounded-xl shadow-md p-6 space-y-4 hover:shadow-lg transition"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-dark1 font-semibold text-lg">
                    #{order.orderNumber}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {new Date(order.createdAt).toLocaleString()}
                  </p>
                </div>
                <div>
                  <span className="text-sm px-2 py-1 bg-light1 rounded-full">
                    ₺{order.totalPrice?.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="text-sm text-gray-700">
                <p>
                  <strong>İsim:</strong> {order.user?.firstName}{" "}
                  {order.user?.lastName}
                </p>
                <p>
                  <strong>Email:</strong> {order.user?.email}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <Listbox
                  value={order.selectedStatus}
                  onChange={(val) => handleStatusChange(order._id, val)}
                >
                  <div className="relative w-full max-w-[200px]">
                    <Listbox.Button className="w-full cursor-pointer border border-light2 bg-white px-4 py-2 pr-8 rounded-md text-sm text-dark1 shadow-sm focus:outline-none focus:ring-2 focus:ring-black">
                      {STATUS_LABELS[order.selectedStatus]}
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                        ▼
                      </span>
                    </Listbox.Button>
                    <Listbox.Options className="absolute mt-1 w-full bg-white border border-light2 rounded-md shadow z-10 text-sm">
                      {Object.entries(STATUS_LABELS).map(([key, label]) => (
                        <Listbox.Option
                          key={key}
                          value={key}
                          className={({ active, selected }) =>
                            `px-4 py-2 cursor-pointer ${
                              active ? "bg-light1" : ""
                            } ${selected ? "font-semibold" : ""}`
                          }
                        >
                          {label}
                        </Listbox.Option>
                      ))}
                    </Listbox.Options>
                  </div>
                </Listbox>

                {order.selectedStatus !== order.status && (
                  <button
                    onClick={() => updateStatus(order._id)}
                    disabled={updatingId === order._id}
                    className="bg-dark1 text-white px-4 py-2 rounded text-sm hover:bg-dark2 transition disabled:opacity-50"
                  >
                    {updatingId === order._id ? "Kaydediliyor..." : "Güncelle"}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
