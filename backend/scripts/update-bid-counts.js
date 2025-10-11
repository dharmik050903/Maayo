/**
 * Script to update bid_count for existing projects
 * This should be run once after adding the bid_count field to the schema
 */

import mongoose from 'mongoose';
import projectinfo from '../schema/projectinfo.js';
import Bid from '../schema/bid.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function updateBidCounts() {
    try {
        console.log('🔄 Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        console.log('🔄 Updating bid counts for existing projects...');
        
        // Get all projects
        const projects = await projectinfo.find({});
        console.log(`📊 Found ${projects.length} projects to update`);

        let updatedCount = 0;

        for (const project of projects) {
            // Count bids for this project
            const bidCount = await Bid.countDocuments({ project_id: project._id });
            
            // Update the project with the correct bid count
            await projectinfo.findByIdAndUpdate(project._id, { 
                bid_count: bidCount 
            });
            
            updatedCount++;
            console.log(`✅ Updated project "${project.title}" - ${bidCount} bids`);
        }

        console.log(`🎉 Successfully updated ${updatedCount} projects`);
        
    } catch (error) {
        console.error('❌ Error updating bid counts:', error);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB');
        process.exit(0);
    }
}

// Run the script
updateBidCounts();
