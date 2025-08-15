// backend/jobs/discountScheduler.js
const { tickScheduler } = require("../services/discountService");

let timer = null;

function start() {
  if (timer) return;
  timer = setInterval(async () => {
    try {
      await tickScheduler();
    } catch (e) {
      console.error("discount scheduler tick error:", e);
    }
  }, 60 * 1000); // her 60 sn
  console.log("[DiscountScheduler] started");
}

function stop() {
  if (!timer) return;
  clearInterval(timer);
  timer = null;
}

module.exports = { start, stop };