// backend/routes/contact.js
const router = require("express").Router();
const { sendContactMessage } = require("../controllers/contactController");

// herkese açık form post (captcha yoksa abuse'a dikkat)
router.post("/", sendContactMessage);

module.exports = router;
