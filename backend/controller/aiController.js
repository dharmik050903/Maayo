import { GoogleGenerativeAI, GoogleGenerativeAIError } from "@google/generative-ai";

// It's recommended to move this to a secure configuration or environment variable
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default class AIController {
    /**
     * Generates a personalized proposal for a project bid using a generative AI model.
     * It takes project details and a user prompt to create a compelling cover letter.
     */
    async generateProposal(req, res) {
        try {
            const { title, description, budget, milestones, bid_amount, prompt } = req.body;

            // Enhanced validation
            if (!title || typeof title !== 'string' || title.trim() === '') {
                return res.status(400).json({
                    status: false,
                    message: "A non-empty project title is required.",
                });
            }
            if (!description || typeof description !== 'string' || description.trim() === '') {
                return res.status(400).json({
                    status: false,
                    message: "A non-empty project description is required.",
                });
            }

            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const fullPrompt = createProposalPrompt(req.body);

            const result = await model.generateContent(fullPrompt);
            const text = result.response.text();

            return res.status(200).json({
                status: true,
                message: "Proposal generated successfully.",
                data: { proposalText: text },
            });

        } catch (error) {
            console.error("Error generating AI proposal:", error);

            // More specific error handling for the Google Generative AI SDK
            if (error instanceof GoogleGenerativeAIError) {
                // This can catch permission denied (bad API key), invalid arguments, etc.
                return res.status(401).json({
                    status: false,
                    message: "AI service error. Please check your API key or the request payload.",
                    error: error.message
                });
            }

            return res.status(500).json({
                status: false,
                message: "Failed to generate AI proposal.",
                error: error.message,
            });
        }
    }
    async createProposalPrompt(req, res) {
        try {
            const { title, description, budget, bid_amount, milestones, prompt } = req.body;
            const freelancerInstructions = prompt || 'Focus on my skills and how they match the project requirements. Keep it professional and concise.';
            const projectBudget = budget ? `$${budget}` : 'Not specified';
            const proposedBid = bid_amount ? `$${bid_amount}` : 'Not specified';
            const proposedMilestones = milestones && milestones.length > 0 ? JSON.stringify(milestones, null, 2) : 'Not specified';

            return `
        Generate a professional and persuasive cover letter for a project bid.

        **Project Details:**
        - **Title:** ${title}
        - **Description:** ${description}
        - **Client's Budget:** ${projectBudget}
        - **My Proposed Bid Amount:** ${proposedBid}
        - **My Proposed Milestones:** ${proposedMilestones}

        **Instructions from me (the Freelancer):**
        ${freelancerInstructions}

        **Your Task:**
        As an expert proposal writer, write a cover letter based on the information above.
        1.  **Tone**: Confident, professional, and tailored to the project.
        2.  **Content**: Directly address the project description. Highlight how the freelancer's skills are a perfect fit.
        3.  **Assumptions**: Do not invent skills. Assume the freelancer possesses the expertise relevant to the project's requirements.
        4.  **Format**: Start with a professional greeting (e.g., "Dear Client,"). End with a strong call to action and closing (e.g., "Sincerely,"). Do not include placeholders like "[Your Name]".
    `;
        } catch (error) {
            console.error("Error creating proposal prompt:", error);
            // More specific error handling for the Google Generative AI SDK
            if (error instanceof GoogleGenerativeAIError) {
                // This can catch permission denied (bad API key), invalid arguments, etc.
                return res.status(401).json({
                    status: false,
                    message: "AI service error. Please check your API key or the request payload.",
                    error: error.message
                });
            }

            return res.status(500).json({
                status: false,
                message: "Failed to generate AI proposal.",
                error: error.message,
            });
        }
    }
}