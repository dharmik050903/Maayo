import BankDetails from "../schema/bankDetails.js";
import PersonMaster from "../schema/PersonMaster.js";

export default class BankDetailsController {
    
    // Add bank details
    async addBankDetails(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            // Only freelancers need bank details for receiving payments
            if (userRole !== 'freelancer') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only freelancers can add bank details for receiving payments. Clients pay through Razorpay payment gateway (cards/UPI/net banking)." 
                });
            }

            const { 
                account_holder_name, 
                account_number, 
                ifsc_code, 
                bank_name, 
                branch_name, 
                account_type, 
                upi_id 
            } = req.body;

            // Validate required fields
            if (!account_holder_name || !account_number || !ifsc_code || !bank_name) {
                return res.status(400).json({ 
                    status: false, 
                    message: "account_holder_name, account_number, ifsc_code, and bank_name are required" 
                });
            }

            // Validate IFSC code format
            const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
            if (!ifscRegex.test(ifsc_code.toUpperCase())) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Invalid IFSC code format" 
                });
            }

            // Check if user already has bank details
            const existingBankDetails = await BankDetails.findOne({
                user_id: userId,
                is_active: 1
            });

            if (existingBankDetails) {
                return res.status(400).json({ 
                    status: false, 
                    message: "Bank details already exist. Please update existing details instead." 
                });
            }

            // Create new bank details
            const newBankDetails = new BankDetails({
                user_id: userId,
                account_holder_name: account_holder_name.trim(),
                account_number: account_number.trim(),
                ifsc_code: ifsc_code.trim().toUpperCase(),
                bank_name: bank_name.trim(),
                branch_name: branch_name ? branch_name.trim() : '',
                account_type: account_type || 'savings',
                upi_id: upi_id ? upi_id.trim() : '',
                is_primary: 1, // First bank details are primary by default
                is_active: 1
            });

            await newBankDetails.save();

            return res.status(201).json({
                status: true,
                message: "Bank details added successfully",
                data: {
                    bank_details_id: newBankDetails._id,
                    account_holder_name: newBankDetails.account_holder_name,
                    bank_name: newBankDetails.bank_name,
                    is_primary: newBankDetails.is_primary
                }
            });

        } catch (error) {
            console.error("Error adding bank details:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to add bank details", 
                error: error.message 
            });
        }
    }

    // Update bank details
    async updateBankDetails(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            if (userRole !== 'freelancer') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only freelancers can update bank details." 
                });
            }

            const { bank_details_id } = req.body;

            if (!bank_details_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "bank_details_id is required" 
                });
            }

            // Find bank details
            const bankDetails = await BankDetails.findOne({
                _id: bank_details_id,
                user_id: userId,
                is_active: 1
            });

            if (!bankDetails) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Bank details not found" 
                });
            }

            // Update fields
            const updateData = { updatedAt: new Date().toISOString() };
            
            if (req.body.account_holder_name) {
                updateData.account_holder_name = req.body.account_holder_name.trim();
            }
            if (req.body.account_number) {
                updateData.account_number = req.body.account_number.trim();
            }
            if (req.body.ifsc_code) {
                const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
                if (!ifscRegex.test(req.body.ifsc_code.toUpperCase())) {
                    return res.status(400).json({ 
                        status: false, 
                        message: "Invalid IFSC code format" 
                    });
                }
                updateData.ifsc_code = req.body.ifsc_code.trim().toUpperCase();
            }
            if (req.body.bank_name) {
                updateData.bank_name = req.body.bank_name.trim();
            }
            if (req.body.branch_name !== undefined) {
                updateData.branch_name = req.body.branch_name.trim();
            }
            if (req.body.account_type) {
                updateData.account_type = req.body.account_type;
            }
            if (req.body.upi_id !== undefined) {
                updateData.upi_id = req.body.upi_id.trim();
            }

            const updatedBankDetails = await BankDetails.findByIdAndUpdate(
                bank_details_id,
                updateData,
                { new: true }
            );

            return res.status(200).json({
                status: true,
                message: "Bank details updated successfully",
                data: {
                    bank_details_id: updatedBankDetails._id,
                    account_holder_name: updatedBankDetails.account_holder_name,
                    bank_name: updatedBankDetails.bank_name
                }
            });

        } catch (error) {
            console.error("Error updating bank details:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to update bank details", 
                error: error.message 
            });
        }
    }

    // Get user's bank details
    async getBankDetails(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            if (userRole !== 'freelancer') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only freelancers can view bank details." 
                });
            }

            const bankDetails = await BankDetails.find({
                user_id: userId,
                is_active: 1
            }).select('-__v');

            return res.status(200).json({
                status: true,
                message: "Bank details fetched successfully",
                data: bankDetails
            });

        } catch (error) {
            console.error("Error fetching bank details:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to fetch bank details", 
                error: error.message 
            });
        }
    }

    // Set primary bank details
    async setPrimaryBankDetails(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            if (userRole !== 'freelancer') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only freelancers can set primary bank details." 
                });
            }

            const { bank_details_id } = req.body;

            if (!bank_details_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "bank_details_id is required" 
                });
            }

            // Find bank details
            const bankDetails = await BankDetails.findOne({
                _id: bank_details_id,
                user_id: userId,
                is_active: 1
            });

            if (!bankDetails) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Bank details not found" 
                });
            }

            // Set as primary (pre-save hook will handle removing primary from others)
            bankDetails.is_primary = 1;
            await bankDetails.save();

            return res.status(200).json({
                status: true,
                message: "Primary bank details set successfully",
                data: {
                    bank_details_id: bankDetails._id,
                    account_holder_name: bankDetails.account_holder_name,
                    bank_name: bankDetails.bank_name
                }
            });

        } catch (error) {
            console.error("Error setting primary bank details:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to set primary bank details", 
                error: error.message 
            });
        }
    }

    // Delete bank details
    async deleteBankDetails(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            if (userRole !== 'freelancer') {
                return res.status(403).json({ 
                    status: false, 
                    message: "Access denied. Only freelancers can delete bank details." 
                });
            }

            const { bank_details_id } = req.body;

            if (!bank_details_id) {
                return res.status(400).json({ 
                    status: false, 
                    message: "bank_details_id is required" 
                });
            }

            // Find bank details
            const bankDetails = await BankDetails.findOne({
                _id: bank_details_id,
                user_id: userId,
                is_active: 1
            });

            if (!bankDetails) {
                return res.status(404).json({ 
                    status: false, 
                    message: "Bank details not found" 
                });
            }

            // Soft delete (set is_active to 0)
            await BankDetails.findByIdAndUpdate(bank_details_id, {
                is_active: 0,
                updatedAt: new Date().toISOString()
            });

            return res.status(200).json({
                status: true,
                message: "Bank details deleted successfully"
            });

        } catch (error) {
            console.error("Error deleting bank details:", error);
            return res.status(500).json({ 
                status: false, 
                message: "Failed to delete bank details", 
                error: error.message 
            });
        }
    }
}
