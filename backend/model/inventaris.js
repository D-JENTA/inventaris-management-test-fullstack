const { DataTypes } = require("sequelize");
const sequelize = require("../config/db");

const Inventaris = sequelize.define("Inventaris", {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING(100),
        allowNull: false
    },
    serial_number: {
        type: DataTypes.STRING(100),
        allowNull: false,
        unique: true
    },
    status: {
        type: DataTypes.ENUM("baik", "rusak", "dilelang", "tidak di pakai"),
        defaultValue: "tidak di pakai"
    },
    id_user: {
        type: DataTypes.INTEGER,
        allowNull: true 
    },
    id_category: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: "inventaris",
    timestamps: true 
});

module.exports = Inventaris;