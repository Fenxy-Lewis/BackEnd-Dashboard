const db = require("../../../models");
const {
  getReqTime,
  enCodeBase64,
  buildPurchaseHash,
  buildCheckTransactionHash,
} = require("../utils/payway");
const { Order, Payment, OrderDetail, Customer } = db;
const axios = require("axios");
// POST /api/v1/orders/:orderId/payments
// Create payment
const createPayment = async (req, res) => {
  try {
    const { orderId } = req.params;
    // Validate orderId
    if (!orderId || orderId === "undefined") {
      return res.status(400).json({
        success: false,
        message: "Valid Order ID is required",
      });
    }

    // Fetch order
    const order = await Order.findByPk(orderId, {
      include: [
        { model: OrderDetail, as: "orderDetails" },
        { model: Customer, as: "customer" },
      ],
    });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: `Order id=${orderId} not found`,
      });
    }
    // Check if PENDING payment already exists
    const existingPayment = await Payment.findOne({
      where: { orderId, status: "PENDING" },
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "A pending payment already exists for this order",
      });
    }

    // Validate order has total amount
    if (!order.total || order.total <= 0) {
      return res.status(400).json({
        success: false,
        message: "Order total must be greater than 0",
      });
    }

    let tran_id;
    tran_id = `ORD-${Date.now()}`;

    // Create payment
    const payment = await Payment.create({
      orderId: order.id,
      paywayTranId: tran_id,
      method: "abapay_khqr",
      // method: "cards",
      status: "PENDING",
      amount: Number(order.total).toFixed(2),
      remark: `Payment for order ${order.orderNumber} Pay via ABA KHQR`,
    });
    const req_time = getReqTime();
    console.log("Payment created with req_time:", req_time);

    const orderDetails = order.orderDetails || [];

    if (orderDetails.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Order has no items",
      });
    }

    let paymentItems = JSON.stringify(
      orderDetails.map((item) => ({
        name: item.productName || "Unknown",
        price: Number(item.productprice) || 0,
        qty: Number(item.qty) || 1,
      })),
    );
    paymentItems = enCodeBase64(paymentItems);
    const encodedReturnUrl = `${process.env.FRONTEND_URL}/api/v1/payments/${payment.id}/admin/pos`;

    const paymentPayload = {
      merchant_id: process.env.MERCHANT_ID,
      req_time,
      tran_id,
      amount: Number(order.total).toFixed(2),
      items: paymentItems,
      shipping: "0.00",
      firstname: order.customer?.name || "NA",
      lastname: order.customer?.name || "NA",
      email: order.customer?.email || "NA@gmail.com",
      phone: order.customer?.phone || "000000000",
      type: "purchase",
      view_type: "popup",
      payment_option: "abapay_khqr",
      // payment_option: "cards",
      return_url: encodedReturnUrl,
      cancel_url: `${process.env.FRONTEND_URL}/admin/pos`,
      continue_success_url: `${process.env.FRONTEND_URL}/admin/pos?tranId=${tran_id}`,
      currency: "USD",
      payment_gate: 0,
      lifetime: 3600,
    };

    const hash = buildPurchaseHash(paymentPayload);
    console.log("Generated payment hash:", hash);

    return res.status(201).json({
      success: true,
      message: "Payment created successfully",
      data: {
        payment,
        payway: {
          action: `${process.env.BASE_URL}/api/payment-gateway/v1/payments/purchase`,
          method: "POST",
          target: "aba_webservice",
          id: "aba_merchant_request",
          fields: {
            ...paymentPayload,
            hash,
          },
        },
      },
    });
  } catch (error) {
    console.error("Error creating payment:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

const checkTransaction = async (req, res) => {
  try {
    const { tranId } = req.params;

    const payment = await Payment.findOne({
      where: { paywayTranId: tranId },
    });

    if (!payment) {
      return res.status(404).json({
        message: "Payment not found",
      });
    }

    const req_time = getReqTime();
    const merchant_id = process.env.MERCHANT_ID;
    const tran_id = payment.paywayTranId;

    const hash = buildCheckTransactionHash({ req_time, merchant_id, tran_id });

    const payload = {
      req_time,
      merchant_id,
      tran_id,
      hash,
    };
    const response = await axios.post(
      `${process.env.BASE_URL}/api/payment-gateway/v1/payments/check-transaction-2`,
      payload,
    );
    console.log("response from ABA", response.data);

    const abaData = response.data;
    const statusCode = abaData?.status?.code;
    const paymentStatusCode = abaData?.data?.payment_status_code;
    const paymentStatus = abaData?.data?.payment_status;

    if (statusCode == "00") {
      if (paymentStatusCode === 0 && paymentStatus === "APPROVED") {
        payment.status = "PAID";
        payment.paidAt = abaData?.data?.transaction_date;
      } else if (
        paymentStatus === "DECLINED" ||
        paymentStatus === "FAILED" ||
        paymentStatusCode !== 0
      ) {
        payment.status = "FAILED";
      } else {
        payment.status = "PENDING";
      }

      payment.remark = JSON.stringify(abaData);
      await payment.save();
    }

    return res.json({
      message: "Payment checked successfully",
      data: {
        payment: payment,
        aba: abaData,
      },
    });
  } catch (error) {
    console.error("Error", error);
  }
};
module.exports = { createPayment, checkTransaction };
