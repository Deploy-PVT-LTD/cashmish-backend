import express from "express";
import passport from "passport";
import {
    getCategories,
    getAllCategories,
    createCategory,
    updateCategory,
    deleteCategory
} from "../controllers/categoryController.js";

const router = express.Router();
const requireAuth = passport.authenticate("jwt", { session: false });

// Public — active categories only (used by the customer site's category picker)
router.get("/", getCategories);

// Admin — full list including inactive
router.get("/all", requireAuth, getAllCategories);

router.post("/", requireAuth, createCategory);
router.put("/:id", requireAuth, updateCategory);
router.delete("/:id", requireAuth, deleteCategory);

export default router;
