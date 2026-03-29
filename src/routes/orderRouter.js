const express = require("express");
const router = express.Router();
const { create } = require("./Controller/orderController");
const generateReport = require("../routes/generateReport");


router.post("/", create);
router.use("/", generateReport);

module.exports = router;