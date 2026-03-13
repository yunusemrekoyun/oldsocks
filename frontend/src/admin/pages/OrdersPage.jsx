// src/pages/admin/OrdersPage.jsx
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
  FaTimes,
} from "react-icons/fa";
import useUnseenOrders from "../../hooks/useUnseenOrders";
import ToastAlert from "../../components/ui/ToastAlert";

const STATUS_LABELS = {
  pending: "Sipariş oluşturuldu",
  paid: "Ödeme alındı",
  shipped: "Kargoya verildi",
  completed: "Sipariş tamamlandı",
  cancelled: "İptal edildi",
};

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
  const [imageViewer, setImageViewer] = useState(null);
  const [toast, setToast] = useState(null);
  const { markSeen } = useUnseenOrders();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("desc");
  const [statusFilter, setStatusFilter] = useState("");
  const [listMode, setListMode] = useState("active");

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
    let result =
      listMode === "pending"
        ? orders.filter((o) => o.status === "pending")
        : orders.filter((o) => o.status !== "pending");
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
  }, [listMode, orders, searchTerm, sortOrder, statusFilter]);

  const handleStatusChange = (id, newStatus) => {
    setOrders((prev) =>
      prev.map((o) => (o._id === id ? { ...o, selectedStatus: newStatus } : o))
    );
  };

  useEffect(() => {
    const doSeen = () => markSeen();
    doSeen();
    window.addEventListener("focus", doSeen);
    return () => window.removeEventListener("focus", doSeen);
  }, [markSeen]);

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
      setToast({ type: "error", msg: "Sipariş durumu güncellenemedi." });
    } finally {
      setUpdatingId(null);
    }
  };

  const fmtPrice = (n) =>
    `₺${Number(n || 0).toLocaleString("tr-TR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;

  const pendingCount = orders.filter((o) => o.status === "pending").length;
  const activeCount = orders.filter((o) => o.status !== "pending").length;

  const getProductMeta = (item) => {
    const populatedProduct =
      item?.productId && typeof item.productId === "object" ? item.productId : null;

    return {
      productId: populatedProduct?._id || item?.productId || null,
      image: populatedProduct?.images?.[0] || "",
    };
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-8 text-lg text-dark1">
        Yükleniyor…
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 py-6 space-y-6">
      {imageViewer && (
        <div
          className="fixed inset-0 z-[1200] bg-black/85 p-4 sm:p-6"
          onClick={() => setImageViewer(null)}
          role="dialog"
          aria-modal="true"
          aria-label="Sipariş ürün görseli"
        >
          <div className="relative flex h-full w-full items-center justify-center">
            <button
              type="button"
              className="absolute right-0 top-0 inline-flex items-center justify-center rounded-full bg-white/10 p-3 text-white transition hover:bg-white/20"
              onClick={() => setImageViewer(null)}
              aria-label="Görseli kapat"
            >
              <FaTimes />
            </button>

            <img
              src={imageViewer.src}
              alt={imageViewer.alt}
              className="max-h-[88vh] max-w-full rounded-2xl bg-white object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}

      {/* --- Üst Araçlar --- */}
      <div className="sticky top-0 z-10 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border border-light2 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-2 text-dark2 min-w-0">
            <FaBoxOpen />
            <h1 className="text-xl font-semibold text-dark1 truncate">
              {listMode === "pending" ? "Pending Siparişler" : "Siparişler"}
            </h1>
            <span className="text-xs bg-light1 text-dark2 px-2 py-0.5 rounded shrink-0">
              {filteredOrders.length}
            </span>
          </div>

          <div className="flex w-full md:w-auto flex-col sm:flex-row gap-3">
            <div className="flex rounded-lg border border-light2 bg-white p-1">
              <button
                type="button"
                onClick={() => {
                  setListMode("active");
                  setStatusFilter("");
                }}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  listMode === "active"
                    ? "bg-dark1 text-white"
                    : "text-dark2 hover:bg-light1"
                }`}
              >
                Siparişler ({activeCount})
              </button>
              <button
                type="button"
                onClick={() => {
                  setListMode("pending");
                  setStatusFilter("");
                }}
                className={`rounded-md px-3 py-2 text-sm font-medium transition ${
                  listMode === "pending"
                    ? "bg-amber-500 text-white"
                    : "text-dark2 hover:bg-light1"
                }`}
              >
                Pending Listele ({pendingCount})
              </button>
            </div>

            <input
              type="text"
              placeholder="Sipariş no ara…"
              className="border border-light2 rounded-lg px-3 py-2 bg-white text-sm w-full sm:w-64 focus:outline-none focus:ring-2 focus:ring-dark1"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Sipariş numarası ara"
            />

            <select
              className="border border-light2 rounded-lg px-3 py-2 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-dark1"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              aria-label="Duruma göre filtrele"
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
              aria-label="Tarihe göre sırala"
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
            const count =
              order.items?.reduce((t, it) => t + (it.qty || 0), 0) || 0;
            const fallbackSubTotal =
              order.items?.reduce(
                (t, it) => t + Number(it.qty || 0) * Number(it.price || 0),
                0
              ) || 0;
            const pricingSubTotal = Number(
              order.pricing?.subTotal ?? fallbackSubTotal
            );
            const pricingCampaignDiscount = Number(
              order.pricing?.campaignDiscount ?? order.campaign?.savings ?? 0
            );
            const pricingCouponDiscount = Number(
              order.pricing?.couponDiscount ?? order.coupon?.savings ?? 0
            );
            const pricingShippingFee = Number(
              order.pricing?.shippingFee ?? order.shipping?.fee ?? 0
            );
            const changed = order.selectedStatus !== order.status;
            const statusClass =
              STATUS_STYLES[order.status] || "bg-light1 text-dark1";
            const selectedClass =
              STATUS_STYLES[order.selectedStatus] || "bg-light1 text-dark1";

            return (
              <div
                key={order._id}
                className="bg-white border border-light2 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              >
                {/* Üst şerit */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 px-5 py-4 border-b border-light2">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 min-w-0">
                    <div className="text-sm font-semibold text-dark1 truncate">
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

                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <span className="text-sm text-dark2">
                      Adet: <b className="text-dark1">{count}</b>
                    </span>
                    <span className="text-sm text-dark2">
                      Toplam:{" "}
                      <b className="text-dark1">{fmtPrice(order.totalPrice)}</b>
                    </span>
                  </div>
                </div>

                {/* Ürün listesi (scrollable on mobile) */}
                <div className="px-5 py-4">
                  <div className="rounded-xl border border-light2 overflow-x-auto">
                    <table className="w-full min-w-[560px] text-sm sm:min-w-[680px]">
                      <thead className="bg-light1 text-dark2">
                        <tr>
                          <th className="text-left px-4 py-2 font-medium">
                            Ürün
                          </th>
                          <th className="hidden px-4 py-2 text-left font-medium sm:table-cell">
                            Varyant
                          </th>
                          <th className="text-right px-4 py-2 font-medium">
                            Adet
                          </th>
                          <th className="text-right px-4 py-2 font-medium">
                            Birim
                          </th>
                          <th className="text-right px-4 py-2 font-medium">
                            Tutar
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {order.items.map((item, idx) => {
                          const { productId, image } = getProductMeta(item);
                          const hasVariant = item.size || item.color;

                          return (
                            <tr
                              key={idx}
                              className={
                                idx % 2 === 0 ? "bg-white" : "bg-light1/50"
                              }
                            >
                              <td className="px-4 py-3 text-dark1">
                                <div className="flex min-w-0 items-center gap-3">
                                  {image ? (
                                    <button
                                      type="button"
                                      className="h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-light2 bg-white focus:outline-none focus:ring-2 focus:ring-dark1"
                                      onClick={() =>
                                        setImageViewer({
                                          src: image,
                                          alt: item.name,
                                        })
                                      }
                                      aria-label={`${item.name} görselini büyüt`}
                                    >
                                      <img
                                        src={image}
                                        alt={item.name}
                                        className="h-full w-full object-cover"
                                      />
                                    </button>
                                  ) : (
                                    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl border border-dashed border-light2 bg-light1 text-xs text-dark2">
                                      Görsel
                                    </div>
                                  )}

                                  <div className="min-w-0">
                                    {productId ? (
                                      <a
                                        href={`/product-details/${productId}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        className="block break-words font-medium text-dark1 transition hover:text-dark2 hover:underline"
                                      >
                                        {item.name}
                                      </a>
                                    ) : (
                                      <div className="break-words font-medium text-dark1">
                                        {item.name}
                                      </div>
                                    )}

                                    <div className="mt-1 text-xs text-dark2 sm:hidden">
                                      {hasVariant
                                        ? [
                                            item.size ? `Beden: ${item.size}` : null,
                                            item.color ? `Renk: ${item.color}` : null,
                                          ]
                                            .filter(Boolean)
                                            .join(" • ")
                                        : "Varyant yok"}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="hidden px-4 py-2 text-dark2 sm:table-cell">
                                {hasVariant
                                  ? [
                                      item.size ? `Beden: ${item.size}` : null,
                                      item.color ? `Renk: ${item.color}` : null,
                                    ]
                                      .filter(Boolean)
                                      .join(" • ")
                                  : "-"}
                              </td>
                              <td className="px-4 py-2 text-right text-dark1">
                                {item.qty}
                              </td>
                              <td className="px-4 py-2 text-right text-dark1 whitespace-nowrap">
                                {fmtPrice(item.price)}
                              </td>
                              <td className="px-4 py-2 text-right text-dark1 whitespace-nowrap">
                                {fmtPrice(item.qty * item.price)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="mt-4 grid grid-cols-1 gap-2 text-sm sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
                    <div className="rounded-lg bg-light1/70 px-3 py-2">
                      Ara Toplam:{" "}
                      <b className="text-dark1">{fmtPrice(pricingSubTotal)}</b>
                    </div>
                    <div className="rounded-lg bg-emerald-50 px-3 py-2 text-emerald-800">
                      Kampanya: <b>-{fmtPrice(pricingCampaignDiscount)}</b>
                    </div>
                    {pricingCouponDiscount > 0 && (
                      <div className="rounded-lg bg-blue-50 px-3 py-2 text-blue-800">
                        Kupon: <b>-{fmtPrice(pricingCouponDiscount)}</b>
                      </div>
                    )}
                    <div className="rounded-lg bg-light1/70 px-3 py-2">
                      Kargo:{" "}
                      <b className="text-dark1">{fmtPrice(pricingShippingFee)}</b>
                    </div>
                    <div className="px-3 py-2 rounded-lg bg-blue-50 text-blue-800">
                      Genel Toplam: <b>{fmtPrice(order.totalPrice)}</b>
                    </div>
                  </div>

                  {order.campaign?.name && (
                    <div className="mt-3 text-sm text-emerald-700">
                      Uygulanan kampanya: <b>{order.campaign.name}</b>
                    </div>
                  )}

                  {order.coupon?.code && (
                    <div className="mt-2 text-sm text-blue-700">
                      Uygulanan kupon: <b>{order.coupon.code}</b>
                    </div>
                  )}

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
                            className={`flex items-center gap-2 pr-9 pl-3 py-2 rounded-lg border border-light2 shadow-sm text-sm focus:outline-none focus:ring-2 focus:ring-dark1 ${selectedClass}`}
                            aria-label="Sipariş durumu seç"
                          >
                            {STATUS_ICON[order.selectedStatus]}
                            {STATUS_LABELS[order.selectedStatus]}
                            <FaChevronDown className="absolute right-2 opacity-60" />
                          </Listbox.Button>
                          <Listbox.Options className="absolute mt-1 w-56 sm:w-64 bg-white border border-light2 rounded-lg shadow-lg z-10 text-sm overflow-hidden">
                            {Object.entries(STATUS_LABELS).map(
                              ([key, label]) => {
                                const cls =
                                  STATUS_STYLES[key] || "bg-light1 text-dark1";
                                return (
                                  <Listbox.Option
                                    key={key}
                                    value={key}
                                    className={({ active }) =>
                                      `px-3 py-2 cursor-pointer ${
                                        active ? "bg-light1" : "bg-white"
                                      }`
                                    }
                                  >
                                    {({ selected }) => (
                                      <div
                                        className={`flex items-center gap-2 ${
                                          selected ? "font-semibold" : ""
                                        }`}
                                      >
                                        <span
                                          className={`inline-flex items-center gap-1 px-2 py-1 rounded-full ${cls}`}
                                        >
                                          {STATUS_ICON[key]}
                                          {label}
                                        </span>
                                        {selected && (
                                          <FaCheck className="ml-auto text-dark2" />
                                        )}
                                      </div>
                                    )}
                                  </Listbox.Option>
                                );
                              }
                            )}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>

                    <div className="flex items-center gap-2">
                      {changed ? (
                        <button
                          onClick={() => updateStatus(order._id)}
                          disabled={updatingId === order._id}
                          className="px-4 py-2 rounded-lg bg-dark1 text-white hover:bg-dark2 transition disabled:opacity-60 w-full sm:w-auto"
                        >
                          {updatingId === order._id
                            ? "Kaydediliyor..."
                            : "Güncelle"}
                        </button>
                      ) : (
                        <span className="text-xs text-dark2">
                          Güncel durumda
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

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
