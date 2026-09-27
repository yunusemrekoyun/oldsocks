// Eski siparişlerde kalan T.C. kimlik numaralarını (ve 11111111111 yedeğini) siler.
// Varsayılan olarak yalnız sayar; silmek için --apply verin. Önce yedek alın.
//   node scripts/clearLegacyIdentityNumbers.js          # kaç sipariş etkilenir
//   node scripts/clearLegacyIdentityNumbers.js --apply  # sil
require("../config/env").loadEnv();

const mongoose = require("mongoose");

const FILTER = {
  $or: [
    { "guest.identityNumber": { $exists: true } },
    { "guest.identityFallbackUsed": { $exists: true } },
    { identityFallbackUsed: { $exists: true } },
  ],
};

async function main() {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI ayarlı değil.");
  const apply = process.argv.includes("--apply");
  await mongoose.connect(process.env.MONGO_URI);
  const orders = mongoose.connection.collection("orders");
  const total = await orders.countDocuments(FILTER);
  const withNumber = await orders.countDocuments({ "guest.identityNumber": { $nin: [null, ""] } });
  process.stdout.write(
    `Veritabanı: ${mongoose.connection.name}\nKimlik alanı olan sipariş: ${total} (dolu kimlik no: ${withNumber})\n`
  );
  if (apply && total > 0) {
    const result = await orders.updateMany(FILTER, {
      $unset: { "guest.identityNumber": "", "guest.identityFallbackUsed": "", identityFallbackUsed: "" },
    });
    process.stdout.write(`Temizlenen sipariş: ${result.modifiedCount}\n`);
  } else if (!apply) {
    process.stdout.write("Deneme çalıştırması; silmek için --apply ekleyin.\n");
  }
  await mongoose.connection.close();
}

main().catch(async (error) => {
  console.error("Kimlik numarası temizliği çalıştırılamadı:", error?.message || error);
  await mongoose.connection.close().catch(() => {});
  process.exitCode = 1;
});
