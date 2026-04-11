const express = require("express");
const Route = express.Router();
const { Payment, Order, Customer } = require("../../models");
const { createPayment } = require("./Controller/paymentController");

Route.post("/:orderId", createPayment);
module.exports = Route;