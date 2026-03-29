const { Products, category, ProductImage } = require("../../../models");
const { Op } = require("sequelize");
const getProducts = async (req, res) => {
  try {
    const search = String(req.query.search || "").trim();

    // Pagination params
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 10));
    const offset = (page - 1) * limit;

    const where = {};
    if (search) {
      where.name = { [Op.like]: `%${search}%` };
    }

    const { count, rows: products } = await Products.findAndCountAll({
      where,
      include: [
        { model: category, as: "category", attributes: ["id", "name"] },
        {
          model: ProductImage,
          as: "productImages",
          attributes: ["id", "productId", "fileName", "imageUrl"],
        },
      ],
      limit,
      offset,
      distinct: true, // important when using include
    });

    const totalPages = Math.ceil(count / limit);

    res.json({
      success: true,
      message: search
        ? "Products searched successfully"
        : "Products retrieved successfully",
      data: products,
      pagination: {
        total: count,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while fetching products",
    });
  }
};

// POST create new product
const createProduct = async (req, res) => {
  try {
    const {
      name,
      description,
      color,
      price,
      qty,
      categoryId,
      isActive = true,
    } = req.body;

    if (!name || !price || !qty) {
      return res.status(400).json({
        success: false,
        message: "Fields name, price, and qty are required",
      });
    }

    const newProduct = await Products.create({
      name,
      description,
      color,
      price,
      qty,
      categoryId,
      isActive,
    });

    res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while creating product",
    });
  }
};

// PUT update product by ID
const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      color,
      price,
      qty,
      categoryId,
      isActive = true,
    } = req.body || {};

    if (!name && !description && !color && !price && !qty) {
      return res.status(400).json({
        success: false,
        message:
          "At least one field (name, description, color, price, qty) is required to update a product",
      });
    }

    const findProduct = await Products.findByPk(id);
    if (!findProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    const updatedProduct = await findProduct.update({
      name,
      description,
      color,
      price,
      qty,
      categoryId,
      isActive,
    });

    res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while updating product",
    });
  }
};

// DELETE product by ID
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const findProduct = await Products.findByPk(id);
    if (!findProduct) {
      return res.status(404).json({
        success: false,
        message: `Product with ID ${id} not found`,
      });
    }

    await findProduct.destroy();

    res.json({
      success: true,
      message: `Product with ID ${id} deleted successfully`,
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error while deleting product",
    });
  }
};

module.exports = {
  getProducts,
  createProduct,
  updateProduct,
  deleteProduct,
};
