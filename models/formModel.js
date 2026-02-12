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

    storage: { type: String, required: true },
    carrier: { type: String, required: true },

    condition: { type: String, required: true },

    screenCondition: { type: String, required: true },
    bodyCondition: { type: String, required: true },
    batteryCondition: { type: String, required: true },

    images: [String],

    estimatedPrice: Number,
    bidPrice: { type: Number, default: 0 },

    status: { type: String, default: "pending" },
  },
  { timestamps: true }
);

export const Form = mongoose.model("Form", formSchema);
