const cron = require('node-cron');
const Complaint = require('../models/Complaint');
const ComplaintHistory = require('../models/ComplaintHistory');
const User = require('../models/User');
const { getSettings } = require('../services/settingsService');
const { notify } = require('../services/notificationService');
const { COMPLAINT_STATUS, ROLES, NOTIFICATION_TYPE } = require('../config/constants');

/**
 * Initializes the background cron job that scans for overdue complaints.
 * Runs every minute in development for quick testing, but typically
 * you'd run this once an hour or daily in production (e.g., '0 * * * *').
 */
const startOverdueJob = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const settings = await getSettings();
      const overdueDays = settings.overdueDays;

      // Calculate the cutoff date (e.g. 5 days ago)
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - overdueDays);

      // Find complaints that are open/in-progress, older than the cutoff, and not already flagged
      const overdueComplaints = await Complaint.find({
        status: { $in: [COMPLAINT_STATUS.OPEN, COMPLAINT_STATUS.IN_PROGRESS] },
        isOverdue: false,
        createdAt: { $lt: cutoffDate },
      });

      if (overdueComplaints.length === 0) return;

      console.log(`[Cron] Found ${overdueComplaints.length} newly overdue complaints. Flagging...`);

      const admins = await User.find({ role: ROLES.ADMIN, isActive: true }).select('_id');

      for (const complaint of overdueComplaints) {
        complaint.isOverdue = true;
        complaint.overdueSince = new Date();
        await complaint.save();

        // Add history entry
        await ComplaintHistory.create({
          complaint: complaint._id,
          status: complaint.status,
          note: 'Automatically flagged as overdue by system.',
        });

        // Notify all admins
        const notifications = admins.map((admin) =>
          notify({
            user: admin._id,
            type: NOTIFICATION_TYPE.COMPLAINT_UPDATE,
            title: 'SLA Breached: Complaint Overdue',
            message: `"${complaint.title}" has exceeded the ${overdueDays}-day SLA.`,
            relatedComplaint: complaint._id,
          })
        );
        await Promise.allSettled(notifications);
      }

      console.log(`[Cron] Successfully flagged ${overdueComplaints.length} complaints.`);
    } catch (error) {
      console.error('[Cron] Error running overdue job:', error);
    }
  });

  console.log('Background worker started: Overdue Complaint Scanner');
};

module.exports = startOverdueJob;
