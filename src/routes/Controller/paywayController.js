const db = require("../../../models");
const { category, Products } = db;

// POST /api/v1/
// Create payment
const create = async (req, res) => {
  try {
    const { name, is_active } = req.body;
    const newCategory = await category.create({ name, is_active });
    res.json({ success: true, message: "Category created successfully", data: newCategory });
  } catch (error) {
    console.error("Error creating category:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};
module.exports = { getAll, create, update, remove };