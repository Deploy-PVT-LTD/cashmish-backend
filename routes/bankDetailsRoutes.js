import { addBankDetails, getBankDetails, updateBankDetails, deleteBankDetails, getBankDetailsByUserId } from "../controllers/bankDetailsController.js";

const router = express.Router();

router.post("/", addBankDetails);
router.get("/", getBankDetails);
router.put("/:userId", updateBankDetails);
router.delete("/:userId", deleteBankDetails);
router.get("/:userId", getBankDetailsByUserId);

export default router;
