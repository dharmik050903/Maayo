import Review from "../schema/review.js";
import projectinfo from "../schema/projectinfo.js";
import PersonMaster from "../schema/PersonMaster.js";

export default class ReviewController {
    // Create a new review
    async createReview(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            // Only clients and freelancers ca n create reviews
            if (!['client', 'freelancer'].includes(userRole)) {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only clients and freelancers can create reviews." 
                });
            }

            const { 
                project_id, 
                reviewee_id, 
                rating, 
                comment, 
                communication_rating, 
                quality_rating, 
                timeliness_rating, 
                professionalism_rating 
            } = req.body;

            // Validate required fields
            if (!project_id || !reviewee_id || !rating || !comment) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Missing required fields: project_id, reviewee_id, rating, comment" 
                });
            }

            // Validate rating
            if (rating < 1 || rating > 5) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Rating must be between 1 and 5" 
                });
            }

            // Check if project exists and is completed
            const project = await projectinfo.findById(project_id);
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            if (project.iscompleted !== 1) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Reviews can only be created for completed projects" 
                });
            }

            // Check if user is involved in the project
            const isClient = project.personid.toString() === userId;
            const isFreelancer = project.freelancerid.some(f => f.freelancerid.toString() === userId);

            if (!isClient && !isFreelancer) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only review projects you are involved in" 
                });
            }

            // Determine reviewer and reviewee types
            let reviewerType, revieweeType;
            if (userRole === 'client') {
                reviewerType = 'client';
                revieweeType = 'freelancer';
            } else {
                reviewerType = 'freelancer';
                revieweeType = 'client';
            }

            // Check if user already reviewed this project
            const existingReview = await Review.findOne({
                project_id,
                reviewer_id: userId
            });

            if (existingReview) {
                return res.status(400).json({ 
                    status: false, 
                    message: "You have already reviewed this project" 
                });
            }

            // Create the review
            const newReview = new Review({
                project_id,
                reviewer_id: userId,
                reviewee_id,
                reviewer_type: reviewerType,
                reviewee_type: revieweeType,
                rating,
                comment,
                communication_rating: communication_rating || rating,
                quality_rating: quality_rating || rating,
                timeliness_rating: timeliness_rating || rating,
                professionalism_rating: professionalism_rating || rating
            });

            await newReview.save();

            // Update project review status
            if (userRole === 'client') {
                await projectinfo.findByIdAndUpdate(project_id, { client_reviewed: 1 });
            } else {
                await projectinfo.findByIdAndUpdate(project_id, { freelancer_reviewed: 1 });
            }

            return res.status(201).json({ 
                status: true, 
                message: "Review created successfully", 
                data: newReview 
            });

        } catch (error) {
            console.error("Error creating review:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to create review", 
                error: error.message 
            });
        }
    }

    // Get reviews for a specific user
    async getUserReviews(req, res) {
        try {
            const { user_id, user_type, page, limit } = req.body || {};

            if (!user_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "user_id is required" 
                });
            }

            const pageNum = Math.max(parseInt(page || 1, 10), 1);
            const limitNum = Math.max(parseInt(limit || 20, 10), 1);
            const skipNum = (pageNum - 1) * limitNum;

            const filter = { reviewee_id: user_id, is_public: 1 };
            if (user_type) {
                filter.reviewee_type = user_type;
            }

            const [reviews, total] = await Promise.all([
                Review.find(filter)
                    .populate('project_id', 'title description')
                    .populate('reviewer_id', 'first_name last_name profile_pic')
                    .skip(skipNum)
                    .limit(limitNum)
                    .sort({ createdAt: -1 }),
                Review.countDocuments(filter)
            ]);

            // Calculate average ratings
            const avgRatings = await Review.aggregate([
                { $match: filter },
                {
                    $group: {
                        _id: null,
                        avgRating: { $avg: "$rating" },
                        avgCommunication: { $avg: "$communication_rating" },
                        avgQuality: { $avg: "$quality_rating" },
                        avgTimeliness: { $avg: "$timeliness_rating" },
                        avgProfessionalism: { $avg: "$professionalism_rating" },
                        totalReviews: { $sum: 1 }
                    }
                }
            ]);

            return res.status(200).json({
                status: true,
                message: "Reviews fetched successfully",
                data: reviews,
                averageRatings: avgRatings[0] || {
                    avgRating: 0,
                    avgCommunication: 0,
                    avgQuality: 0,
                    avgTimeliness: 0,
                    avgProfessionalism: 0,
                    totalReviews: 0
                },
                pagination: { total, page: pageNum, limit: limitNum }
            });

        } catch (error) {
            console.error("Error fetching reviews:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch reviews", 
                error: error.message 
            });
        }
    }

    // Get reviews for a specific project
    async getProjectReviews(req, res) {
        try {
            const { project_id } = req.body;

            if (!project_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id is required" 
                });
            }

            const reviews = await Review.find({ 
                project_id, 
                is_public: 1 
            })
            .populate('reviewer_id', 'first_name last_name profile_pic user_type')
            .populate('reviewee_id', 'first_name last_name profile_pic user_type')
            .sort({ createdAt: -1 });

            return res.status(200).json({
                status: true,
                message: "Project reviews fetched successfully",
                data: reviews
            });

        } catch (error) {
            console.error("Error fetching project reviews:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch project reviews", 
                error: error.message 
            });
        }
    }

    // Update a review (only by the reviewer)
    async updateReview(req, res) {
        try {
            const userId = req.headers.id;
            const { review_id, rating, comment, communication_rating, quality_rating, timeliness_rating, professionalism_rating } = req.body;

            if (!review_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "review_id is required" 
                });
            }

            const review = await Review.findById(review_id);
            if (!review) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Review not found" 
                });
            }

            if (review.reviewer_id.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only update your own reviews" 
                });
            }

            const updateData = { updatedAt: new Date().toISOString() };
            if (rating !== undefined) updateData.rating = rating;
            if (comment !== undefined) updateData.comment = comment;
            if (communication_rating !== undefined) updateData.communication_rating = communication_rating;
            if (quality_rating !== undefined) updateData.quality_rating = quality_rating;
            if (timeliness_rating !== undefined) updateData.timeliness_rating = timeliness_rating;
            if (professionalism_rating !== undefined) updateData.professionalism_rating = professionalism_rating;

            const updatedReview = await Review.findByIdAndUpdate(
                review_id,
                updateData,
                { new: true }
            ).populate('project_id', 'title')
             .populate('reviewer_id', 'first_name last_name')
             .populate('reviewee_id', 'first_name last_name');

            return res.status(200).json({
                status: true,
                message: "Review updated successfully",
                data: updatedReview
            });

        } catch (error) {
            console.error("Error updating review:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to update review", 
                error: error.message 
            });
        }
    }

    // Delete a review (only by the reviewer)
    async deleteReview(req, res) {
        try {
            const userId = req.headers.id;
            const { review_id } = req.body;

            if (!review_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "review_id is required" 
                });
            }

            const review = await Review.findById(review_id);
            if (!review) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Review not found" 
                });
            }

            if (review.reviewer_id.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only delete your own reviews" 
                });
            }

            await Review.findByIdAndDelete(review_id);

            return res.status(200).json({
                status: true,
                message: "Review deleted successfully"
            });

        } catch (error) {
            console.error("Error deleting review:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to delete review", 
                error: error.message 
            });
        }
    }
}

