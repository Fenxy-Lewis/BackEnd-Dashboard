const express = require("express"); // ✅ fix
const generateOrderDoc = require("../../src/routes/utils/generateOrderDoc"); // ✅ fix path
const { Order, OrderDetail, Customer } = require("../../models");
const router = express.Router();

router.get("/:id/generate-invoice", async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { model: Customer, as: "customer" },
        { model: OrderDetail, as: "orderDetails" },
      ],
    });

    // ✅ check null
    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }
    const buffer = generateOrderDoc(order);

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=order-${order.id}.docx`,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    );

    res.send(buffer);
  } catch (error) {
    console.error("Error in /orders/:orderId/generate-invoice:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

module.exports = router;
