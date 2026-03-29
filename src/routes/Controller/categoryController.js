const db = require("../../../models");
const { category, Products } = db;

// GET /api/v1/categories
const getAll = async (req, res) => {
  try {
    const categories = await category.findAll({
      include: [{ model: Products, as: "products" }],
    });
    res.json({ success: true, message: "Categories retrieved successfully", data: categories });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/v1/categories
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

// PUT /api/v1/categories/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active = true } = req.body || {};

    if (!name) {
      return res.status(400).json({ success: false, message: "Category name is required" });
    }

    const found = await category.findByPk(id);
    if (!found) {
      return res.status(404).json({ success: false, message: `Category with ID ${id} not found` });
    }

    const updated = await found.update({ name, is_active });
    res.json({ success: true, message: "Category updated successfully", data: updated });
  } catch (error) {
    console.error("Error updating category:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// DELETE /api/v1/categories/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const found = await category.findByPk(id);
    if (!found) {
      return res.status(404).json({ success: false, message: `Category ${id} not found` });
    }
    await found.destroy();
    res.json({ success: true, message: `Category ${id} deleted successfully` });
  } catch (error) {
    console.error("Error deleting category:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { getAll, create, update, remove };