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

            const { project_id, final_amount } = req.body;

            if (!project_id || !final_amount) {
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id and final_amount are required" 
                });
            }

            // Validate final amount
            if (final_amount <= 0) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Final amount must be greater than 0" 
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

            // Update project escrow status
            await projectinfo.findByIdAndUpdate(project_id, {
                escrow_status: 'completed',
                escrow_payment_id: payment_id,
                escrow_verified_at: new Date().toISOString(),
                updatedAt: new Date().toISOString()
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

            return res.status(200).json({
                status: true,
                message: "Escrow payment verified successfully"
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

            // Calculate payment amount based on milestone completion
            let paymentAmount = 0;
            const totalMilestones = bid.milestones.length;
            const completedMilestones = bid.milestones.filter(m => m.is_completed === 1).length;

            if (totalMilestones === 1) {
                // Single milestone - release 100%
                paymentAmount = project.final_project_amount;
            } else if (totalMilestones === 2) {
                // Two milestones - 30% for first, 70% for second
                if (milestone_index === 0) {
                    paymentAmount = project.final_project_amount * 0.3;
                } else {
                    paymentAmount = project.final_project_amount * 0.7;
                }
            } else if (totalMilestones === 3) {
                // Three milestones - 30% for first, 30% for second, 40% for third
                if (milestone_index === 0) {
                    paymentAmount = project.final_project_amount * 0.3;
                } else if (milestone_index === 1) {
                    paymentAmount = project.final_project_amount * 0.3;
                } else {
                    paymentAmount = project.final_project_amount * 0.4;
                }
            } else {
                // More than 3 milestones - equal distribution
                paymentAmount = project.final_project_amount / totalMilestones;
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
}

