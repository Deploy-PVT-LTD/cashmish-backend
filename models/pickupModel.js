import mongoose from "mongoose";

const pickUpDetailsSchema = new mongoose.Schema(
    {
        fullName: {
        type: String,
        required: true,
      },
      phoneNumber: {
        type: String,
        required: true,
      },
      email:{
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
    },{timestamps:true}
);

export const PickUpDetails = mongoose.model('PickUpDetails', pickUpDetailsSchema);