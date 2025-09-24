import mongoose from "mongoose";
import skills from "../schema/skills.js";

const skillsData = [
  // Programming Languages
  { skill: "JavaScript", category: "Programming Language" },
  { skill: "Python", category: "Programming Language" },
  { skill: "Java", category: "Programming Language" },
  { skill: "TypeScript", category: "Programming Language" },
  { skill: "PHP", category: "Programming Language" },
  { skill: "C#", category: "Programming Language" },
  { skill: "C++", category: "Programming Language" },
  { skill: "Ruby", category: "Programming Language" },
  { skill: "Go", category: "Programming Language" },
  { skill: "Rust", category: "Programming Language" },
  { skill: "Swift", category: "Programming Language" },
  { skill: "Kotlin", category: "Programming Language" },

  // Frontend Technologies
  { skill: "React", category: "Frontend Framework" },
  { skill: "Angular", category: "Frontend Framework" },
  { skill: "Vue.js", category: "Frontend Framework" },
  { skill: "Next.js", category: "Frontend Framework" },
  { skill: "Nuxt.js", category: "Frontend Framework" },
  { skill: "HTML", category: "Frontend" },
  { skill: "CSS", category: "Frontend" },
  { skill: "SCSS", category: "Frontend" },
  { skill: "Tailwind CSS", category: "Frontend" },
  { skill: "Bootstrap", category: "Frontend" },

  // Backend Technologies
  { skill: "Node.js", category: "Backend Framework" },
  { skill: "Express.js", category: "Backend Framework" },
  { skill: "Django", category: "Backend Framework" },
  { skill: "Flask", category: "Backend Framework" },
  { skill: "Spring Boot", category: "Backend Framework" },
  { skill: "Laravel", category: "Backend Framework" },
  { skill: "Ruby on Rails", category: "Backend Framework" },
  { skill: "ASP.NET", category: "Backend Framework" },
  { skill: "FastAPI", category: "Backend Framework" },

  // Databases
  { skill: "MongoDB", category: "Database" },
  { skill: "MySQL", category: "Database" },
  { skill: "PostgreSQL", category: "Database" },
  { skill: "SQLite", category: "Database" },
  { skill: "Redis", category: "Database" },
  { skill: "Firebase", category: "Database" },
  { skill: "Oracle", category: "Database" },
  { skill: "SQL Server", category: "Database" },

  // Mobile Development
  { skill: "React Native", category: "Mobile Development" },
  { skill: "Flutter", category: "Mobile Development" },
  { skill: "iOS Development", category: "Mobile Development" },
  { skill: "Android Development", category: "Mobile Development" },
  { skill: "Xamarin", category: "Mobile Development" },
  { skill: "Ionic", category: "Mobile Development" },

  // Cloud & DevOps
  { skill: "AWS", category: "Cloud Platform" },
  { skill: "Google Cloud", category: "Cloud Platform" },
  { skill: "Microsoft Azure", category: "Cloud Platform" },
  { skill: "Docker", category: "DevOps" },
  { skill: "Kubernetes", category: "DevOps" },
  { skill: "CI/CD", category: "DevOps" },
  { skill: "Jenkins", category: "DevOps" },
  { skill: "Git", category: "Version Control" },
  { skill: "GitHub", category: "Version Control" },

  // Data Science & AI
  { skill: "Machine Learning", category: "Data Science" },
  { skill: "Deep Learning", category: "Data Science" },
  { skill: "Artificial Intelligence", category: "Data Science" },
  { skill: "Data Analysis", category: "Data Science" },
  { skill: "TensorFlow", category: "Data Science" },
  { skill: "PyTorch", category: "Data Science" },
  { skill: "Pandas", category: "Data Science" },
  { skill: "NumPy", category: "Data Science" },
  { skill: "Scikit-learn", category: "Data Science" },

  // Design
  { skill: "UI/UX Design", category: "Design" },
  { skill: "Graphic Design", category: "Design" },
  { skill: "Web Design", category: "Design" },
  { skill: "Logo Design", category: "Design" },
  { skill: "Adobe Photoshop", category: "Design Tool" },
  { skill: "Adobe Illustrator", category: "Design Tool" },
  { skill: "Figma", category: "Design Tool" },
  { skill: "Sketch", category: "Design Tool" },
  { skill: "Adobe XD", category: "Design Tool" },

  // Digital Marketing
  { skill: "SEO", category: "Digital Marketing" },
  { skill: "Social Media Marketing", category: "Digital Marketing" },
  { skill: "Content Marketing", category: "Digital Marketing" },
  { skill: "Email Marketing", category: "Digital Marketing" },
  { skill: "Google Ads", category: "Digital Marketing" },
  { skill: "Facebook Ads", category: "Digital Marketing" },
  { skill: "Analytics", category: "Digital Marketing" },

  // Content & Writing
  { skill: "Content Writing", category: "Writing" },
  { skill: "Copywriting", category: "Writing" },
  { skill: "Technical Writing", category: "Writing" },
  { skill: "Blog Writing", category: "Writing" },
  { skill: "Creative Writing", category: "Writing" },
  { skill: "Proofreading", category: "Writing" },
  { skill: "Translation", category: "Writing" },

  // Other Skills
  { skill: "WordPress", category: "CMS" },
  { skill: "Shopify", category: "E-commerce" },
  { skill: "WooCommerce", category: "E-commerce" },
  { skill: "Magento", category: "E-commerce" },
  { skill: "API Development", category: "Backend" },
  { skill: "REST API", category: "Backend" },
  { skill: "GraphQL", category: "Backend" },
  { skill: "Microservices", category: "Architecture" },
  { skill: "Testing", category: "Quality Assurance" },
  { skill: "Unit Testing", category: "Quality Assurance" },
  { skill: "Automation Testing", category: "Quality Assurance" },
  { skill: "Manual Testing", category: "Quality Assurance" }
];

async function seedSkills() {
  try {
    // Connect to MongoDB (assuming connection is already established)
    console.log("🌱 Starting skills seeding...");
    
    // Clear existing skills
    await skills.deleteMany({});
    console.log("🗑️ Cleared existing skills");
    
    // Insert new skills
    const result = await skills.insertMany(skillsData);
    console.log(`✅ Successfully seeded ${result.length} skills`);
    
    // Display sample skills
    console.log("\n📋 Sample skills added:");
    const sampleSkills = await skills.find({}).limit(10);
    sampleSkills.forEach(skill => {
      console.log(`   - ${skill.skill} (${skill.category})`);
    });
    
    console.log(`\n🎉 Skills seeding completed! Total skills: ${result.length}`);
    
  } catch (error) {
    console.error("❌ Error seeding skills:", error);
    throw error;
  }
}

export default seedSkills;

// If running directly
if (import.meta.url === `file://${process.argv[1]}`) {
  // Import connection and run seeder
  console.log("🚀 Starting skills seeder script...");
  import("../connection.js").then(async () => {
    console.log("📡 Database connection established");
    try {
      await seedSkills();
      console.log("🎉 Skills seeder completed successfully!");
      process.exit(0);
    } catch (error) {
      console.error("💥 Failed to seed skills:", error);
      process.exit(1);
    }
  }).catch(error => {
    console.error("💥 Failed to connect to database:", error);
    process.exit(1);
  });
}