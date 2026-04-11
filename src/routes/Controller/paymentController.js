const db = require("../../../models");
const {
  getReqTime,
  enCodeBase64,
  buildPurchaseHash,
} = require("../utils/payway");
const { Order, Payment, OrderDetail, Customer } = db;

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

    // Create payment
    const payment = await Payment.create({
      orderId: order.id,
      paywayTranId: `PAYWAY-${Date.now()}`,
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
        price: item.productPrice || 0,
        qty: item.qty || 1,
      })),
    );
    paymentItems = enCodeBase64(paymentItems);
    const endCodeReturnUrl = `${process.env.FRONTEND_URL}/api/v1/payments/${payment.id}/admin/pos`;

    const paymentPayload = {
      merchant_id: process.env.MERCHANT_ID,
      req_time,
      tran_id: payment.paywayTranId,
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
      return_url: endCodeReturnUrl,
      cancel_url: `${process.env.FRONTEND_URL}/admin/pos`,
      continue_success_url: `${process.env.FRONTEND_URL}/admin/pos`,
      currency: "USD",
      payment_gate: 0,
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

module.exports = { createPayment };
