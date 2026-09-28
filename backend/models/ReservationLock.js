const mongoose = require("mongoose");

// Aynı bağlantıdan (IP) eşzamanlı ödeme başlatmalarını sıraya sokmak için kilit kaydı:
// stok ayrımı işlemi önce bu kayda yazar, böylece açık ayrım sayısı yarışmadan sayılır.
const ReservationLockSchema = new mongoose.Schema(
  {
    _id: { type: String },
    at: { type: Date, default: Date.now },
  },
  { versionKey: false }
);

ReservationLockSchema.index({ at: 1 }, { expireAfterSeconds: 24 * 60 * 60 });

module.exports = mongoose.model("ReservationLock", ReservationLockSchema);
