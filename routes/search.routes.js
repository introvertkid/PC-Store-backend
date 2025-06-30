import express from "express";
import * as searchController from "../controllers/search.controller.js";

const router = express.Router();

router.get("/", searchController.elasticSearch);

export default router;