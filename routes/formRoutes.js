import express from "express";
import passport from "passport";
import {
  createForm,
  getAllForms,
  updateForm,
  getFormById,
  deleteForm,
  getWalletBalance,
  getGuestWalletBalance,
  getDashboardStats,
  getEstimate,
  bridgeGuestOrders,
  shipLabel,
  markReceived,
  confirmMatchAndPay,
  setCounterOffer,
  resendCounterOfferEmail,
  markPaid,
  getOfferByToken,
  acceptCounterOffer,
  ackAcceptance,
} from "../controllers/formController.js";
import upload from "../middleware/upload.js";
import uploadLabel from "../middleware/uploadLabel.js";

const requireAuth = passport.authenticate("jwt", { session: false });

const router = express.Router();

router.get("/stats", getDashboardStats);
router.post("/estimate", getEstimate);

// Public — reached via the "accept this counter offer" email link, no login.
router.get("/offer/:token", getOfferByToken);
router.post("/offer/:token/accept", acceptCounterOffer);
const upload15 = upload.array("images", 15);
router.post("/", (req, res, next) => {
  upload15(req, res, function (err) {
    if (err) {
      // Catch multer errors (like file size limit or too many files)
      return res.status(400).json({ message: err.message });
    }
    next();
  });
}, createForm);
router.get("/", getAllForms);
router.get("/wallet-balance/:userId", getWalletBalance);
router.post("/guest-balance", getGuestWalletBalance);
router.post("/bridge", bridgeGuestOrders);

// Admin — submission lifecycle: ship label -> mark received -> either
// confirm-and-pay directly, or send a reasoned counter offer -> mark paid.
router.put("/:id/ship-label", requireAuth, uploadLabel.single("label"), shipLabel);
router.put("/:id/mark-received", requireAuth, markReceived);
router.put("/:id/confirm-paid", requireAuth, confirmMatchAndPay);
router.put("/:id/counter-offer", requireAuth, setCounterOffer);
router.put("/:id/resend-counter-offer", requireAuth, resendCounterOfferEmail);
router.put("/:id/mark-paid", requireAuth, markPaid);
router.put("/:id/ack-acceptance", requireAuth, ackAcceptance);

router.get("/:id", getFormById);
router.put("/:id", updateForm);
router.delete("/:id", deleteForm);

export default router;