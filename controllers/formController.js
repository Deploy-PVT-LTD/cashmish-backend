import { Form } from "../models/formModel.js";
import { Mobile } from "../models/mobileModel.js";
import cloudinary from "../config/cloudinary.js";
import { calculatePrice } from "../utils/priceCalculator.js";
import streamifier from "streamifier";

//form controllers
export const createForm = async (req, res) => {
  try {
    let {
      userId,
      mobileId,
      storage,
      carrier,
      screenCondition,
      bodyCondition,
      batteryCondition,
      pickUpDetails
    } = req.body;

 if (typeof pickUpDetails === "string") {
      pickUpDetails = JSON.parse(pickUpDetails.trim());
    }

    if (!mobileId || !pickUpDetails) {
      return res.status(400).json({ message: "Required fields missing" });
    }

    const mobile = await Mobile.findById(mobileId);
    if (!mobile) {
      return res.status(404).json({ message: "Mobile not found" });
    }

    /* upload images */
   const imageUrls = [];

if (req.files && req.files.length > 0) {
  for (const file of req.files) {
    const uploaded = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: "reseller_forms" },
        (error, result) => {
          if (error) reject(error);
          else resolve(result);
        }
      );

      streamifier.createReadStream(file.buffer).pipe(stream);
    });

    imageUrls.push(uploaded.secure_url);
  }
}

    /* calculate price */
    const estimatedPrice = calculatePrice(mobile.basePrice, {
      storage,
      screen: screenCondition,
      body: bodyCondition,
      battery: batteryCondition
    });

    const form = await Form.create({
      userId,
      mobileId,
      storage,
      carrier,
      screenCondition,
      bodyCondition,
      batteryCondition,
      images: imageUrls,
      estimatedPrice,
      pickUpDetails
    });

    res.status(201).json(form);
  } catch (error) {
  console.error("CREATE FORM ERROR 👉", error);
  res.status(500).json({
    message: "Form creation failed",
    error: error.message,
    stack: error.stack
  });
}

};

//get all forms
export const getAllForms = async (req, res) => {
  try {
    const forms = await Form.find()
      .populate("mobileId")
      .populate("userId")
      .sort({ createdAt: -1 });

    res.json(forms);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch forms" });
  }
};

//get single form by id
export const getFormById = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id)
      .populate("mobileId")
      .populate("userId");

    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    res.json(form);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch form" });
  }
};

//update form
export const updateForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    const allowedFields = [
      "storage",
      "carrier",
      "screenCondition",
      "bodyCondition",
      "batteryCondition",
      "pickUpDetails",
      "status"
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        form[field] = req.body[field];
      }
    });

    /* recalc price if needed */
    if (
      req.body.storage ||
      req.body.screenCondition ||
      req.body.bodyCondition ||
      req.body.batteryCondition
    ) {
      const mobile = await Mobile.findById(form.mobileId);
      form.estimatedPrice = calculatePrice(mobile.basePrice, {
        storage: form.storage,
        screen: form.screenCondition,
        body: form.bodyCondition,
        battery: form.batteryCondition
      });
    }

    await form.save();
    res.json(form);
  } catch (error) {
    res.status(500).json({ message: "Form update failed" });
  }
};

//delete form
export const deleteForm = async (req, res) => {
  try {
    const form = await Form.findById(req.params.id);
    if (!form) {
      return res.status(404).json({ message: "Form not found" });
    }

    await form.deleteOne();
    res.json({ message: "Form deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Form delete failed" });
  }
};
