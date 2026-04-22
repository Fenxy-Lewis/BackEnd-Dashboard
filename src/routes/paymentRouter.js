const express = require("express");
const Route = express.Router();
const {
  createPayment,
  checkTransaction,
} = require("./Controller/paymentController");
Route.post("/:orderId", createPayment);
Route.post("/check/:tranId", checkTransaction);
module.exports = Route;
