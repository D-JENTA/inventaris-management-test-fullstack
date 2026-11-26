const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const User = sequelize.define("User", {
    id_user: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        field: "id"
    },
    username: {
        type: DataTypes.STRING(100),
        allowNull: false,
        field: "name"
    },
    password: {
        type: DataTypes.STRING(255),
        allowNull: false
    },
    id_departmans: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    position: {
        type: DataTypes.STRING(100),
        allowNull: false
    }
}, {
    tableName: "user_tb",
    timestamps: false
});

module.exports = User;