"use strict";
const { Model } = require("sequelize");
module.exports = (sequelize, DataTypes) => {
  class Products extends Model {
    /**
     * Helper method for defining associations.
     * This method is not a part of Sequelize lifecycle.
     * The `models/index` file will call this method automatically.
     */
    static associate(models) {
      // define association here
      Products.belongsTo(models.category, {
        foreignKey: "categoryId",
        as: "category",
      });
      Products.hasMany(models.ProductImage, {
        foreignKey: "productId",
        as: "productImages",
      });
    }
  }
  Products.init(
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: DataTypes.STRING,
      description: DataTypes.STRING,
      color: DataTypes.STRING,
      price: DataTypes.DECIMAL,
      qty: DataTypes.INTEGER,
      categoryId: DataTypes.INTEGER,
      isActive: DataTypes.BOOLEAN,
    },
    {
      sequelize,
      modelName: "Products",
    },
  );
  return Products;
};
