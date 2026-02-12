import express from "express";
import passport from "passport";
import {
  signup,
  login,
  getUsers,
  getUserById,
  updateUserRole,
  deleteUser,
} from "../controllers/authController.js";
import jwt from "jsonwebtoken";
import keys from "../config/keys.js";

const router = express.Router();
// Google OAuth routes
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);

router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: "/login",
    session: false,
  }),
  (req, res) => {
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email },
      keys.jwtSecret,
      { expiresIn: "1h" },
    );
    res.json({ token, user: req.user });
  },
);
//local route
router.post("/signup", signup);
router.post("/login", login);
router.put("/:id", updateUserRole);
router.get("/", getUsers);
router.get("/:id", getUserById);
router.delete("/:id", deleteUser);

export default router;
