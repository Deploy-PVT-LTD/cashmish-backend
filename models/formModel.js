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

      // No longer collected — the flow moved from "we pick it up" to "you ship it
      // to us with a free prepaid USPS label" (see paymentMethod/label fields
      // below). Kept optional (not required) so old submissions that DO have
      // these still read back fine.
      pickUpDate: { type: Date },
      timeSlot: {
        type: String,
        enum: [
          "9:00 AM - 11:00 AM",
          "11:00 AM - 1:00 PM",
          "2:00 PM - 4:00 PM",
          "4:00 PM - 6:00 PM",
        ],
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

    // Letter grade (A-F) the system derived from conditionAnswers — see
    // utils/priceCalculator.js#computeGrade. Not required: older forms submitted
    // before grade-based pricing existed simply won't have one.
    grade: { type: String },

    // Legacy mirrors of conditionAnswers.screen/body/battery — kept optional (not
    // every category has these specific questions) so older admin pages/exports that
    // read them directly keep working for Mobile Phones without any changes.
    screenCondition: { type: String },
    bodyCondition: { type: String },
    batteryCondition: { type: String },

    images: [String],

    estimatedPrice: Number,
    // Internally still "bidPrice" (unchanged DB field, avoids a data migration) —
    // every customer/admin-facing surface calls this the "Counter Offer".
    bidPrice: { type: Number, default: 0 },

    status: { type: String, default: "pending" },

    // ── How the customer wants to be paid — chosen right after "Confirm Pickup",
    // before the submission ever reaches the admin review queue. ──────────────
    paymentMethod: { type: String, enum: ["zelle", "bank"] },
    zelleDetails: {
      contact: { type: String }, // email or phone, per contactType
      contactType: { type: String, enum: ["email", "phone"] },
    },
    bankAccountDetails: {
      accountHolderName: { type: String },
      routingNumber: { type: String },
      accountNumber: { type: String },
      accountType: { type: String, enum: ["checking", "savings"] },
    },

    // ── Counter-offer negotiation & shipping (admin side) ──────────────────────
    // 'none' — no counter offer set yet.
    // 'matches_estimate' — admin's price equalled the system estimate; customer
    //   was simply notified (no acceptance needed).
    // 'pending_acceptance' — admin's price differs; waiting on the customer to
    //   accept via the emailed link.
    // 'accepted' — customer accepted a differing counter offer.
    counterOfferStatus: {
      type: String,
      enum: ["none", "matches_estimate", "pending_acceptance", "accepted"],
      default: "none",
    },
    // Secret token embedded in the "accept this offer" email link — looked up
    // with no login required, so it must be unguessable.
    counterOfferToken: { type: String },
    counterOfferRespondedAt: { type: Date },
    // Flips to false the moment a customer accepts a differing counter offer,
    // so the admin Submissions page can pop up their bank/Zelle details once —
    // set back to true once the admin has seen it.
    acceptanceSeenByAdmin: { type: Boolean, default: true },

    // Admin-uploaded (manually, from an outside USPS account) prepaid return
    // shipping label — number for the tracking link, PDF for the customer to
    // print and use.
    uspsLabelNumber: { type: String },
    uspsLabelUrl: { type: String },

    submissionId: { type: Number, unique: true, sparse: true },
    isDeleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const Form = mongoose.model("Form", formSchema);
