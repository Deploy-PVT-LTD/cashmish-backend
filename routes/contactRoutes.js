import { createContact, getAllContacts, getContactById, updateContactById, deleteContactById } from "../controllers/contactController";
import express from "express";

const router = express.Router();

router.post("/", createContact);
router.get("/", getAllContacts);
router.get("/:id", getContactById);
router.put("/:id", updateContactById);
router.delete("/:id", deleteContactById);

export default router;