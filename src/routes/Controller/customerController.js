const db = require("../../../models");
const { Customer } = db;

// GET /api/v1/customers
const getAll = async (req, res) => {
  try {
    const customers = await Customer.findAll();
    res.json({
      success: true,
      message: "Customers retrieved successfully",
      data: customers,
    });
  } catch (error) {
    console.error("Error fetching customers:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// POST /api/v1/customers
const create = async (req, res) => {
  try {
    const { firstname, lastname, email, phone, password, username } = req.body;
    const newCustomer = await Customer.create({
      firstname,
      lastname,
      email,
      phone,
      password,
      username,
    });
    res.json({
      success: true,
      message: "Customer created successfully",
      data: newCustomer,
    });
  } catch (error) {
    console.error("Error creating customer:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// PUT /api/v1/customers/:id
const update = async (req, res) => {
  try {
    const { id } = req.params;
    const { firstname, lastname, email, phone, password, username } =
      req.body || {};

    if (!firstname && !lastname && !email && !phone && !password && !username) {
      return res
        .status(400)
        .json({ success: false, message: "At least one field is required" });
    }

    const found = await Customer.findByPk(id);
    if (!found) {
      return res
        .status(404)
        .json({ success: false, message: `Customer with ID ${id} not found` });
    }

    const updated = await found.update({
      firstname,
      lastname,
      email,
      phone,
      password,
      username,
    });
    res.json({
      success: true,
      message: "Customer updated successfully",
      data: updated,
    });
  } catch (error) {
    console.error("Error updating customer:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

// DELETE /api/v1/customers/:id
const remove = async (req, res) => {
  try {
    const { id } = req.params;
    const found = await Customer.findByPk(id);
    if (!found) {
      return res
        .status(404)
        .json({ success: false, message: `Customer ${id} not found` });
    }
    await found.destroy();
    res.json({ success: true, message: `Customer ${id} deleted successfully` });
  } catch (error) {
    console.error("Error deleting customer:", error);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};

module.exports = { getAll, create, update, remove };
