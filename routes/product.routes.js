import express from "express";
import * as productController from "../controllers/product.controller.js";

const router = express.Router();

// Lấy tất cả sản phẩm
router.get("/", productController.getAllProducts);

// Lọc sản phẩm theo giá
router.get("/filter-by-price", productController.filterProductsByPrice);

// Lọc sản phẩm nâng cao (nhiều tiêu chí)
router.get("/advanced-filter", productController.advancedFilterProducts);

// Lấy sản phẩm phổ biến
router.get("/popular", productController.getPopularProducts);

// Lấy sản phẩm mới nhất
router.get("/latest", productController.getLatestProducts);

// Lấy sản phẩm nổi bật (random)
router.get("/featured", productController.getFeaturedProducts);

// Lấy chi tiết sản phẩm theo ID (phải đặt cuối cùng)
router.get("/:id", productController.getProductById);

export default router;
