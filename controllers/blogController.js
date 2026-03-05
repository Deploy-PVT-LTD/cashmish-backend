import Blog from '../models/blogModel.js';

// Get published blogs (Public)
export const getPublishedBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find({ status: 'published' }).sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

import mongoose from 'mongoose';

// Helper to generate slug from string
const generateSlug = (title) => {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)+/g, '');
};

// Get single blog by ID or Slug (Public)
export const getBlogById = async (req, res) => {
    try {
        const { id } = req.params;
        let blog;

        if (mongoose.isValidObjectId(id)) {
            blog = await Blog.findById(id);
        }
        if (!blog) {
            blog = await Blog.findOne({ slug: id });
        }

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        res.json(blog);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Get all blogs (Admin)
export const getAllBlogs = async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json(blogs);
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Create a new blog (Admin)
export const createBlog = async (req, res) => {
    try {
        const { title, excerpt, content, author, image, status, slug: customSlug } = req.body;

        let slug = customSlug ? generateSlug(customSlug) : generateSlug(excerpt);
        // Make sure slug is unique
        let existing = await Blog.findOne({ slug });
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }

        const newBlog = await Blog.create({
            title,
            slug,
            excerpt,
            content,
            author,
            image,
            status: status || 'draft',
        });

        res.status(201).json({ message: 'Blog created successfully', blog: newBlog });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Update a blog (Admin)
export const updateBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const updates = { ...req.body };

        if (updates.slug) {
            updates.slug = generateSlug(updates.slug);
        } else if (updates.excerpt) {
            updates.slug = generateSlug(updates.excerpt);
        }

        if (updates.slug) {
            let existing = await Blog.findOne({ slug: updates.slug, _id: { $ne: id } });
            if (existing) {
                updates.slug = `${updates.slug}-${Date.now()}`;
            }
        }

        const updatedBlog = await Blog.findByIdAndUpdate(id, updates, { new: true });

        if (!updatedBlog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.json({ message: 'Blog updated successfully', blog: updatedBlog });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Delete a blog (Admin)
export const deleteBlog = async (req, res) => {
    try {
        const { id } = req.params;
        const deletedBlog = await Blog.findByIdAndDelete(id);

        if (!deletedBlog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        res.json({ message: 'Blog deleted successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error: error.message });
    }
};
