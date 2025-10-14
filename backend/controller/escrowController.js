import BankDetails from "../schema/bankDetails.js";
import Bid from "../schema/bid.js";
import projectinfo from "../schema/projectinfo.js";
import PersonMaster from "../schema/PersonMaster.js";
import PaymentHistory from "../schema/paymenthistory.js";
import razorpay from "../services/razorpay.js";

export default class EscrowController {
    
    // Create escrow payment for project
    async createEscrowPayment(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            // Only clients can create escrow payments
            if (userRole !== 'client') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only clients can create escrow payments." 
                });
            }

            const { project_id } = req.body;

            if (!project_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id is required" 
                });
            }

            // Get project and verify ownership
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
                    message: "You can only create escrow payments for your own projects" 
                });
            }

            // Check if project has accepted bid
            if (!project.accepted_bid_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Project must have an accepted bid to create escrow payment" 
                });
            }

            // Check if bid is in pending_payment status
            if (project.accepted_bid_id.status !== 'pending_payment') {
                return res.status(400).json({ 
                    status: false, 
                    message: "Bid must be in pending payment status to create escrow" 
                });
            }

            // Use final_amount from project (set during bid acceptance)
            const final_amount = project.final_project_amount;
            if (!final_amount || final_amount <= 0) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Project final amount not set or invalid" 
                });
            }

            // Check if escrow already exists and is active/completed
            if (project.escrow_amount && (project.escrow_status === 'pending' || project.escrow_status === 'completed')) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Escrow payment already exists for this project" 
                });
            }

            // If escrow exists but failed/cancelled, allow recreation
            if (project.escrow_amount && (project.escrow_status === 'failed' || project.escrow_status === 'not_created')) {
                console.log('Previous escrow was failed/cancelled, allowing recreation');
            }

            // Get freelancer's bank details
            const freelancerBankDetails = await BankDetails.findOne({
                user_id: project.accepted_bid_id.freelancer_id,
                is_active: 1,
                is_primary: 1
            });

            if (!freelancerBankDetails) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Freelancer must add bank details before creating escrow payment" 
                });
            }

            // Create Razorpay order for escrow
            const orderOptions = {
                amount: Math.round(final_amount * 100), // Convert to paise
                currency: 'INR',
                receipt: `escrow_${project_id.slice(-8)}_${Date.now().toString().slice(-8)}`, // Shortened receipt
                notes: {
                    project_id: project_id,
                    freelancer_id: project.accepted_bid_id.freelancer_id,
                    type: 'escrow_payment'
                }
            };

            const order = await razorpay.orders.create(orderOptions);

            // Update project with escrow information ONLY after successful order creation
            await projectinfo.findByIdAndUpdate(project_id, {
                escrow_amount: final_amount,
                escrow_order_id: order.id,
                escrow_status: 'pending',
                final_project_amount: final_amount,
                updatedAt: new Date().toISOString()
            });

            return res.status(201).json({
                status: true,
                message: "Escrow payment created successfully",
                data: {
                    order_id: order.id,
                    amount: order.amount,
                    currency: order.currency,
                    project_id: project_id
                }
            });

        } catch (error) {
            console.error("Error creating escrow payment:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to create escrow payment", 
                error: error.message 
            });
        }
    }

    // Verify escrow payment
    async verifyEscrowPayment(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            if (userRole !== 'client') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only clients can verify escrow payments." 
                });
            }

            const { project_id, payment_id, signature } = req.body;

            if (!project_id || !payment_id || !signature) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id, payment_id, and signature are required" 
                });
            }

            // Get project
            const project = await projectinfo.findById(project_id);
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            if (project.personid.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only verify escrow payments for your own projects" 
                });
            }

            // Verify Razorpay signature
            const crypto = await import('crypto');
            const generatedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(project.escrow_order_id + "|" + payment_id)
                .digest('hex');

            if (generatedSignature !== signature) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Invalid payment signature" 
                });
            }

            // Update project escrow status and activate project
            await projectinfo.findByIdAndUpdate(project_id, {
                escrow_status: 'completed',
                escrow_payment_id: payment_id,
                escrow_verified_at: new Date().toISOString(),
                status: 'in_progress', // Activate project
                ispending: 0, // Mark as no longer pending
                updatedAt: new Date().toISOString()
            });

            // Update bid status to accepted (from pending_payment)
            await Bid.findByIdAndUpdate(project.accepted_bid_id._id, {
                status: 'accepted',
                payment_completed_at: new Date().toISOString()
            });

            // Create payment history record
            await PaymentHistory.create({
                userId: userId,
                orderId: project.escrow_order_id,
                paymentId: payment_id,
                amount: project.escrow_amount,
                currency: 'INR',
                status: 'paid',
                createdAt: new Date()
            });

            // Notify client and freelancer that chat is enabled for this bid
            try {
                const { getIO } = await import('../services/socket.js');
                const io = getIO();
                const clientId = project.personid?.toString();
                const freelancerId = project.accepted_bid_id.freelancer_id?.toString();
                io.to(`user:${clientId}`).emit('chat:enabled', { bid_id: project.accepted_bid_id._id, project_id: project_id });
                io.to(`user:${freelancerId}`).emit('chat:enabled', { bid_id: project.accepted_bid_id._id, project_id: project_id });
            } catch (_) {
                // Socket may not be initialized in some environments; ignore
            }

            return res.status(200).json({
                status: true,
                message: "Escrow payment verified successfully. Project is now active!"
            });

        } catch (error) {
            console.error("Error verifying escrow payment:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to verify escrow payment", 
                error: error.message 
            });
        }
    }

    // Release milestone payment
    async releaseMilestonePayment(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            if (userRole !== 'client') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only clients can release milestone payments." 
                });
            }

            const { project_id, milestone_index } = req.body;

            if (!project_id || milestone_index === undefined) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id and milestone_index are required" 
                });
            }

            // Get project with accepted bid
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
                    message: "You can only release payments for your own projects" 
                });
            }

            // Check if escrow is completed
            if (project.escrow_status !== 'completed') {
                return res.status(400).json({ 
                    status: false, 
                    message: "Escrow payment must be completed before releasing milestone payments" 
                });
            }

            const bid = project.accepted_bid_id;
            if (!bid || !bid.milestones || milestone_index >= bid.milestones.length) {
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
                    message: "Milestone must be completed before releasing payment" 
                });
            }

            // Check if payment already released
            if (milestone.payment_released === 1) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Payment for this milestone has already been released" 
                });
            }

            // Use the milestone amount calculated during bid acceptance
            const paymentAmount = milestone.amount;
            
            // Validate payment amount
            if (!paymentAmount || paymentAmount <= 0) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Invalid milestone amount" 
                });
            }

            // Get freelancer's bank details
            const freelancerBankDetails = await BankDetails.findOne({
                user_id: bid.freelancer_id,
                is_active: 1,
                is_primary: 1
            });

            if (!freelancerBankDetails) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Freelancer bank details not found" 
                });
            }

            // Create payout to freelancer (using Razorpay Payouts API)
            const payoutData = {
                account_number: freelancerBankDetails.account_number,
                fund_account: {
                    account_type: "bank_account",
                    bank_account: {
                        name: freelancerBankDetails.account_holder_name,
                        ifsc: freelancerBankDetails.ifsc_code,
                        account_number: freelancerBankDetails.account_number
                    }
                },
                amount: Math.round(paymentAmount * 100), // Convert to paise
                currency: "INR",
                mode: "IMPS",
                purpose: "payout",
                queue_if_low_balance: true,
                reference_id: `milestone_${project_id}_${milestone_index}_${Date.now()}`,
                narration: `Milestone payment for project: ${project.title}`
            };

            const payout = await razorpay.payouts.create(payoutData);

            // Update milestone with payment information
            bid.milestones[milestone_index].payment_released = 1;
            bid.milestones[milestone_index].payment_amount = paymentAmount;
            bid.milestones[milestone_index].payment_id = payout.id;
            bid.milestones[milestone_index].payment_released_at = new Date().toISOString();
            
            await bid.save();

            // Create payment history record
            await PaymentHistory.create({
                userId: bid.freelancer_id,
                orderId: payout.reference_id,
                paymentId: payout.id,
                amount: paymentAmount,
                currency: 'INR',
                status: 'paid',
                createdAt: new Date()
            });

            return res.status(200).json({
                status: true,
                message: "Milestone payment released successfully",
                data: {
                    payout_id: payout.id,
                    amount: paymentAmount,
                    milestone_title: milestone.title
                }
            });

        } catch (error) {
            console.error("Error releasing milestone payment:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to release milestone payment", 
                error: error.message 
            });
        }
    }

    // Get escrow status for a project
    async getEscrowStatus(req, res) {
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

            const response = {
                project_id: project._id,
                project_title: project.title,
                escrow_amount: project.escrow_amount || 0,
                final_project_amount: project.final_project_amount || 0,
                escrow_status: project.escrow_status || 'not_created',
                milestones: project.accepted_bid_id ? project.accepted_bid_id.milestones : [],
                total_milestones: project.accepted_bid_id ? project.accepted_bid_id.milestones.length : 0,
                completed_milestones: project.accepted_bid_id ? 
                    project.accepted_bid_id.milestones.filter(m => m.is_completed === 1).length : 0,
                released_payments: project.accepted_bid_id ? 
                    project.accepted_bid_id.milestones.filter(m => m.payment_released === 1).length : 0
            };

            return res.status(200).json({
                status: true,
                message: "Escrow status fetched successfully",
                data: response
            });

        } catch (error) {
            console.error("Error fetching escrow status:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch escrow status", 
                error: error.message 
            });
        }
    }

    // Reset escrow status (for failed payments)
    async resetEscrowStatus(req, res) {
        try {
            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            if (userRole !== 'client') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only clients can reset escrow status." 
                });
            }

            const { project_id } = req.body;

            if (!project_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id is required" 
                });
            }

            // Get project and verify ownership
            const project = await projectinfo.findById(project_id);
            
            if (!project) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            if (project.personid.toString() !== userId) {
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only reset escrow status for your own projects" 
                });
            }

            // Only reset if status is pending (payment failed/cancelled)
            if (project.escrow_status === 'pending') {
                await projectinfo.findByIdAndUpdate(project_id, {
                    escrow_status: 'failed',
                    updatedAt: new Date().toISOString()
                });

                return res.status(200).json({
                    status: true,
                    message: "Escrow status reset successfully"
                });
            } else {
                return res.status(400).json({ 
                    status: false, 
                    message: "Cannot reset escrow status. Current status: " + project.escrow_status 
                });
            }

        } catch (error) {
            console.error("Error resetting escrow status:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to reset escrow status", 
                error: error.message 
            });
        }
    }

    // Automatic milestone payment release (called when milestone is completed)
    async autoReleaseMilestonePayment(projectId, milestoneIndex) {
        try {
            console.log(`🔄 Auto-releasing payment for project ${projectId}, milestone ${milestoneIndex}`);

            // Get project with accepted bid
            const project = await projectinfo.findById(projectId)
                .populate('accepted_bid_id');
            
            if (!project) {
                console.error(`❌ Project ${projectId} not found for auto-release`);
                return { success: false, message: "Project not found" };
            }

            // Check if escrow is completed
            if (project.escrow_status !== 'completed') {
                console.error(`❌ Escrow not completed for project ${projectId}`);
                return { success: false, message: "Escrow payment not completed" };
            }

            const bid = project.accepted_bid_id;
            if (!bid || !bid.milestones || milestoneIndex >= bid.milestones.length) {
                console.error(`❌ Invalid milestone index ${milestoneIndex} for project ${projectId}`);
                return { success: false, message: "Invalid milestone index" };
            }

            const milestone = bid.milestones[milestoneIndex];
            
            // Check if milestone is completed
            if (milestone.is_completed !== 1) {
                console.error(`❌ Milestone ${milestoneIndex} not completed for project ${projectId}`);
                return { success: false, message: "Milestone not completed" };
            }

            // Check if payment already released
            if (milestone.payment_released === 1) {
                console.log(`ℹ️ Payment already released for milestone ${milestoneIndex} in project ${projectId}`);
                return { success: true, message: "Payment already released" };
            }

            // Use the milestone amount calculated during bid acceptance
            const paymentAmount = milestone.amount;
            
            // Validate payment amount
            if (!paymentAmount || paymentAmount <= 0) {
                console.error(`❌ Invalid milestone amount ${paymentAmount} for project ${projectId}`);
                return { success: false, message: "Invalid milestone amount" };
            }

            // Get freelancer's bank details
            const freelancerBankDetails = await BankDetails.findOne({
                user_id: bid.freelancer_id,
                is_active: 1,
                is_primary: 1
            });

            if (!freelancerBankDetails) {
                console.error(`❌ Freelancer bank details not found for project ${projectId}`);
                return { success: false, message: "Freelancer bank details not found" };
            }

            // Create payout to freelancer (using Razorpay Payouts API)
            const payoutData = {
                account_number: freelancerBankDetails.account_number,
                fund_account: {
                    account_type: "bank_account",
                    bank_account: {
                        name: freelancerBankDetails.account_holder_name,
                        ifsc: freelancerBankDetails.ifsc_code,
                        account_number: freelancerBankDetails.account_number
                    }
                },
                amount: Math.round(paymentAmount * 100), // Convert to paise
                currency: "INR",
                mode: "IMPS",
                purpose: "payout",
                queue_if_low_balance: true,
                reference_id: `auto_milestone_${projectId}_${milestoneIndex}_${Date.now()}`,
                narration: `Auto milestone payment for project: ${project.title}`
            };

            const payout = await razorpay.payouts.create(payoutData);

            // Update milestone with payment information
            bid.milestones[milestoneIndex].payment_released = 1;
            bid.milestones[milestoneIndex].payment_amount = paymentAmount;
            bid.milestones[milestoneIndex].payment_id = payout.id;
            bid.milestones[milestoneIndex].payment_released_at = new Date().toISOString();
            bid.milestones[milestoneIndex].auto_released = true; // Mark as auto-released
            
            await bid.save();

            // Create payment history record
            await PaymentHistory.create({
                userId: bid.freelancer_id,
                orderId: payout.reference_id,
                paymentId: payout.id,
                amount: paymentAmount,
                currency: 'INR',
                status: 'paid',
                createdAt: new Date()
            });

            console.log(`✅ Auto-released payment for milestone ${milestoneIndex} in project ${projectId}: ₹${paymentAmount}`);

            return {
                success: true,
                message: "Milestone payment auto-released successfully",
                data: {
                    payout_id: payout.id,
                    amount: paymentAmount,
                    milestone_title: milestone.title
                }
            };

        } catch (error) {
            console.error(`❌ Error auto-releasing milestone payment for project ${projectId}, milestone ${milestoneIndex}:`, error);
            return { 
                success: false, 
                message: "Failed to auto-release milestone payment", 
                error: error.message 
            };
        }
    }
}

