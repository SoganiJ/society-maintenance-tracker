require('dotenv').config({ path: '../.env' });
const mongoose = require('mongoose');
const Complaint = require('../models/Complaint');

const statusWeights = { open: 4, in_progress: 3, resolved: 2, closed: 1 };
const priorityWeights = { low: 1, medium: 2, high: 3, urgent: 4 };

async function migrate() {
  try {
    // If the .env is in the backend root, we might need path: '../.env' if run from scripts, 
    // actually it's easier to run from backend root. 
    // Let's use path: __dirname + '/../.env'
    require('dotenv').config({ path: __dirname + '/../.env' });
    
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/society-maintenance');
    console.log('Connected to DB');

    const complaints = await Complaint.find();
    let updated = 0;

    for (let c of complaints) {
      c.statusWeight = statusWeights[c.status] || 1;
      c.priorityWeight = priorityWeights[c.priority] || 2;
      // Use updateOne to bypass validation if any
      await Complaint.updateOne({ _id: c._id }, { 
        $set: { 
          statusWeight: c.statusWeight, 
          priorityWeight: c.priorityWeight 
        } 
      });
      updated++;
    }

    console.log(`Migrated ${updated} complaints.`);
    process.exit(0);
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  }
}

migrate();
