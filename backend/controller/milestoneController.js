import Bid from "../schema/bid.js";
import projectinfo from "../schema/projectinfo.js";
import PersonMaster from "../schema/PersonMaster.js";

export default class MilestoneController {
    
    // Mark milestone as completed (by freelancer)
    async completeMilestone(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            // Only freelancers can mark milestones as completed
            if (userRole !== 'freelancer') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only freelancers can complete milestones." 
                });
            }

            const { project_id, milestone_index, completion_notes } = req.body;

            if (!project_id || milestone_index === undefined) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id and milestone_index are required" 
                });
            }

            // Get project and verify freelancer access
            const project = await projectinfo.findById(project_id)
                .populate('accepted_bid_id');
            
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            if (!project.accepted_bid_id || 
                project.accepted_bid_id.freelancer_id.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only complete milestones for your assigned projects" 
                });
            }

            const bid = project.accepted_bid_id;
            
            // Validate milestone index
            if (milestone_index >= bid.milestones.length || milestone_index < 0) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Invalid milestone index" 
                });
            }

            const milestone = bid.milestones[milestone_index];

            // Check if milestone is already completed
            if (milestone.is_completed === 1) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Milestone is already completed" 
                });
            }

            // Mark milestone as completed
            bid.milestones[milestone_index].is_completed = 1;
            bid.milestones[milestone_index].completed_at = new Date().toISOString();
            bid.milestones[milestone_index].completion_notes = completion_notes || '';
            
            await bid.save();

            // Milestone is now completed and waiting for client approval
            console.log(`✅ Milestone ${milestone_index} completed and waiting for client approval in project ${project_id}`);

            return res.status(200).json({
                status: true,
                message: "Milestone completed successfully. Waiting for client approval.",
                data: {
                    milestone_title: milestone.title,
                    completed_at: bid.milestones[milestone_index].completed_at,
                    payment_released: bid.milestones[milestone_index].payment_released === 1,
                    status: 'pending_approval'
                }
            });

        } catch (error) {
            console.error("Error completing milestone:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to complete milestone", 
                error: error.message 
            });
        }
    }

    // Approve milestone and release payment (by client)
    async approveMilestone(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            // Only clients can approve milestones
            if (userRole !== 'client') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only clients can approve milestones." 
                });
            }

            const { project_id, milestone_index } = req.body;

            if (!project_id || milestone_index === undefined) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id and milestone_index are required" 
                });
            }

            // Get project and verify client access
            const project = await projectinfo.findById(project_id)
                .populate('accepted_bid_id');
            
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            if (project.personid.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only approve milestones for your own projects" 
                });
            }

            const bid = project.accepted_bid_id;
            
            // Validate milestone index
            if (milestone_index >= bid.milestones.length || milestone_index < 0) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Invalid milestone index" 
                });
            }

            const milestone = bid.milestones[milestone_index];

            // Check if milestone is completed
            if (milestone.is_completed !== 1) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Milestone must be completed before approval" 
                });
            }

            // Check if payment already released
            if (milestone.payment_released === 1) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Payment for this milestone has already been released" 
                });
            }

            // Mark milestone as payment initiated (before actual payment processing)
            bid.milestones[milestone_index].payment_initiated = true;
            bid.milestones[milestone_index].payment_initiated_at = new Date().toISOString();
            await bid.save();

            console.log(`🔄 Payment initiated for milestone ${milestone_index} in project ${project_id}`);

            // Trigger payment release for approved milestone
            let paymentResult = null;
            try {
                const EscrowController = (await import('./escrowController.js')).default;
                const escrowController = new EscrowController();
                
                paymentResult = await escrowController.autoReleaseMilestonePayment(project_id, milestone_index);
                
                console.log(`🔍 Payment result from escrow controller:`, paymentResult);
                
                if (paymentResult.success) {
                    console.log(`✅ Payment released for approved milestone ${milestone_index} in project ${project_id}`);
                    
                    // Ensure milestone status is updated in database
                    // The escrow controller should have already updated this, but let's verify
                    const updatedProject = await projectinfo.findById(project_id)
                        .populate('accepted_bid_id');
                    const updatedBid = updatedProject.accepted_bid_id;
                    const updatedMilestone = updatedBid.milestones[milestone_index];
                    
                    console.log(`🔍 Milestone ${milestone_index} status after payment release:`, {
                        is_completed: updatedMilestone.is_completed,
                        payment_released: updatedMilestone.payment_released,
                        auto_released: updatedMilestone.auto_released
                    });
                    
                } else {
                    console.log(`⚠️ Payment release failed for milestone ${milestone_index} in project ${project_id}: ${paymentResult.message}`);
                    console.log(`🔍 Full payment result error:`, paymentResult);
                    
                    // Even if payment release fails, mark milestone as approved for manual processing
                    console.log(`🔄 Marking milestone ${milestone_index} as approved despite payment failure`);
                    
                    // Update milestone status to show it's approved but needs manual processing
                    const updatedProject = await projectinfo.findById(project_id)
                        .populate('accepted_bid_id');
                    const updatedBid = updatedProject.accepted_bid_id;
                    const updatedMilestone = updatedBid.milestones[milestone_index];
                    
                    // Mark as payment initiated and approved, but not released
                    updatedMilestone.payment_released = 0;
                    updatedMilestone.payment_initiated = true;
                    updatedMilestone.payment_initiated_at = new Date().toISOString();
                    updatedMilestone.manual_processing = true;
                    
                    await updatedBid.save();
                    
                    console.log(`✅ Milestone ${milestone_index} marked as approved for manual processing`);
                }
            } catch (paymentError) {
                console.error(`❌ Error releasing payment for milestone ${milestone_index} in project ${project_id}:`, paymentError);
                paymentResult = { success: false, message: paymentError.message };
            }

            return res.status(200).json({
                status: true,
                message: paymentResult.success ? "Milestone approved and payment released successfully" : "Milestone approved but payment requires manual processing",
                data: {
                    milestone_title: milestone.title,
                    approved_at: new Date().toISOString(),
                    payment_released: paymentResult.success,
                    payment_initiated: true,
                    manual_processing: !paymentResult.success,
                    payment_result: paymentResult
                }
            });

        } catch (error) {
            console.error("Error approving milestone:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to approve milestone", 
                error: error.message 
            });
        }
    }

    // Reject milestone (by client)
    async rejectMilestone(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            // Only clients can reject milestones
            if (userRole !== 'client') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only clients can reject milestones." 
                });
            }

            const { project_id, milestone_index } = req.body;

            if (!project_id || milestone_index === undefined) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id and milestone_index are required" 
                });
            }

            // Get project and verify client access
            const project = await projectinfo.findById(project_id)
                .populate('accepted_bid_id');
            
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            if (project.personid.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only reject milestones for your own projects" 
                });
            }

            const bid = project.accepted_bid_id;
            
            // Validate milestone index
            if (milestone_index >= bid.milestones.length || milestone_index < 0) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Invalid milestone index" 
                });
            }

            const milestone = bid.milestones[milestone_index];

            // Check if milestone is completed
            if (milestone.is_completed !== 1) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Only completed milestones can be rejected" 
                });
            }

            // Check if payment already released
            if (milestone.payment_released === 1) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Cannot reject milestone with released payment" 
                });
            }

            // Mark milestone as rejected (reset completion status)
            bid.milestones[milestone_index].is_completed = 0;
            bid.milestones[milestone_index].rejected_at = new Date().toISOString();
            bid.milestones[milestone_index].rejection_reason = 'Client rejected the milestone completion';
            
            await bid.save();

            console.log(`✅ Milestone ${milestone_index} rejected in project ${project_id}`);

            return res.status(200).json({
                status: true,
                message: "Milestone rejected successfully. Freelancer will be notified to make necessary changes.",
                data: {
                    milestone_title: milestone.title,
                    rejected_at: bid.milestones[milestone_index].rejected_at,
                    status: 'rejected'
                }
            });

        } catch (error) {
            console.error("Error rejecting milestone:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to reject milestone", 
                error: error.message 
            });
        }
    }

    // Modify milestone (by freelancer)
    async modifyMilestone(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            // Only freelancers can modify milestones
            if (userRole !== 'freelancer') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only freelancers can modify milestones." 
                });
            }

            const { project_id, milestone_index, title, description, due_date } = req.body;

            if (!project_id || milestone_index === undefined) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id and milestone_index are required" 
                });
            }

            // Get project and verify freelancer access
            const project = await projectinfo.findById(project_id)
                .populate('accepted_bid_id');
            
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            if (!project.accepted_bid_id || 
                project.accepted_bid_id.freelancer_id.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only modify milestones for your assigned projects" 
                });
            }

            const bid = project.accepted_bid_id;
            
            // Validate milestone index
            if (milestone_index >= bid.milestones.length || milestone_index < 0) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Invalid milestone index" 
                });
            }

            const milestone = bid.milestones[milestone_index];

            // Check if milestone is already completed
            if (milestone.is_completed === 1) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Cannot modify completed milestones" 
                });
            }

            // Update milestone fields
            if (title !== undefined) {
                bid.milestones[milestone_index].title = title;
            }
            if (description !== undefined) {
                bid.milestones[milestone_index].description = description;
            }
            if (due_date !== undefined) {
                bid.milestones[milestone_index].due_date = due_date;
            }
            
            bid.milestones[milestone_index].modified_at = new Date().toISOString();
            
            await bid.save();

            return res.status(200).json({
                status: true,
                message: "Milestone modified successfully",
                data: {
                    milestone_title: bid.milestones[milestone_index].title,
                    modified_at: bid.milestones[milestone_index].modified_at
                }
            });

        } catch (error) {
            console.error("Error modifying milestone:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to modify milestone", 
                error: error.message 
            });
        }
    }

    // Add new milestone (by freelancer)
    async addMilestone(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            // Only freelancers can add milestones
            if (userRole !== 'freelancer') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only freelancers can add milestones." 
                });
            }

            const { project_id, title, description, amount, due_date } = req.body;

            if (!project_id || !title || !amount) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id, title, and amount are required" 
                });
            }

            // Validate amount
            if (amount <= 0) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Amount must be greater than 0" 
                });
            }

            // Get project and verify freelancer access
            const project = await projectinfo.findById(project_id)
                .populate('accepted_bid_id');
            
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            if (!project.accepted_bid_id || 
                project.accepted_bid_id.freelancer_id.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only add milestones to your assigned projects" 
                });
            }

            const bid = project.accepted_bid_id;

            // Create new milestone
            const newMilestone = {
                title: title.trim(),
                description: description || '',
                amount: parseFloat(amount),
                due_date: due_date || '',
                is_completed: 0,
                payment_released: 0,
                created_at: new Date().toISOString()
            };

            bid.milestones.push(newMilestone);
            await bid.save();

            return res.status(201).json({
                status: true,
                message: "Milestone added successfully",
                data: {
                    milestone_title: newMilestone.title,
                    milestone_index: bid.milestones.length - 1
                }
            });

        } catch (error) {
            console.error("Error adding milestone:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to add milestone", 
                error: error.message 
            });
        }
    }

    // Remove milestone (by freelancer)
    async removeMilestone(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            // Only freelancers can remove milestones
            if (userRole !== 'freelancer') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only freelancers can remove milestones." 
                });
            }

            const { project_id, milestone_index } = req.body;

            if (!project_id || milestone_index === undefined) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id and milestone_index are required" 
                });
            }

            // Get project and verify freelancer access
            const project = await projectinfo.findById(project_id)
                .populate('accepted_bid_id');
            
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            if (!project.accepted_bid_id || 
                project.accepted_bid_id.freelancer_id.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only remove milestones from your assigned projects" 
                });
            }

            const bid = project.accepted_bid_id;
            
            // Validate milestone index
            if (milestone_index >= bid.milestones.length || milestone_index < 0) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Invalid milestone index" 
                });
            }

            const milestone = bid.milestones[milestone_index];

            // Check if milestone is completed or payment released
            if (milestone.is_completed === 1) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Cannot remove completed milestones" 
                });
            }

            if (milestone.payment_released === 1) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Cannot remove milestones with released payments" 
                });
            }

            // Remove milestone
            const removedMilestone = bid.milestones.splice(milestone_index, 1)[0];
            await bid.save();

            return res.status(200).json({
                status: true,
                message: "Milestone removed successfully",
                data: {
                    removed_milestone_title: removedMilestone.title
                }
            });

        } catch (error) {
            console.error("Error removing milestone:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to remove milestone", 
                error: error.message 
            });
        }
    }

    // Get project milestones
    async getProjectMilestones(req, res) {
        try {
            const { project_id } = req.body;
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            if (!project_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id is required" 
                });
            }

            const project = await projectinfo.findById(project_id)
                .populate('accepted_bid_id')
                .populate('personid', 'first_name last_name');

            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            // Check access permissions
            const isProjectOwner = project.personid._id.toString() === userId;
            const isFreelancer = project.accepted_bid_id && 
                project.accepted_bid_id.freelancer_id.toString() === userId;

            if (!isProjectOwner && !isFreelancer && userRole !== 'admin') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied" 
                });
            }

            const milestones = project.accepted_bid_id ? project.accepted_bid_id.milestones : [];
            
            const response = {
                project_id: project._id,
                project_title: project.title,
                milestones: milestones.map((milestone, index) => ({
                    index: index,
                    title: milestone.title,
                    description: milestone.description,
                    amount: milestone.amount,
                    due_date: milestone.due_date,
                    is_completed: milestone.is_completed,
                    completed_at: milestone.completed_at,
                    payment_released: milestone.payment_released,
                    payment_amount: milestone.payment_amount,
                    payment_released_at: milestone.payment_released_at,
                    completion_notes: milestone.completion_notes
                })),
                total_milestones: milestones.length,
                completed_milestones: milestones.filter(m => m.is_completed === 1).length,
                total_amount: milestones.reduce((sum, m) => sum + m.amount, 0),
                released_amount: milestones.reduce((sum, m) => sum + (m.payment_amount || 0), 0)
            };

            return res.status(200).json({
                status: true,
                message: "Project milestones fetched successfully",
                data: response
            });

        } catch (error) {
            console.error("Error fetching project milestones:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch project milestones", 
                error: error.message 
            });
        }
    }
}

