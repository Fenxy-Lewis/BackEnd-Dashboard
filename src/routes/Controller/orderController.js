const db = require("../../../models");
const { Customer, Products, Order, OrderDetail } = db;

function generateInvoiceNumber() {
  const now = new Date();
  const timestamp = now.getTime().toString().slice(-6); // យកតែ ៦ លេខចុងក្រោយនៃ timestamp
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0'); // លេខ random ៣ ខ្ទង់
  
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `INV-${year}${month}${day}-${timestamp}${random}`;
  // លទ្ធផលប្រហែលជា៖ INV-20260410-458129045
}

const create = async (req, res) => {
  try {
    // ✅ បន្ថែម location ក្នុង destructure
    const { items, discount, location } = req.body;

    // ✅ Validate items មានឬទេ
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Items are required",
      });
    }

    let total = 0;
    const orderDetailsData = [];

    for (const item of items) {
      const { productId, qty } = item;

      // ✅ Validate productId និង qty
      if (!productId || !qty || qty <= 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid productId or qty",
        });
      }

      const product = await Products.findByPk(productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          message: `Product id=${productId} not found`,
        });
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

    // ✅ location បានមកពី req.body ហើយ
    const createdOrder = await Order.create({
      customerId: 5,
      orderNumber: generateInvoiceNumber(),
      total: total.toFixed(2),
      discount: discount || 0.00,
      orderDate: new Date(),
      location: "Praek Krobao, Peam Chor, Prey Veng", // ✅ មិន crash បើ location undefined
    });

    const finalOrderDetails = orderDetailsData.map((item) => ({
      ...item,
      orderId: createdOrder.id,
    }));
    await OrderDetail.bulkCreate(finalOrderDetails);

    const completedOrder = await Order.findByPk(createdOrder.id, {
      include: [
        { model: Customer, as: "customer" },
        { model: OrderDetail, as: "orderDetails" },
      ],
    });

    res.json({
      success: true,
      message: "Order created successfully",
      data: completedOrder,
    });
  } catch (error) {
    // ✅ បង្ហាញ error detail ច្បាស់ជាង
    console.error("Error creating order:", error.message);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error.message, // ✅ ជួយ debug
    });
  }
};

module.exports = { create };
