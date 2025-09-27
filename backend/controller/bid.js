import Bid from "../schema/bid.js";
import projectinfo from "../schema/projectinfo.js";
import PersonMaster from "../schema/PersonMaster.js";
import freelancerInfo from "../schema/freelancerInfo.js";
import { getIO } from "../services/socket.js";

export default class BidController {
    // Create a new bid
    async createBid(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            // Only freelancers can create bids
            if (userRole !== 'freelancer') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only freelancers can create bids." 
                });
            }

            const { 
                project_id, 
                bid_amount, 
                proposed_duration, 
                cover_letter, 
                milestones, 
                start_date, 
                availability_hours 
            } = req.body;

            // Validate required fields
            if (!project_id || !bid_amount || !proposed_duration || !cover_letter) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Missing required fields: project_id, bid_amount, proposed_duration, cover_letter" 
                });
            }

            // Validate bid amount
            if (bid_amount <= 0) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Bid amount must be greater than 0" 
                });
            }

            // Check if project exists and is open for bidding
            const project = await projectinfo.findById(project_id);
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            if (project.status !== 'open' || project.isactive !== 1) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Project is not open for bidding" 
                });
            }
 
            // Check if project has a bid deadline
            if (project.bid_deadline && new Date(project.bid_deadline) < new Date()) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Bid deadline has passed" 
                });
            }

            // Check if freelancer already bid on this project
            const existingBid = await Bid.findOne({
                project_id,
                freelancer_id: userId,
                status: { $in: ['pending', 'accepted'] }
            });

            if (existingBid) {
                return res.status(400).json({ 
                    status: false, 
                    message: "You have already submitted a bid for this project" 
                });
            }

            // Validate milestones if provided
            if (milestones && Array.isArray(milestones)) {
                for (const milestone of milestones) {
                    if (!milestone.title || !milestone.amount) {
                        return res.status(400).json({ 
                            status: false, 
                            message: "Each milestone must have title and amount" 
                        });
                    }
                }
            }

            // Create the bid
            const newBid = new Bid({
                project_id,
                freelancer_id: userId,
                bid_amount,
                proposed_duration,
                cover_letter,
                milestones: milestones || [],
                start_date,
                availability_hours: availability_hours || 40
            });

            await newBid.save();

            return res.status(201).json({ 
                status: true, 
                message: "Bid created successfully", 
                data: newBid 
            });

        } catch (error) {
            console.error("Error creating bid:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to create bid", 
                error: error.message 
            });
        }
    }

    // Get bids for a specific project
    async getProjectBids(req, res) {
        try {
            const { project_id, status, page, limit } = req.body || {};
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            if (!project_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id is required" 
                });
            }

            // Check if user has access to view bids for this project
            const project = await projectinfo.findById(project_id);
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            // Only project owner (client) or freelancers who bid can view bids
            const isProjectOwner = project.personid.toString() === userId;
            const hasBid = await Bid.findOne({ project_id, freelancer_id: userId });

            if (!isProjectOwner && !hasBid && userRole !== 'admin') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. You can only view bids for your own projects or your own bids." 
                });
            }

            const pageNum = Math.max(parseInt(page || 1, 10), 1);
            const limitNum = Math.max(parseInt(limit || 20, 10), 1);
            const skipNum = (pageNum - 1) * limitNum;

            const filter = { project_id };
            if (status) {
                filter.status = status;
            }

            const [bids, total] = await Promise.all([
                Bid.find(filter)
                    .populate('freelancer_id', 'first_name last_name profile_pic email')
                    .skip(skipNum)
                    .limit(limitNum)
                    .sort({ createdAt: -1 }),
                Bid.countDocuments(filter)
            ]);

            // Fetch freelancer info for each bid
            const bidsWithFreelancerInfo = await Promise.all(
                bids.map(async (bid) => {
                    const freelancerData = await freelancerInfo.findOne({ personId: bid.freelancer_id._id });
                    return {
                        ...bid.toObject(),
                        freelancer_info: freelancerData
                    };
                })
            );

            return res.status(200).json({
                status: true,
                message: "Bids fetched successfully",
                data: bidsWithFreelancerInfo,
                pagination: { total, page: pageNum, limit: limitNum }
            });

        } catch (error) {
            console.error("Error fetching project bids:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch project bids", 
                error: error.message 
            });
        }
    }

    // Get bids by a specific freelancer
    async getFreelancerBids(req, res) {
        try {
            const { freelancer_id, status, page, limit } = req.body || {};
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            // Use current user's ID if freelancer_id not provided
            const targetFreelancerId = freelancer_id || userId;

            // Only allow viewing own bids unless admin
            if (targetFreelancerId !== userId && userRole !== 'admin') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. You can only view your own bids." 
                });
            }

            const pageNum = Math.max(parseInt(page || 1, 10), 1);
            const limitNum = Math.max(parseInt(limit || 20, 10), 1);
            const skipNum = (pageNum - 1) * limitNum;

            const filter = { freelancer_id: targetFreelancerId };
            if (status) {
                filter.status = status;
            }

            const [bids, total] = await Promise.all([
                Bid.find(filter)
                    .populate('project_id', 'title description budget status')
                    .skip(skipNum)
                    .limit(limitNum)
                    .sort({ createdAt: -1 }),
                Bid.countDocuments(filter)
            ]);

            return res.status(200).json({
                status: true,
                message: "Freelancer bids fetched successfully",
                data: bids,
                pagination: { total, page: pageNum, limit: limitNum }
            });

        } catch (error) {
            console.error("Error fetching freelancer bids:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch freelancer bids", 
                error: error.message 
            });
        }
    }

    // Accept a bid (only by project owner)
    async acceptBid(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            // Only clients can accept bids
            if (userRole !== 'client') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only clients can accept bids." 
                });
            }

            const { bid_id } = req.body;

            if (!bid_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "bid_id is required" 
                });
            }

            const bid = await Bid.findById(bid_id).populate('project_id');
            if (!bid) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Bid not found" 
                });
            }

            // Check if user owns the project
            if (bid.project_id.personid.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only accept bids for your own projects" 
                });
            }

            // Check if bid is still pending
            if (bid.status !== 'pending') {
                return res.status(400).json({ 
                    status: false, 
                    message: "Bid is not pending" 
                });
            }

            // Check if project is still open
            if (bid.project_id.status !== 'open') {
                return res.status(400).json({ 
                    status: false, 
                    message: "Project is no longer open for bidding" 
                });
            }

            // Reject all other pending bids for this project
            await Bid.updateMany(
                { 
                    project_id: bid.project_id._id, 
                    _id: { $ne: bid_id }, 
                    status: 'pending' 
                },
                { 
                    status: 'rejected',
                    client_decision_date: new Date().toISOString()
                }
            );

            // Accept the selected bid
            await Bid.findByIdAndUpdate(bid_id, {
                status: 'accepted',
                client_decision_date: new Date().toISOString()
            });

            // Update project with accepted bid and freelancer
            await projectinfo.findByIdAndUpdate(bid.project_id._id, {
                status: 'in_progress',
                isactive: 1,
                ispending: 0,
                accepted_bid_id: bid_id,
                freelancerid: [{
                    freelancerid: bid.freelancer_id,
                    freelancername: '' // Will be populated when needed
                }]
            });

            // Notify client and freelancer that chat is enabled for this bid
            try {
                const io = getIO();
                const clientId = bid.project_id.personid?.toString();
                const freelancerId = bid.freelancer_id?.toString();
                io.to(`user:${clientId}`).emit('chat:enabled', { bid_id, project_id: bid.project_id._id });
                io.to(`user:${freelancerId}`).emit('chat:enabled', { bid_id, project_id: bid.project_id._id });
            } catch (_) {
                // Socket may not be initialized in some environments; ignore
            }

            return res.status(200).json({
                status: true,
                message: "Bid accepted successfully"
            });

        } catch (error) {
            console.error("Error accepting bid:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to accept bid", 
                error: error.message 
            });
        }
    }

    // Reject a bid (only by project owner)
    async rejectBid(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            // Only clients can reject bids
            if (userRole !== 'client') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only clients can reject bids." 
                });
            }

            const { bid_id, client_message } = req.body;

            if (!bid_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "bid_id is required" 
                });
            }

            const bid = await Bid.findById(bid_id).populate('project_id');
            if (!bid) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Bid not found" 
                });
            }

            // Check if user owns the project
            if (bid.project_id.personid.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only reject bids for your own projects" 
                });
            }

            // Check if bid is still pending
            if (bid.status !== 'pending') {
                return res.status(400).json({ 
                    status: false, 
                    message: "Bid is not pending" 
                });
            }

            // Reject the bid
            await Bid.findByIdAndUpdate(bid_id, {
                status: 'rejected',
                client_message: client_message || '',
                client_decision_date: new Date().toISOString()
            });

            return res.status(200).json({
                status: true,
                message: "Bid rejected successfully"
            });

        } catch (error) {
            console.error("Error rejecting bid:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to reject bid", 
                error: error.message 
            });
        }
    }

    // Withdraw a bid (only by the freelancer who created it)
    async withdrawBid(req, res) {
        try {
            const userId = req.headers.id;
            const { bid_id } = req.body;

            if (!bid_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "bid_id is required" 
                });
            }

            const bid = await Bid.findById(bid_id);
            if (!bid) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Bid not found" 
                });
            }

            // Check if user owns the bid
            if (bid.freelancer_id.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only withdraw your own bids" 
                });
            }

            // Check if bid is still pending
            if (bid.status !== 'pending') {
                return res.status(400).json({ 
                    status: false, 
                    message: "Bid cannot be withdrawn as it's not pending" 
                });
            }

            // Withdraw the bid
            await Bid.findByIdAndUpdate(bid_id, {
                status: 'withdrawn',
                updatedAt: new Date().toISOString()
            });

            return res.status(200).json({
                status: true,
                message: "Bid withdrawn successfully"
            });

        } catch (error) {
            console.error("Error withdrawing bid:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to withdraw bid", 
                error: error.message 
            });
        }
    }

    // Update a bid (only by the freelancer who created it, and only if pending)
    async updateBid(req, res) {
        try {
            const userId = req.headers.id;
            const { 
                bid_id, 
                bid_amount, 
                proposed_duration, 
                cover_letter, 
                milestones, 
                start_date, 
                availability_hours 
            } = req.body;

            if (!bid_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "bid_id is required" 
                });
            }

            const bid = await Bid.findById(bid_id);
            if (!bid) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Bid not found" 
                });
            }

            // Check if user owns the bid
            if (bid.freelancer_id.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only update your own bids" 
                });
            }

            // Check if bid is still pending
            if (bid.status !== 'pending') {
                return res.status(400).json({ 
                    status: false, 
                    message: "Bid cannot be updated as it's not pending" 
                });
            }

            const updateData = { updatedAt: new Date().toISOString() };
            if (bid_amount !== undefined) updateData.bid_amount = bid_amount;
            if (proposed_duration !== undefined) updateData.proposed_duration = proposed_duration;
            if (cover_letter !== undefined) updateData.cover_letter = cover_letter;
            if (milestones !== undefined) updateData.milestones = milestones;
            if (start_date !== undefined) updateData.start_date = start_date;
            if (availability_hours !== undefined) updateData.availability_hours = availability_hours;

            const updatedBid = await Bid.findByIdAndUpdate(
                bid_id,
                updateData,
                { new: true }
            ).populate('project_id', 'title description')
             .populate('freelancer_id', 'first_name last_name');

            return res.status(200).json({
                status: true,
                message: "Bid updated successfully",
                data: updatedBid
            });

        } catch (error) {
            console.error("Error updating bid:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to update bid", 
                error: error.message 
            });
        }
    }

    // Delete a bid (only by the freelancer who created it, and only if pending)
    async deleteBid(req, res) {
        try {
            const userId = req.headers.id;
            const { bid_id } = req.body;

            if (!bid_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "bid_id is required" 
                });
            }

            const bid = await Bid.findById(bid_id);
            if (!bid) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Bid not found" 
                });
            }

            // Check if user owns the bid
            if (bid.freelancer_id.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only delete your own bids" 
                });
            }

            // Check if bid is still pending (can't delete accepted/rejected bids)
            if (bid.status !== 'pending') {
                return res.status(400).json({ 
                    status: false, 
                    message: "Cannot delete bid - only pending bids can be deleted" 
                });
            }

            // Hard delete the bid
            await Bid.findByIdAndDelete(bid_id);

            return res.status(200).json({
                status: true,
                message: "Bid deleted successfully"
            });

        } catch (error) {
            console.error("Error deleting bid:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to delete bid", 
                error: error.message 
            });
        }
    }
}

