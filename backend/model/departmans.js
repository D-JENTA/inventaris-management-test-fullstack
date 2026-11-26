const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Department = sequelize.define("Department", {
    id_departmans: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "id"
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: "departmans",
    timestamps: false
});

module.exports = Department;