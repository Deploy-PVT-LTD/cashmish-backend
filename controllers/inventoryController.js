import { Inventory } from "../models/inventoryModel.js";

// Create inventory item
export const createInventoryItem = async (req, res) => {
  try {
    const { phoneModel, storage, purchasePrice, purchaseDate, condition, source, notes, imeiNumber, status } = req.body;
    const inventoryItem = await Inventory.create({
      phoneModel,
        storage,
        purchasePrice,
        purchaseDate,
        condition,
        source,
        notes,
        imeiNumber,
        status
    });
    
    res.status(201).json(inventoryItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to create inventory item", error });
  }
};
// Get all inventory items
export const getAllInventoryItems = async (req, res) => {
  try {
    const inventoryItems = await Inventory.find().sort({ createdAt: -1 });
    res.json(inventoryItems);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventory items", error });
  } 
};
// Get single inventory item by ID
export const getInventoryItemById = async (req, res) => {
  try {
    const inventoryItem = await Inventory.findById(req.params.id);
    if (!inventoryItem) {
      return res.status(404).json({ message: "Inventory item not found" });
    }
    res.json(inventoryItem);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch inventory item", error });
  }
};
// Update inventory item by ID
export const updateInventoryItemById = async (req, res) => {
    try {
        const { phoneModel, storage, purchasePrice, purchaseDate, condition, source, notes, imeiNumber, status } = req.body;
        const inventoryItem = await Inventory.findByIdAndUpdate(
            req.params.id,
            { phoneModel, storage, purchasePrice, purchaseDate, condition, source, notes, imeiNumber, status },
            { new: true },
        );
        if (!inventoryItem) {
            return res.status(404).json({ message: "Inventory item not found" });
        }
        res.json(inventoryItem);
    } catch (error) {
        res.status(500).json({ message: "Failed to update inventory item", error });
    }   
};
// Delete inventory item by ID
export const deleteInventoryItemById = async (req, res) => {
    try {
        const inventoryItem = await Inventory.findByIdAndDelete(req.params.id);
        if (!inventoryItem) {
            return res.status(404).json({ message: "Inventory item not found" });
        }
        res.json({ message: "Inventory item deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete inventory item", error });
    }
};

