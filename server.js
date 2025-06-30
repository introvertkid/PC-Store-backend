import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import customerRoutes from "./routes/auth.routes.js";
import productRoutes from "./routes/product.routes.js";
import searchRoutes from "./routes/search.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "database/dbConfig.env") });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/customers", customerRoutes);
app.use("/api/products", productRoutes);
app.use("/api/search", searchRoutes);

app.get("/", (req, res) => {
  res.send("API works correctly");
});

app.listen(PORT, () => {
  console.log(`Server started on port: ${PORT}`);
});
