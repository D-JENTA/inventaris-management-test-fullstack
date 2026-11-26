const Department = require("./departmans");
const User = require("./user");
const Inventaris = require("./inventaris");
const Category = require("./category");

Department.hasMany(User, {
    foreignKey: "id_departmans",
    as: "users"
});
User.belongsTo(Department, {
    foreignKey: "id_departmans",
    as: "department"
});

User.hasMany(Inventaris, {
    foreignKey: "id_user",
    as: "inventaris"
});
Inventaris.belongsTo(User, {
    foreignKey: "id_user",
    as: "user"
});

Category.hasMany(Inventaris, {
    foreignKey: "id_category",
    as: "inventaris"
});
Inventaris.belongsTo(Category, {
    foreignKey: "id_category",
    as: "category"
});

module.exports = {
    Department,
    User,
    Inventaris,
    Category
};