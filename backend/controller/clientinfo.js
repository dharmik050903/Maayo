import clientinfo from "../schema/clientinfo.js";
import PersonMaster from "../schema/PersonMaster.js";
import freelancerInfoModel from "../schema/freelancerInfo.js";

export default class ClientInfo {
    async createClientInfo(req, res) {
        try {
            if(req.headers.user_role !== 'client'){
                return res.status(403).json({message: "Access denied. Only clients can create client info."});
            }
            const user = await PersonMaster.findOne({_id: req.headers.id});
                if(user.email != req.headers.user_email){
                    return res.status(400).json({message: "Invalid user."});
                }
                const userid = user._id
                const username = user.personName
                const newclient = new clientinfo({
                    personId: userid,
                    name: username,
                    active_project: req.body.active_project || 0,
                    pending_reviews: req.body.pending_reviews || 0,
                    completed_project: req.body.completed_project || 0,
                    total_spend: req.body.total_spend || 0,
                    pending_project: req.body.pending_project || "",
                    createdAt: new Date().toISOString()
                });
                await newclient.save();
                res.status(201).json({message: "Client info created successfully", data: newclient})

        } catch (error) {
            res.status(500).json({message : "Failed to create client info", error: error.message});
            console.error("Error creating client info:", error);
        }
    }
    
    async updateClientInfo(req, res) {
        try {
            // Check if user is authorized
            if(req.headers.user_role !== 'client'){
                return res.status(403).json({message: "Access denied. Only clients can update client info."});
            }

            // Get user from PersonMaster
            const user = await PersonMaster.findOne({email: req.headers.user_email});
            if(!user || !user.email){
                return res.status(400).json({message: "Invalid user."});
            }

            // Find existing client info
            const existingClientInfo = await clientinfo.findOne({personId: user._id});
            if(!existingClientInfo){
                return res.status(404).json({message: "Client info not found. Please create client info first."});
            }

            let updatedClientInfo = null;
            let updatedFreelancerInfo = null;

            // Check if this is a project completion update
            if(req.body.completed_project && req.body.completed_project > 0){
                // Update completed_project and active_project
                const updateOps = {
                    $inc: {
                        completed_project: 1,
                        active_project: -1
                    },
                    updateAt: new Date().toISOString()
                };

                // Prevent negative active_project values
                if (existingClientInfo.active_project <= 0) {
                    delete updateOps.$inc.active_project;
                    updateOps.$set = { active_project: 0 };
                }

                updatedClientInfo = await clientinfo.findOneAndUpdate(
                    {personId: user._id},
                    updateOps,
                    {new: true}
                );
            } else {
                // Handle other updates (if any other fields are provided)
                const updateData = {
                    ...req.body,
                    updateAt: new Date().toISOString()
                };

                // Remove completed_project from updateData if it exists to prevent direct manipulation
                delete updateData.completed_project;

                updatedClientInfo = await clientinfo.findOneAndUpdate(
                    {personId: user._id},
                    updateData,
                    {new: true}
                );
            }

            return res.status(200).json({
                message: "Update successful",
                data: {
                    client: updatedClientInfo,
                    freelancer: updatedFreelancerInfo
                }
            });

        } catch (error) {
            res.status(500).json({message: "Failed to update client info", error: error.message});
            console.error("Error updating client info:", error);
        }
    }
}