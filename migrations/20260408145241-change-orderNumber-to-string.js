"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Orders", "orderNumber", {
      type: Sequelize.STRING,
      allowNull: true, // Set to false if it's a required field
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.changeColumn("Orders", "orderNumber", {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  },
};
