module.exports = {
  ROLES: {
    RESIDENT: 'resident',
    ADMIN: 'admin',
  },

  COMPLAINT_STATUS: {
    OPEN: 'open',
    IN_PROGRESS: 'in_progress',
    RESOLVED: 'resolved',
    CLOSED: 'closed',
  },

  COMPLAINT_PRIORITY: {
    LOW: 'low',
    MEDIUM: 'medium',
    HIGH: 'high',
    URGENT: 'urgent',
  },

  NOTICE_TYPE: {
    PINNED: 'pinned',
    IMPORTANT: 'important',
    GENERAL: 'general',
  },

  NOTIFICATION_TYPE: {
    COMPLAINT_UPDATE: 'complaint_update',
    NOTICE: 'notice',
    SYSTEM: 'system',
  },

  DEFAULT_OVERDUE_DAYS: Number(process.env.DEFAULT_OVERDUE_DAYS) || 5,
};
