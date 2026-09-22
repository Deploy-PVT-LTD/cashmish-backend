import mongoose from "mongoose";

const formSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },

    pickUpDetails: {
      fullName: { type: String, required: true },
      phoneNumber: { type: String, required: true },
      email: { type: String, required: true },
      address: {
        addressText: { type: String, required: true },
        location: {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point",
          },
          coordinates: {
            type: [Number],
            required: true,
          },
        },
      },

      pickUpDate: { type: Date, required: true },
      timeSlot: {
        type: String,
        enum: [
          "9:00 AM - 11:00 AM",
          "11:00 AM - 1:00 PM",
          "2:00 PM - 4:00 PM",
          "4:00 PM - 6:00 PM",
        ],
        required: true,
      },
    },

    mobileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mobile",
      required: true,
    },

    storage: { type: String },
    // Not every category has a carrier/lock-status step (only phones, by default).
    carrier: { type: String, default: '' },

    condition: { type: String, required: true },

    // Generic map of questionKey -> chosen optionKey, driven by the product's
    // category (Category.assessmentQuestions). Works for any category's question set.
    conditionAnswers: { type: mongoose.Schema.Types.Mixed, default: {} },

    // Legacy mirrors of conditionAnswers.screen/body/battery — kept optional (not
    // every category has these specific questions) so older admin pages/exports that
    // read them directly keep working for Mobile Phones without any changes.
    screenCondition: { type: String },
    bodyCondition: { type: String },
    batteryCondition: { type: String },

    images: [String],

    estimatedPrice: Number,
    bidPrice: { type: Number, default: 0 },

    status: { type: String, default: "pending" },

    submissionId: { type: Number, unique: true, sparse: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Form = mongoose.model("Form", formSchema);
