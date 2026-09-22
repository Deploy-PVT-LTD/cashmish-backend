import { Category } from "../models/categoryModel.js";

const slugify = (str) =>
    String(str)
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

// GET all ACTIVE categories, sorted for display (public — used by the customer site)
export const getCategories = async (req, res) => {
    try {
        const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch categories" });
    }
};

// GET all categories including inactive ones (admin)
export const getAllCategories = async (req, res) => {
    try {
        const categories = await Category.find().sort({ order: 1, name: 1 });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ message: "Failed to fetch categories" });
    }
};

// CREATE category (admin)
export const createCategory = async (req, res) => {
    try {
        const {
            name, icon, order,
            hasCarrierStep, carrierOptions,
            hasStorageStep, storageOptions,
            assessmentQuestions
        } = req.body;
        if (!name || !name.trim()) {
            return res.status(400).json({ message: "Category name is required" });
        }

        const slug = slugify(name);
        const existing = await Category.findOne({ slug });
        if (existing) {
            return res.status(400).json({ message: "A category with this name already exists" });
        }

        const category = await Category.create({
            name: name.trim(),
            slug,
            icon: icon || '',
            order: order ?? 0,
            hasCarrierStep: hasCarrierStep ?? false,
            carrierOptions: carrierOptions ?? [],
            hasStorageStep: hasStorageStep ?? false,
            storageOptions: storageOptions ?? [],
            assessmentQuestions: assessmentQuestions ?? []
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ message: "Failed to create category" });
    }
};

// UPDATE category (admin)
export const updateCategory = async (req, res) => {
    try {
        const updates = {};
        const {
            name, icon, order, isActive,
            hasCarrierStep, carrierOptions,
            hasStorageStep, storageOptions,
            assessmentQuestions
        } = req.body;

        if (name !== undefined) {
            updates.name = name.trim();
            updates.slug = slugify(name);
        }
        if (icon !== undefined) updates.icon = icon;
        if (order !== undefined) updates.order = order;
        if (isActive !== undefined) updates.isActive = isActive;
        if (hasCarrierStep !== undefined) updates.hasCarrierStep = hasCarrierStep;
        if (carrierOptions !== undefined) updates.carrierOptions = carrierOptions;
        if (hasStorageStep !== undefined) updates.hasStorageStep = hasStorageStep;
        if (storageOptions !== undefined) updates.storageOptions = storageOptions;
        if (assessmentQuestions !== undefined) updates.assessmentQuestions = assessmentQuestions;

        const category = await Category.findByIdAndUpdate(req.params.id, updates, { new: true });
        if (!category) return res.status(404).json({ message: "Category not found" });

        res.json(category);
    } catch (error) {
        res.status(500).json({ message: "Failed to update category" });
    }
};

// DELETE category (admin)
export const deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByIdAndDelete(req.params.id);
        if (!category) return res.status(404).json({ message: "Category not found" });
        res.json({ message: "Category deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Failed to delete category" });
    }
};
