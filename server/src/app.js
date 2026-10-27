import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import compression from "compression";

import productRoutes from "./routes/productRoutes.js";
import categoryRoutes from "./routes/categoryRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL?.replace(/\/$/, ""),
  credentials: true,
}));
app.use(compression());
app.use(express.json({ limit: "10kb" }));
app.use(morgan("dev"));

app.get("/health", (req, res) => res.json({ status: "ok" }));

app.use("/api/v1/products", productRoutes);
app.use("/api/v1/categories", categoryRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;