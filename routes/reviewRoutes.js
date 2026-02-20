import express from 'express';
import {
    submitReview,
    getApprovedReviews,
    getAllReviews,
    updateReviewStatus,
    deleteReview,
} from '../controllers/reviewController.js';

const router = express.Router();

// Public routes
router.post('/', submitReview);
router.get('/approved', getApprovedReviews);

// Admin routes (Protected logic can be added here if needed, currently open for simplicity as per existing pattern)
router.get('/all', getAllReviews);
router.put('/:id/status', updateReviewStatus);
router.delete('/:id', deleteReview);

export default router;
