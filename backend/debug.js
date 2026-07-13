const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
require('dotenv').config();

(async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    
    // Find an admin user
    const User = require('./models/User');
    const admin = await User.findOne({ role: 'admin' });
    if (!admin) throw new Error('No admin found');
    
    // Generate token
    const token = jwt.sign({ id: admin._id }, 'replace_with_a_long_random_string', { expiresIn: '1h' });

    // get a complaint ID
    const Complaint = require('./models/Complaint');
    const complaint = await Complaint.findOne();
    if (!complaint) throw new Error('No complaint found');
    const id = complaint._id;

    // get a worker ID
    const Worker = require('./models/Worker');
    const worker = await Worker.findOne();
    if (!worker) throw new Error('No worker found');
    const workerId = worker._id;
    
    console.log("Complaint ID:", id);
    console.log("Worker ID:", workerId);
    
    // try to assign
    const assignRes = await fetch(`http://localhost:5000/api/complaints/${id}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ assignedTo: workerId })
    });
    console.log("Assign Response:", await assignRes.json());
    
    // try to change priority
    const prioRes = await fetch(`http://localhost:5000/api/complaints/${id}/assign`, {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ priority: 'urgent' })
    });
    console.log("Priority Response:", await prioRes.json());
    
  } catch (err) {
    console.error("ERROR:", err.message);
  } finally {
    await mongoose.disconnect();
  }
})();
