/**
 * Admin Seed Script
 *
 * Creates a default admin user if one does not already exist.
 * Run this once after first deployment or during local development.
 *
 * Usage:
 *   node scripts/seedAdmin.js
 *
 * Customize admin credentials via env vars or edit the defaults below.
 */

require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../models/User');

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || 'admin@society.com';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'Admin@1234';
const ADMIN_NAME = process.env.ADMIN_NAME || 'Society Admin';
const ADMIN_FLAT = process.env.ADMIN_FLAT || 'ADMIN';

const seed = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    const existing = await User.findOne({ email: ADMIN_EMAIL });
    if (existing) {
      console.log(`Admin already exists: ${ADMIN_EMAIL} (role: ${existing.role})`);

      // Ensure the existing user has admin role
      if (existing.role !== 'admin') {
        existing.role = 'admin';
        await existing.save({ validateBeforeSave: false });
        console.log('→ Updated role to admin');
      }
    } else {
      await User.create({
        name: ADMIN_NAME,
        email: ADMIN_EMAIL,
        password: ADMIN_PASSWORD,
        flatNumber: ADMIN_FLAT,
        role: 'admin',
        isActive: true,
        isEmailVerified: true,
      });
      console.log(`Admin created successfully!`);
      console.log(`  Email:    ${ADMIN_EMAIL}`);
      console.log(`  Password: ${ADMIN_PASSWORD}`);
      console.log(`  ⚠️  Change this password after first login!`);
    }
  } catch (err) {
    console.error('Seed failed:', err.message);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
};

seed();
