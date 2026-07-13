/**
 * Lightweight recursive sanitizer that strips HTML/script tags from
 * incoming request data. Replaces the unmaintained 'xss-clean' package.
 */
const sanitizeValue = (value) => {
  if (typeof value === 'string') {
    return value
      .replace(/<script.*?>.*?<\/script>/gis, '')
      .replace(/<[^>]*>?/gm, '')
      .trim();
  }

  if (Array.isArray(value)) {
    return value.map(sanitizeValue);
  }

  if (value && typeof value === 'object') {
    return Object.keys(value).reduce((acc, key) => {
      acc[key] = sanitizeValue(value[key]);
      return acc;
    }, {});
  }

  return value;
};

const sanitizeInput = (req, res, next) => {
  if (req.body) req.body = sanitizeValue(req.body);
  if (req.query) req.query = sanitizeValue(req.query);
  if (req.params) req.params = sanitizeValue(req.params);
  next();
};

module.exports = sanitizeInput;
