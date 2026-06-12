const express = require("express");
const cors = require("cors");
const morgan = require("morgan");

const healthRouter = require("./routes/health");
const filesRouter = require("./routes/files");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

app.use(cors());
app.use(express.json());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));

app.use("/api/health", healthRouter);
app.use("/api/files", filesRouter);

app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
