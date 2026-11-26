require("dotenv").config();
const express = require("express");
const sequelize = require("./config/db");
const cors = require("cors");
const app = express();
const PORT = process.env.PORT ;
const validateToken = require("./middleware/validateToken");
const authRoutes = require("./routes/auth");
const categoryRoutes = require("./routes/category");
const departmentRoutes = require("./routes/department");
const inventarisRoutes = require("./routes/inventaris");
const userRoutes = require("./routes/user");

require("./model")
app.use(cors());
app.use(express.json());


app.use("/api", authRoutes);
app.use("/api", validateToken);
app.use("/api", categoryRoutes);
app.use("/api", departmentRoutes);
app.use("/api", inventarisRoutes);
app.use("/api", userRoutes);

app.get("/", (req, res) => {
	res.json({ message: "Welcome to the application." });
});

sequelize.sync()


app.listen(PORT, () => {
	console.log(`Server is running on port ${PORT}.`);
	});