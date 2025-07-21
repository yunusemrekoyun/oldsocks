// backend/config/iyzico.js
const Iyzipay = require("iyzipay");

module.exports = new Iyzipay({
  apiKey: process.env.IYZIPAY_API_KEY,
  secretKey: process.env.IYZIPAY_SECRET_KEY,
  uri: process.env.IYZIPAY_BASE_URL, // sandbox için "https://sandbox-api.iyzipay.com"
});
