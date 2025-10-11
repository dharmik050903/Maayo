import freelancerInfo from "../schema/freelancerInfo.js";
import PersonMaster from "../schema/PersonMaster.js";


export default class FreelancerInfo {
    async listfreelancer(req, res) {
        try {
            // Extract query parameters
            const {
                // Pagination
                page = 1,
                limit = 10,
                
                // Filters
                id,
                search,
                skills,
                experience_level,
                min_hourly_rate,
                max_hourly_rate,
                availability,
                english_level,
                
                // Sorting
                sort_by = 'createdAt',
                sort_order = 'desc'
            } = req.body;

            // Input validation
            const pageNum = Math.max(1, parseInt(page));
            const limitNum = Math.min(50, Math.max(1, parseInt(limit))); // Max 50 per page
            const skip = (pageNum - 1) * limitNum;

            // Validate sort parameters
            const allowedSortFields = ['createdAt', 'hourly_rate', 'experience_level', 'name', 'title'];
            const sortField = allowedSortFields.includes(sort_by) ? sort_by : 'createdAt';
            const sortDirection = sort_order === 'asc' ? 1 : -1;

            // Build filter object
            const filter = {};

            // Single freelancer by ID (profile ID) or personId (user ID)
            if (id) {
                let freelancer;
                
                // First try to find by profile ID
                freelancer = await freelancerInfo.findById(id).populate('personId', 'email contact_number country');
                
                // If not found by profile ID, try to find by personId (user ID)
                if (!freelancer) {
                    freelancer = await freelancerInfo.findOne({ personId: id }).populate('personId', 'email contact_number country');
                }
                
                if (!freelancer) {
                    return res.status(404).json({
                        status: false,
                        message: "Freelancer not found",
                        data: null
                    });
                }
                return res.status(200).json({
                    status: true,
                    message: "Freelancer retrieved successfully",
                    data: freelancer,
                    pagination: {
                        current_page: 1,
                        total_pages: 1,
                        total_count: 1,
                        limit: 1
                    }
                });
            }

            // Search filter (name, title, overview)
            if (search) {
                filter.$or = [
                    { name: { $regex: search, $options: 'i' } },
                    { title: { $regex: search, $options: 'i' } },
                    { overview: { $regex: search, $options: 'i' } }
                ];
            }

            // Skills filter
            if (skills) {
                const skillArray = Array.isArray(skills) ? skills : skills.split(',');
                filter['skills.skill'] = { $in: skillArray.map(s => new RegExp(s.trim(), 'i')) };
            }

            // Experience level filter
            if (experience_level) {
                const expLevels = Array.isArray(experience_level) ? experience_level : experience_level.split(',');
                filter.experience_level = { $in: expLevels };
            }

            // Hourly rate range filter
            if (min_hourly_rate || max_hourly_rate) {
                filter.hourly_rate = {};
                if (min_hourly_rate) {
                    filter.hourly_rate.$gte = parseFloat(min_hourly_rate);
                }
                if (max_hourly_rate) {
                    filter.hourly_rate.$lte = parseFloat(max_hourly_rate);
                }
            }

            // Availability filter
            if (availability) {
                const availabilities = Array.isArray(availability) ? availability : availability.split(',');
                filter.availability = { $in: availabilities };
            }

            // English level filter
            if (english_level) {
                const englishLevels = Array.isArray(english_level) ? english_level : english_level.split(',');
                filter.english_level = { $in: englishLevels };
            }

            // Build sort object
            const sort = {};
            sort[sortField] = sortDirection;

            // Execute query with pagination
            const [freelancers, totalCount] = await Promise.all([
                freelancerInfo
                    .find(filter)
                    .populate('personId', 'email contact_number country')
                    .sort(sort)
                    .skip(skip)
                    .limit(limitNum)
                    .lean(),
                freelancerInfo.countDocuments(filter)
            ]);

            // Calculate pagination info
            const totalPages = Math.ceil(totalCount / limitNum);
            const hasNextPage = pageNum < totalPages;
            const hasPrevPage = pageNum > 1;

            // Format response
            const response = {
                status: true,
                message: "Freelancers retrieved successfully",
                data: freelancers,
                pagination: {
                    current_page: pageNum,
                    total_pages: totalPages,
                    total_count: totalCount,
                    limit: limitNum,
                    has_next_page: hasNextPage,
                    has_prev_page: hasPrevPage
                },
                filters_applied: {
                    search: search || null,
                    skills: skills || null,
                    experience_level: experience_level || null,
                    min_hourly_rate: min_hourly_rate || null,
                    max_hourly_rate: max_hourly_rate || null,
                    availability: availability || null,
                    english_level: english_level || null,
                    sort_by: sortField,
                    sort_order: sort_order
                }
            };

            // If no freelancers found but filters applied
            if (freelancers.length === 0 && Object.keys(filter).length > 0) {
                response.message = "No freelancers found matching the specified criteria";
            }

            res.status(200).json(response);

        } catch (error) {
            console.error("Error retrieving freelancer info:", error);
            res.status(500).json({
                status: false,
                message: "Failed to retrieve freelancer info",
                error: process.env.NODE_ENV === 'development' ? error.message : 'Internal server error'
            });
        }
    }
    async createFreelancerInfo(req, res) {
        try {
            if (req.headers.user_role !== 'freelancer') {
                return res.status(403).json({ message: "Access denied. Only freelancers can create freelancer info." });
            }
            const user = await PersonMaster.findOne({email: req.headers.user_email});
            if (!user.email) {
                return res.status(400).json({ message: "Invalid user." });
            }
            const userdeails = user._id
            const name = user.personName
            const { title, overview, skills, hourly_rate, experience_level, availability, portfolio,resume_link,github_link } = req.body;
            if (!title || !overview || !skills || !hourly_rate || !experience_level || !availability ||!resume_link) {
                return res.status(400).json({ message: "Missing required fields." });
            }   
            const newFreelancerInfo = new freelancerInfo({
                personId: userdeails,
                name,
                title,
                overview,
                skills :req.body.skills || [],
                hourly_rate,
                experience_level,
                availability,
                portfolio,
                resume_link,
                github_link,
                certification: req.body.certification || [],
                employement_history: req.body.employement_history || [],
                highest_education: req.body.highest_education || "",
                createdAt: new Date().toISOString()
            });
            await newFreelancerInfo.save();
            res.status(201).json({ message: "Freelancer info created successfully", data: newFreelancerInfo });

        } catch (error) {
            res.status(500).json({ message: "Failed to create freelancer info", error: error.message });
            console.error("Error creating freelancer info:", error);
        }
    }
    async updateFreelancerInfo(req, res) {
        try {
            const id = req.body._id;
            req.body.updateAt = new Date().toISOString()
            const update = await freelancerInfo.findByIdAndUpdate(id, req.body, { new: true });
            if(update){
                res.status(200).json({ message: "Freelancer info updated successfully", data: update });
            }
            else{
                res.status(404).json({ message: "Freelancer info not found" });
            }
        } catch (error) {
            res.status(500).json({ message: "Failed to update freelancer info", error: error.message });
            console.error("Error updating freelancer info:", error); 
        }
    }
}