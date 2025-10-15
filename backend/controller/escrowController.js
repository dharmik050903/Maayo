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
            console.log('🔍 Starting milestone payment release process...');
            console.log('Request headers:', {
                user_role: req.headers.user_role,
                user_id: req.headers.id,
                user_email: req.headers.user_email
            });
            console.log('Request body:', req.body);

            const userRole = req.headers.user_role;
            const userId = req.headers.id;

            if (userRole !== 'client') {
                console.log('❌ Access denied: User role is not client');
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only clients can release milestone payments." 
                });
            }

            const { project_id, milestone_index } = req.body;

            if (!project_id || milestone_index === undefined) {
                console.log('❌ Missing required parameters:', { project_id, milestone_index });
                return res.status(400).json({ 
                    status: false, 
                    message: "project_id and milestone_index are required" 
                });
            }

            console.log('🔍 Fetching project with ID:', project_id);
            // Get project with accepted bid and freelancer details
            const project = await projectinfo.findById(project_id)
                .populate({
                    path: 'accepted_bid_id',
                    populate: {
                        path: 'freelancer_id',
                        model: 'tblpersonmaster'
                    }
                });
            
            if (!project) {
                console.log('❌ Project not found:', project_id);
                return res.status(404).json({ 
                    status: false, 
                    message: "Project not found" 
                });
            }

            console.log('✅ Project found:', {
                project_id: project._id,
                title: project.title,
                escrow_status: project.escrow_status,
                personid: project.personid,
                userId: userId
            });

            if (project.personid.toString() !== userId) {
                console.log('❌ User not authorized for this project');
                return res.status(403).json({ 
                    status: false, 
                    message: "You can only release payments for your own projects" 
                });
            }

            // Check if escrow is completed
            if (project.escrow_status !== 'completed') {
                console.log('❌ Escrow not completed. Current status:', project.escrow_status);
                return res.status(400).json({ 
                    status: false, 
                    message: "Escrow payment must be completed before releasing milestone payments" 
                });
            }

            const bid = project.accepted_bid_id;
            if (!bid) {
                console.log('❌ No accepted bid found for project');
                return res.status(400).json({ 
                    status: false, 
                    message: "No accepted bid found for this project" 
                });
            }

            console.log('✅ Accepted bid found:', {
                bid_id: bid._id,
                freelancer_id: bid.freelancer_id,
                milestones_count: bid.milestones ? bid.milestones.length : 0,
                milestone_index: milestone_index
            });

            if (!bid.milestones || milestone_index >= bid.milestones.length) {
                console.log('❌ Invalid milestone index:', {
                    milestone_index,
                    milestones_length: bid.milestones ? bid.milestones.length : 0
                });
                return res.status(400).json({ 
                    status: false, 
                    message: "Invalid milestone index" 
                });
            }

            const milestone = bid.milestones[milestone_index];
            console.log('✅ Milestone found:', {
                title: milestone.title,
                amount: milestone.amount,
                is_completed: milestone.is_completed,
                payment_released: milestone.payment_released
            });
            
            // Check if milestone is completed
            if (milestone.is_completed !== 1) {
                console.log('❌ Milestone not completed');
                return res.status(400).json({ 
                    status: false, 
                    message: "Milestone must be completed before releasing payment" 
                });
            }

            // Check if payment already released
            if (milestone.payment_released === 1) {
                console.log('❌ Payment already released for this milestone');
                return res.status(400).json({ 
                    status: false, 
                    message: "Payment for this milestone has already been released" 
                });
            }

            // Use the milestone amount calculated during bid acceptance
            const paymentAmount = milestone.amount;
            
            // Validate payment amount
            if (!paymentAmount || paymentAmount <= 0) {
                console.log('❌ Invalid milestone amount:', paymentAmount);
                return res.status(400).json({ 
                    status: false, 
                    message: "Invalid milestone amount" 
                });
            }

            console.log('🔍 Fetching freelancer bank details for user:', bid.freelancer_id);
            // Get freelancer's bank details
            const freelancerBankDetails = await BankDetails.findOne({
                user_id: bid.freelancer_id,
                is_active: 1,
                is_primary: 1
            });

            if (!freelancerBankDetails) {
                console.log('❌ Freelancer bank details not found for user:', bid.freelancer_id);
                return res.status(400).json({ 
                    status: false, 
                    message: "Freelancer bank details not found" 
                });
            }

            console.log('✅ Freelancer bank details found:', {
                account_holder_name: freelancerBankDetails.account_holder_name,
                account_number: freelancerBankDetails.account_number,
                ifsc_code: freelancerBankDetails.ifsc_code
            });

            // Validate Razorpay configuration
            if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
                console.log('❌ Razorpay configuration missing');
                return res.status(500).json({ 
                    status: false, 
                    message: "Payment service configuration error" 
                });
            }

            console.log('🔍 Creating automatic Razorpay transfer...');
            console.log('Razorpay instance:', razorpay);
            console.log('Available Razorpay methods:', Object.keys(razorpay));
            
            // Try different approaches for automatic payment
            let payout = null;
            let transferSuccess = false;
            
            // Approach 1: Try Razorpay Transfers API (Direct bank transfer)
            if (razorpay.transfers && razorpay.transfers.create) {
                console.log('✅ Attempting automatic transfer using Razorpay Transfers API...');
                
                try {
                    const transferData = {
                        amount: Math.round(paymentAmount * 100), // Convert to paise
                        currency: "INR",
                        account: freelancerBankDetails.account_number,
                        notes: {
                            milestone: milestone.title,
                            project: project.title,
                            milestone_index: milestone_index.toString(),
                            project_id: project_id,
                            freelancer_name: freelancerBankDetails.account_holder_name,
                            freelancer_ifsc: freelancerBankDetails.ifsc_code,
                            payment_type: 'automatic_milestone_payment'
                        }
                    };

                    console.log('Transfer data:', {
                        ...transferData,
                        account: '***' + transferData.account.slice(-4) // Hide account number
                    });

                    payout = await razorpay.transfers.create(transferData);
                    transferSuccess = true;
                    console.log('✅ Automatic transfer created successfully:', payout.id);
                    
                } catch (transferError) {
                    console.log('⚠️ Transfer creation failed:', transferError.message);
                    if (transferError.error) {
                        console.log('Transfer error details:', transferError.error);
                    }
                    
                    // If transfer fails due to feature not enabled, try alternative approach
                    if (transferError.error && transferError.error.description && 
                        transferError.error.description.includes('not enabled')) {
                        console.log('🔄 Transfers not enabled, trying alternative approach...');
                        transferSuccess = false;
                    } else {
                        throw transferError;
                    }
                }
            }
            
            // Approach 2: Try Razorpay Payouts API (if transfers failed)
            if (!transferSuccess && razorpay.payouts && razorpay.payouts.create) {
                console.log('✅ Attempting automatic payout using Razorpay Payouts API...');
                
                try {
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
                        narration: `Automatic milestone payment for project: ${project.title}`
                    };

                    console.log('Payout data:', {
                        ...payoutData,
                        account_number: '***' + payoutData.account_number.slice(-4)
                    });

                    payout = await razorpay.payouts.create(payoutData);
                    transferSuccess = true;
                    console.log('✅ Automatic payout created successfully:', payout.id);
                    
                } catch (payoutError) {
                    console.log('⚠️ Payout creation failed:', payoutError.message);
                    if (payoutError.error) {
                        console.log('Payout error details:', payoutError.error);
                    }
                    transferSuccess = false;
                }
            }
            
            // Approach 3: Fallback to Orders API (if both transfers and payouts fail)
            if (!transferSuccess && razorpay.orders && razorpay.orders.create) {
                console.log('⚠️ Transfers/Payouts not available, using Orders API as fallback...');
                
                const orderData = {
                    amount: Math.round(paymentAmount * 100), // Convert to paise
                    currency: "INR",
                    receipt: `milestone_${project_id}_${milestone_index}_${Date.now()}`,
                    notes: {
                        milestone: milestone.title,
                        project: project.title,
                        milestone_index: milestone_index.toString(),
                        project_id: project_id,
                        freelancer_name: freelancerBankDetails.account_holder_name,
                        freelancer_account: freelancerBankDetails.account_number,
                        freelancer_ifsc: freelancerBankDetails.ifsc_code,
                        payment_type: 'milestone_payment_manual_required'
                    }
                };

                console.log('Order data:', {
                    ...orderData,
                    notes: {
                        ...orderData.notes,
                        freelancer_account: '***' + orderData.notes.freelancer_account.slice(-4)
                    }
                });

                const order = await razorpay.orders.create(orderData);
                console.log('✅ Razorpay order created successfully:', order.id);
                
                // Create a simulated payout for tracking
                payout = {
                    id: `order_${order.id}`,
                    status: 'pending_manual',
                    amount: order.amount,
                    order_id: order.id,
                    reference_id: order.receipt,
                    manual_processing_required: true
                };

                console.log('⚠️ Manual processing required - order created for admin processing');
            }
            
            // If all approaches fail
            if (!payout) {
                console.log('❌ All payment methods failed');
                console.log('Available Razorpay methods:', Object.keys(razorpay));
                return res.status(500).json({ 
                    status: false, 
                    message: "Unable to process automatic payment. Please check Razorpay configuration and enable transfers/payouts." 
                });
            }
            console.log('✅ Razorpay payout created successfully:', {
                payout_id: payout.id,
                status: payout.status,
                amount: payout.amount
            });

            // Update milestone with payment information
            bid.milestones[milestone_index].payment_released = 1;
            bid.milestones[milestone_index].payment_amount = paymentAmount;
            bid.milestones[milestone_index].payment_id = payout.id;
            bid.milestones[milestone_index].payment_released_at = new Date().toISOString();
            
            console.log('🔍 Saving bid with updated milestone...');
            await bid.save();
            console.log('✅ Bid saved successfully');

            // Create payment history record
            console.log('🔍 Creating payment history record...');
            await PaymentHistory.create({
                userId: bid.freelancer_id,
                orderId: payout.order_id || payout.id, // Use order ID if available
                paymentId: payout.id,
                amount: paymentAmount,
                currency: 'INR',
                status: transferSuccess ? 'paid' : (payout.manual_processing_required ? 'pending' : 'processed'),
                createdAt: new Date()
            });
            console.log('✅ Payment history record created');

            console.log('🎉 Milestone payment released successfully');
            return res.status(200).json({
                status: true,
                message: transferSuccess ? 
                    "Milestone payment released automatically to freelancer account" : 
                    (payout.manual_processing_required ? 
                        "Milestone payment request created. Manual processing required." : 
                        "Milestone payment processed successfully"),
                data: {
                    payout_id: payout.id,
                    amount: paymentAmount,
                    milestone_title: milestone.title,
                    payment_status: transferSuccess ? 'transferred' : (payout.manual_processing_required ? 'pending_manual' : 'processed'),
                    automatic_transfer: transferSuccess,
                    payment_details: transferSuccess ? {
                        freelancer: freelancerBankDetails.account_holder_name,
                        account: '***' + freelancerBankDetails.account_number.slice(-4),
                        ifsc: freelancerBankDetails.ifsc_code,
                        amount: paymentAmount,
                        transfer_id: payout.id
                    } : (payout.manual_processing_required ? {
                        freelancer: freelancerBankDetails.account_holder_name,
                        account: freelancerBankDetails.account_number,
                        ifsc: freelancerBankDetails.ifsc_code,
                        amount: paymentAmount,
                        order_id: payout.order_id
                    } : null)
                }
            });

        } catch (error) {
            console.error("❌ Error releasing milestone payment:", error);
            console.error("Error details:", {
                message: error.message,
                stack: error.stack,
                name: error.name
            });
            
            // Check if it's a Razorpay specific error
            if (error.error) {
                console.error("Razorpay error details:", error.error);
            }
            
            return res.status(500).json({ 
                status: false, 
                message: "Failed to release milestone payment", 
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.stack : undefined
            });
        }
    }

    // Debug endpoint for milestone payment troubleshooting
    async debugMilestonePayment(req, res) {
        try {
            const { project_id, milestone_index } = req.body;
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            console.log('🔍 Debug milestone payment request:', {
                project_id,
                milestone_index,
                userId,
                userRole
            });

            if (!project_id) {
                return res.status(400).json({
                    status: false,
                    message: "project_id is required for debugging"
                });
            }

            // Get project with accepted bid
            const project = await projectinfo.findById(project_id)
                .populate('accepted_bid_id')
                .populate('personid', 'first_name last_name email');

            if (!project) {
                return res.status(404).json({
                    status: false,
                    message: "Project not found",
                    debug_info: { project_id }
                });
            }

            const bid = project.accepted_bid_id;
            let milestone = null;
            let milestoneError = null;

            if (bid && bid.milestones && milestone_index !== undefined) {
                if (milestone_index >= 0 && milestone_index < bid.milestones.length) {
                    milestone = bid.milestones[milestone_index];
                } else {
                    milestoneError = `Invalid milestone index: ${milestone_index}. Available milestones: 0-${bid.milestones.length - 1}`;
                }
            }

            // Get freelancer bank details
            let bankDetails = null;
            let bankDetailsError = null;
            
            if (bid && bid.freelancer_id) {
                try {
                    bankDetails = await BankDetails.findOne({
                        user_id: bid.freelancer_id,
                        is_active: 1,
                        is_primary: 1
                    });
                    
                    if (!bankDetails) {
                        bankDetailsError = "No active primary bank details found for freelancer";
                    }
                } catch (error) {
                    bankDetailsError = `Error fetching bank details: ${error.message}`;
                }
            }

            // Check Razorpay configuration
            const razorpayConfig = {
                key_id: process.env.RAZORPAY_KEY_ID ? 'Set' : 'Not Set',
                key_secret: process.env.RAZORPAY_KEY_SECRET ? 'Set' : 'Not Set',
                key_type: process.env.RAZORPAY_KEY_ID ? 
                    (process.env.RAZORPAY_KEY_ID.startsWith('rzp_test_') ? 'Test' : 'Live') : 'Unknown'
            };

            const debugInfo = {
                project: {
                    id: project._id,
                    title: project.title,
                    escrow_status: project.escrow_status,
                    escrow_amount: project.escrow_amount,
                    personid: project.personid,
                    client_name: project.personid ? `${project.personid.first_name} ${project.personid.last_name}` : 'Unknown'
                },
                bid: bid ? {
                    id: bid._id,
                    freelancer_id: bid.freelancer_id,
                    bid_amount: bid.bid_amount,
                    status: bid.status,
                    milestones_count: bid.milestones ? bid.milestones.length : 0,
                    milestones: bid.milestones ? bid.milestones.map((m, index) => ({
                        index,
                        title: m.title,
                        amount: m.amount,
                        is_completed: m.is_completed,
                        payment_released: m.payment_released,
                        payment_id: m.payment_id
                    })) : []
                } : null,
                milestone: milestone ? {
                    title: milestone.title,
                    amount: milestone.amount,
                    is_completed: milestone.is_completed,
                    payment_released: milestone.payment_released,
                    payment_id: milestone.payment_id,
                    payment_released_at: milestone.payment_released_at
                } : null,
                milestone_error: milestoneError,
                bank_details: bankDetails ? {
                    account_holder_name: bankDetails.account_holder_name,
                    account_number: '***' + bankDetails.account_number.slice(-4),
                    ifsc_code: bankDetails.ifsc_code,
                    is_active: bankDetails.is_active,
                    is_primary: bankDetails.is_primary
                } : null,
                bank_details_error: bankDetailsError,
                razorpay_config: razorpayConfig,
                user_info: {
                    user_id: userId,
                    user_role: userRole,
                    is_project_owner: project.personid ? project.personid._id.toString() === userId : false
                }
            };

            return res.status(200).json({
                status: true,
                message: "Debug information retrieved successfully",
                debug_info: debugInfo
            });

        } catch (error) {
            console.error("Error in debug endpoint:", error);
            return res.status(500).json({
                status: false,
                message: "Debug endpoint error",
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

            console.log(`🔍 Project details for auto-release:`, {
                projectId: project._id,
                title: project.title,
                escrow_status: project.escrow_status,
                has_accepted_bid: !!project.accepted_bid_id
            });

            // Check if escrow is completed
            if (project.escrow_status !== 'completed') {
                console.error(`❌ Escrow not completed for project ${projectId}. Current status: ${project.escrow_status}`);
                return { success: false, message: `Escrow payment not completed. Current status: ${project.escrow_status}` };
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
            console.log(`🔍 Looking for bank details for freelancer: ${bid.freelancer_id}`);
            const freelancerBankDetails = await BankDetails.findOne({
                user_id: bid.freelancer_id,
                is_active: 1,
                is_primary: 1
            });

            console.log(`🔍 Bank details found:`, freelancerBankDetails ? 'Yes' : 'No');
            if (freelancerBankDetails) {
                console.log(`🔍 Bank details:`, {
                    account_holder_name: freelancerBankDetails.account_holder_name,
                    account_number: freelancerBankDetails.account_number ? '***' + freelancerBankDetails.account_number.slice(-4) : 'N/A',
                    ifsc_code: freelancerBankDetails.ifsc_code,
                    is_active: freelancerBankDetails.is_active,
                    is_primary: freelancerBankDetails.is_primary
                });
            }

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

            let payout = null;
            let payoutSuccess = false;
            
            try {
                payout = await razorpay.payouts.create(payoutData);
                payoutSuccess = true;
                console.log(`✅ Razorpay payout created successfully: ${payout.id}`);
            } catch (payoutError) {
                console.error(`❌ Razorpay payout failed for milestone ${milestoneIndex} in project ${projectId}:`, payoutError);
                payoutSuccess = false;
            }

            // Update milestone with payment information regardless of payout success
            bid.milestones[milestoneIndex].payment_released = 1;
            bid.milestones[milestoneIndex].payment_amount = paymentAmount;
            bid.milestones[milestoneIndex].payment_id = payout ? payout.id : `manual_${Date.now()}`;
            bid.milestones[milestoneIndex].payment_released_at = new Date().toISOString();
            bid.milestones[milestoneIndex].auto_released = payoutSuccess; // Only true if payout succeeded
            
            // Update payment initiated status if not already set
            if (!bid.milestones[milestoneIndex].payment_initiated) {
                bid.milestones[milestoneIndex].payment_initiated = true;
                bid.milestones[milestoneIndex].payment_initiated_at = new Date().toISOString();
            }
            
            await bid.save();

            // Create payment history record
            await PaymentHistory.create({
                userId: bid.freelancer_id,
                orderId: payout ? payout.reference_id : `manual_${Date.now()}`,
                paymentId: payout ? payout.id : `manual_${Date.now()}`,
                amount: paymentAmount,
                currency: 'INR',
                status: payoutSuccess ? 'paid' : 'manual_processing',
                createdAt: new Date()
            });

            if (payoutSuccess) {
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
            } else {
                console.log(`⚠️ Milestone ${milestoneIndex} approved but payout failed - requires manual processing`);
                return {
                    success: true,
                    message: "Milestone approved but payment requires manual processing",
                    data: {
                        payout_id: null,
                        amount: paymentAmount,
                        milestone_title: milestone.title,
                        manual_processing: true
                    }
                };
            }

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

