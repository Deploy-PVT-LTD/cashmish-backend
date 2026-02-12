import { PickUpDetails } from "../models/pickupModel.js";

export const createPickUpDetails = async (req, res) => {
  try {
    const { fullName, phoneNumber, email, address, pickUpDate, timeSlot } = req.body;
    const newPickUpDetails = new PickUpDetails({
      fullName,
      phoneNumber,
      email,
        address,
        pickUpDate,
        timeSlot
    });
    const savedDetails = await newPickUpDetails.save();
    res.status(201).json(savedDetails);
  } catch (error) {
    res.status(500).json({ message: "Failed to create pick-up details" });
  }
};
export const getPickUpDetailsById = async (req, res) => {
  try {
    const pickUpDetails = await PickUpDetails.findById(req.params.id);
    if (!pickUpDetails) {
      return res.status(404).json({ message: "Pick-up details not found" });
    }

    res.json(pickUpDetails);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pick-up details" });
  }
};
export const getAllPickUpDetails = async (req, res) => {
  try {
    const pickUpDetailsList = await PickUpDetails.find().sort({ createdAt: -1 });
    res.json(pickUpDetailsList);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch pick-up details" });
  }
};
export const deletePickUpDetails = async (req, res) => {
  try {
    const deletedDetails = await PickUpDetails.findByIdAndDelete(req.params.id);
    if (!deletedDetails) {
      return res.status(404).json({ message: "Pick-up details not found" });
    }
    res.json({ message: "Pick-up details deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete pick-up details" });
  }
};
export const updatePickUpDetails = async (req, res) => {
  try {
    const updates = req.body;
    const updatedDetails = await PickUpDetails.findByIdAndUpdate(
        req.params.id,
        updates,
        { new: true }
    );
    if (!updatedDetails) {
        return res.status(404).json({ message: "Pick-up details not found" });  
    }
    res.json(updatedDetails);
  } catch (error) {
    res.status(500).json({ message: "Failed to update pick-up details" });
  }
};
 