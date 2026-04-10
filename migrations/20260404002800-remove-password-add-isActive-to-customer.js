"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.removeColumn("Customers", "password");
    await queryInterface.addColumn("Customers", "isActive", {
      type: Sequelize.BOOLEAN,
      defaultValue: true,
      allowNull: false,
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn("Customers", "password", {
      type: Sequelize.STRING,
    });
    await queryInterface.removeColumn("Customers", "isActive");
  },
};
