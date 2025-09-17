import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
    project_id: { type: mongoose.Schema.Types.ObjectId, ref: 'tblproject', required: true },
    bid_id: { type: mongoose.Schema.Types.ObjectId, ref: 'tblbid', required: true },
    from_person_id: { type: mongoose.Schema.Types.ObjectId, ref: 'tblpersonmaster', required: true },
    from_person_name: { type: String, required: true },
    to_person_id: { type: mongoose.Schema.Types.ObjectId, ref: 'tblpersonmaster', required: true },
    to_person_name: { type: String, required: true },
    message: { type: String, required: true },
    sent_at: { type: String, default: () => new Date().toISOString() }
});

chatSchema.index({ bid_id: 1, sent_at: 1 });
chatSchema.index({ project_id: 1, sent_at: 1 });

export default mongoose.model('tblchats', chatSchema);



