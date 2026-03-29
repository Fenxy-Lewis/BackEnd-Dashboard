const db = require("../../../models");
const { Customer, Products, Order, OrderDetail } = db;

// POST /api/v1/orders
const create = async (req, res) => {
  try {
    const { customerId, location, items, discount } = req.body;

    // Validate customer
    const customer = await Customer.findByPk(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, message: "Customer not found" });
    }

    // Build order details & calculate total
    let total = 0;
    const orderDetailsData = [];
    for (const item of items) {
      const { productId, qty } = item;
      const product = await Products.findByPk(productId);
      if (!product) {
        return res.status(404).json({ success: false, message: `Product id=${productId} not found` });
      }

      const amount = product.price * qty;
      total += amount;

      orderDetailsData.push({
        productId,
        productName: product.name,
        productprice: product.price,
        qty,
        amount,
      });
    }

    // Persist order
    const createdOrder = await Order.create({
      customerId,
      orderNumber: 10,
      total,
      discount,
      orderDate: new Date(),
      location,
    });

    // Persist order details
    const finalOrderDetails = orderDetailsData.map((item) => ({
      ...item,
      orderId: createdOrder.id,
    }));
    await OrderDetail.bulkCreate(finalOrderDetails);

    // Return full order with relations
    const completedOrder = await Order.findByPk(createdOrder.id, {
      include: [
        { model: Customer, as: "customer" },
        { model: OrderDetail, as: "orderDetails" },
      ],
    });

    res.json({ success: true, message: "Order created successfully", data: completedOrder });
  } catch (error) {
    console.error("Error creating order:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { create };