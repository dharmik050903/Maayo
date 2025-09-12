import mongoose from "mongoose";

const clientinfo = new mongoose.Schema({
    personId: { type: mongoose.Schema.Types.ObjectId, ref: 'tblpersonmaster' },
    name: { type: String },
    active_project: { type: Number, default: 0 }, //0 for inactive and 1 for active
    pending_reviews: { type: Number },
    completed_project: { type: Number, default: 0 },
    total_spend: { type: Number },
    pending_project: { type: Number, required: true },
    createdAt: { type: String, default: () => new Date().toISOString() },
    updateAt: { type: String, default: null },
    projects: [
        {
            projectid: { type: mongoose.Schema.Types.ObjectId, ref: 'tblproject' },
            projecttitle: { type: String, default: '' },
        }
    ]
})
export default mongoose.model("tblclientinfo", clientinfo);