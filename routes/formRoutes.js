import express from "express";
import {
  createForm,
  getAllForms,
  getFormById,
  updateForm,
  deleteForm,
} from "../controllers/formController.js";

import upload from "../middleware/upload.js";

const router = express.Router();

router.post("/", upload.array("images", 5), createForm);
router.get("/", getAllForms);
router.get("/:id", getFormById);
router.put("/:id", updateForm);
router.delete("/:id", deleteForm);

export default router;
