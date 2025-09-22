import mongoose from "mongoose";

const paymentHistorySchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    orderId: { type: String, required: true },
    paymentId: { type: String, required: true },
    amount: { type: Number, required: true },
    currency: { type: String, default: "INR" },
    status: { type: String, enum: ["created", "paid", "failed"], default: "created" },
    createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("tblpaymenthistory", paymentHistorySchema);