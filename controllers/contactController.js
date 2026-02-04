import { Contact } from "../models/contactModel";

// Contact create message
export const createContact = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const contact = await Contact.create({
      name,
      email,
      subject,
      message,
    });

    res.status(201).json(contact);
  } catch (error) {
    res.status(500).json({ message: "Failed to create contact message" });
  }
};

// Get all contact messages
export const getAllContacts = async (req, res) => {
  try {
    const contacts = await Contact.find().sort({ createdAt: -1 });
    res.json(contacts);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contact messages" });
  }
};
// Get single contact message by ID
export const getContactById = async (req, res) => {
  try {
    const contact = await Contact.findById(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact message not found" });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch contact message" });
  }
};
// edit contact message by ID
export const updateContactById = async (req, res) => {
  try {
    const { name, email, subject, message } = req.body;
    const contact = await Contact.findByIdAndUpdate(
      req.params.id,
      { name, email, subject, message },
      { new: true },
    );
    if (!contact) {
      return res.status(404).json({ message: "Contact message not found" });
    }
    res.json(contact);
  } catch (error) {
    res.status(500).json({ message: "Failed to update contact message" });
  }
};
// Delete contact message by ID
export const deleteContactById = async (req, res) => {
  try {
    const contact = await Contact.findByIdAndDelete(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: "Contact message not found" });
    }
    res.json({ message: "Contact message deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete contact message" });
  }
};
