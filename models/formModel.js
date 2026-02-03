import mongoose from "mongoose";

const formSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    pickUpDetails: {
      fullName: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      address: {
        addressText: {
          type: String,
          required: true,
        },
        location: {
          type: {
            type: String,
            enum: ["Point"],
            default: "Point",
          },
          coordinates: {
            type: [Number], // [lng, lat]
            required: true,
          },
        },
      },
      pickUpDate: {
        type: Date,
        required: true,
      },
      timeSlot:{
        type:String,
        required:true,
        enum: [
          "9:00 AM - 11:00 AM",
          "11:00 AM - 1:00 PM",
          "2:00 PM - 4:00 PM",
          "4:00 PM - 6:00 PM"
        ]
      }
    },
    mobileId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Mobile",
      required: true,
    },

    storage: {
      type: String,
      enum: ["32GB", "64GB", "128GB", "256GB", "512GB", "1TB", "2TB"],
      required: true,
    },

    carrier: {
      type: String,
      required: true,
      trim: true,
    },
    screenCondition: {
      type: String,
      enum: ["perfect", "scratched", "cracked"],
      required: true,
    },

    bodyCondition: {
      type: String,
      enum: ["perfect", "scratched", "damaged"],
      required: true,
    },

    batteryCondition: {
      type: String,
      enum: ["good", "average", "poor"],
      required: true,
    },

    images: {
      type: [String],
    },

    estimatedPrice: {
      type: Number,
    },

    status: {
      type: String,
      default: "pending",
    },
  },
  { timestamps: true },
);

export const Form = mongoose.model("Form", formSchema);