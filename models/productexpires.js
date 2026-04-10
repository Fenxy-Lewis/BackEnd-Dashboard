"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class ProductExpires extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      ProductExpires.belongsTo(models.Products, {
        foreignKey: "productId",
        as: "product",
      });
    }
  }
  ProductExpires.init(
    {
      productId: DataTypes.INTEGER,
      expiryDate: DataTypes.DATE,
      batchNumber: DataTypes.STRING,
      isNotified: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "ProductExpires",
    },
  );
  return ProductExpires;
};
