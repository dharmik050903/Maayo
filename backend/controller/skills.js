import skills from "../schema/skills.js";

export default class Skills {
    async listskills(req, res) {
        const skillList = await skills.find({});
        if (skillList) {
            res.status(200).json({ message: "Skills fetched successfully", data: skillList });
        } else {
            res.status(404).json({ message: "No skills found" });
        }
    }
}