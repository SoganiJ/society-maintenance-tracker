const Notification = require('../models/Notification');

const notify = ({ user, type, title, message, relatedComplaint = null, relatedNotice = null }) =>
  Notification.create({ user, type, title, message, relatedComplaint, relatedNotice });

module.exports = { notify };
