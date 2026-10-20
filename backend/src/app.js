const express = require("express");
const cors = require("cors");
const dashboardRouter = require("./routes/dashboard");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/dashboard", dashboardRouter);

module.exports = app;