import mongoose from "mongoose"

const skills = new mongoose.Schema({
    skill : { type: String, },
   category : { type: String, }
})  

export default mongoose.model("tblskills", skills);