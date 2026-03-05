import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true,
    },
    slug: {
        type: String,
        unique: true,
        sparse: true
    },
    excerpt: {
        type: String,
        required: true,
    },
    content: {
        type: String,
        default: '',
    },
    author: {
        type: String,
        required: true,
    },
    image: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['draft', 'published'],
        default: 'draft',
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const Blog = mongoose.model('Blog', blogSchema);

export default Blog;
