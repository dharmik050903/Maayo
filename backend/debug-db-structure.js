import dotenv from "dotenv";
import mongoose from "mongoose";

dotenv.config();

async function debugDatabaseStructure() {
    try {
        console.log("🔍 Connecting to MongoDB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const db = mongoose.connection.db;
        
        // List all collections
        console.log("📋 All collections in database:");
        const collections = await db.listCollections().toArray();
        collections.forEach(col => {
            console.log(`- ${col.name}`);
        });
        
        // Check if there are multiple project-related collections
        const projectCollections = collections.filter(col => 
            col.name.toLowerCase().includes('project') || 
            col.name.toLowerCase().includes('tblproject')
        );
        
        console.log("\n🔍 Project-related collections:");
        projectCollections.forEach(col => {
            console.log(`- ${col.name}`);
        });
        
        // Check the main project collection
        const mainCollection = db.collection('tblprojects');
        const count = await mainCollection.countDocuments();
        console.log(`\n📊 Total documents in tblprojects: ${count}`);
        
        // Search for projects with similar IDs (partial match)
        const targetId = "68ea1a149d77aff2adf1f638";
        console.log(`\n🔍 Searching for projects with ID containing: ${targetId.substring(0, 8)}...`);
        
        const similarProjects = await mainCollection.find({
            _id: { $regex: targetId.substring(0, 8) }
        }).limit(5).toArray();
        
        console.log(`Found ${similarProjects.length} projects with similar IDs:`);
        similarProjects.forEach(project => {
            console.log(`- ${project._id}: ${project.title || 'No title'}`);
        });
        
        // Search for projects created around the same time (if the ID is timestamp-based)
        console.log(`\n🔍 Searching for projects with exact ID: ${targetId}...`);
        const exactProject = await mainCollection.findOne({ _id: targetId });
        console.log("Exact match:", exactProject ? "Found" : "Not found");
        
        if (exactProject) {
            console.log("Project details:", {
                _id: exactProject._id,
                title: exactProject.title,
                personid: exactProject.personid,
                createdAt: exactProject.createdAt
            });
        }
        
        // Check if the ID exists in any collection
        console.log(`\n🔍 Checking if ID exists in any collection...`);
        for (const collection of collections) {
            const col = db.collection(collection.name);
            const exists = await col.findOne({ _id: targetId });
            if (exists) {
                console.log(`✅ Found in collection: ${collection.name}`);
                console.log("Document:", exists);
            }
        }

    } catch (error) {
        console.error("❌ Error during debug:", error);
    } finally {
        await mongoose.disconnect();
        console.log("🔌 Disconnected from MongoDB");
    }
}

debugDatabaseStructure();
