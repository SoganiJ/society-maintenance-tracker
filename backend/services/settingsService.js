const Settings = require('../models/Settings');

/**
 * Always returns the single global Settings document, creating it with
 * defaults on first access. Every caller (complaint validation, overdue
 * cron, admin panel) goes through this instead of querying Settings
 * directly, so the singleton invariant lives in one place.
 */
const getSettings = async () => {
  let settings = await Settings.findOne({ singletonKey: 'GLOBAL' });
  if (!settings) {
    settings = await Settings.create({ singletonKey: 'GLOBAL' });
  }
  return settings;
};

const updateSettings = async (updates) => {
  const settings = await getSettings();
  Object.assign(settings, updates);
  await settings.save();
  return settings;
};

module.exports = { getSettings, updateSettings };
