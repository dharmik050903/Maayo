import Chat from "../schema/chat.js";
import Bid from "../schema/bid.js";
import projectinfo from "../schema/projectinfo.js";
import PersonMaster from "../schema/PersonMaster.js";
import { getIO } from "../services/socket.js";

export default class ChatController {
    // Send a chat message between client and freelancer for an accepted bid
    async sendMessage(req, res) {
        try {
            const userId = req.headers.id;
            const userName = `${req.headers.first_name || ''} ${req.headers.last_name || ''}`.trim();
            const { bid_id, message } = req.body || {};

            if (!bid_id || !message) {
                return res.status(400).json({ status: false, message: "bid_id and message are required" });
            }

            // Validate bid and ensure it is accepted
            const bid = await Bid.findById(bid_id).populate('project_id');
            if (!bid) {
                return res.status(404).json({ status: false, message: "Bid not found" });
            }
            if (bid.status !== 'accepted') {
                return res.status(403).json({ status: false, message: "Chat is only available for accepted bids" });
            }

            // Determine participants (client and freelancer)
            const project = bid.project_id;
            const clientId = project.personid?.toString();
            const freelancerId = bid.freelancer_id?.toString();

            if (![clientId, freelancerId].includes(userId)) {
                return res.status(403).json({ status: false, message: "You are not a participant in this chat" });
            }

            const toPersonId = userId === clientId ? freelancerId : clientId;

            // Fetch names if not present in headers
            let fromName = userName;
            let toName = '';
            if (!fromName) {
                const from = await PersonMaster.findById(userId).select('first_name last_name');
                fromName = `${from?.first_name || ''} ${from?.last_name || ''}`.trim();
            }
            const to = await PersonMaster.findById(toPersonId).select('first_name last_name');
            toName = `${to?.first_name || ''} ${to?.last_name || ''}`.trim();

            // Persist message
            const chatDoc = await Chat.create({
                project_id: project._id,
                bid_id,
                from_person_id: userId,
                from_person_name: fromName || 'Unknown',
                to_person_id: toPersonId,
                to_person_name: toName || 'Unknown',
                message
            });

            // Emit to room and to direct user channels
            const io = getIO();
            io.to(`chat:${bid_id}`).emit('chat:new-message', {
                bid_id,
                message: chatDoc
            });
            io.to(`user:${toPersonId}`).emit('chat:new-message', {
                bid_id,
                message: chatDoc
            });

            return res.status(201).json({ status: true, message: "Message sent", data: chatDoc });
        } catch (error) {
            console.error('Error sending chat message:', error);
            return res.status(500).json({ status: false, message: 'Failed to send message', error: error.message });
        }
    }

    // Get chat messages for an accepted bid (both participants can view)
    async getMessages(req, res) {
        try {
            const userId = req.headers.id;
            const { bid_id, page, limit } = req.body || {};
            if (!bid_id) {
                return res.status(400).json({ status: false, message: "bid_id is required" });
            }

            const bid = await Bid.findById(bid_id).populate('project_id');
            if (!bid) {
                return res.status(404).json({ status: false, message: "Bid not found" });
            }
            if (bid.status !== 'accepted') {
                return res.status(403).json({ status: false, message: "Chat is only available for accepted bids" });
            }

            const project = bid.project_id;
            const clientId = project.personid?.toString();
            const freelancerId = bid.freelancer_id?.toString();
            if (![clientId, freelancerId].includes(userId)) {
                return res.status(403).json({ status: false, message: "You are not a participant in this chat" });
            }

            const pageNum = Math.max(parseInt(page || 1, 10), 1);
            const limitNum = Math.max(parseInt(limit || 50, 10), 1);
            const skipNum = (pageNum - 1) * limitNum;

            const [messages, total] = await Promise.all([
                Chat.find({ bid_id }).sort({ sent_at: 1 }).skip(skipNum).limit(limitNum),
                Chat.countDocuments({ bid_id })
            ]);

            return res.status(200).json({
                status: true,
                message: "Messages fetched",
                data: messages,
                pagination: { total, page: pageNum, limit: limitNum }
            });
        } catch (error) {
            console.error('Error fetching chat messages:', error);
            return res.status(500).json({ status: false, message: 'Failed to fetch messages', error: error.message });
        }
    }

    // Get all conversations for a user (accepted bids with latest messages)
    async getConversations(req, res) {
        try {
            const userId = req.headers.id;
            const userRole = req.headers.user_role;

            let acceptedBids = [];

            if (userRole === 'client') {
                // Get all accepted bids for client's projects
                const projects = await projectinfo.find({ personid: userId });
                const projectIds = projects.map(p => p._id);

                acceptedBids = await Bid.find({
                    project_id: { $in: projectIds },
                    status: 'accepted'
                }).populate('freelancer_id', 'first_name last_name')
                  .populate('project_id', 'title');

            } else if (userRole === 'freelancer') {
                // Get all accepted bids by freelancer
                acceptedBids = await Bid.find({
                    freelancer_id: userId,
                    status: 'accepted'
                }).populate('project_id', 'title personid')
                  .populate('project_id.personid', 'first_name last_name');
            } else {
                return res.status(403).json({ status: false, message: "Invalid user role" });
            }

            // Get conversations with latest messages
            const conversations = [];
            for (const bid of acceptedBids) {
                const latestMessage = await Chat.findOne({ bid_id: bid._id })
                    .sort({ sent_at: -1 })
                    .limit(1);

                const conversation = {
                    bid_id: bid._id,
                    project_id: bid.project_id._id,
                    project_title: bid.project_id.title,
                    status: bid.status,
                    latest_message: latestMessage ? latestMessage.message : 'Bid accepted! Start the conversation.',
                    latest_message_time: latestMessage ? latestMessage.sent_at : (bid.client_decision_date || bid.createdAt)
                };

                if (userRole === 'client') {
                    conversation.freelancer_id = bid.freelancer_id._id;
                    conversation.freelancer_name = `${bid.freelancer_id.first_name} ${bid.freelancer_id.last_name}`.trim();
                    conversation.client_id = userId;
                    conversation.client_name = 'You';
                } else {
                    conversation.freelancer_id = userId;
                    conversation.freelancer_name = 'You';
                    conversation.client_id = bid.project_id.personid._id;
                    conversation.client_name = `${bid.project_id.personid.first_name} ${bid.project_id.personid.last_name}`.trim();
                }

                conversations.push(conversation);
            }

            return res.status(200).json({
                status: true,
                message: "Conversations fetched",
                data: conversations
            });
        } catch (error) {
            console.error('Error fetching conversations:', error);
            return res.status(500).json({ status: false, message: 'Failed to fetch conversations', error: error.message });
        }
    }
}



