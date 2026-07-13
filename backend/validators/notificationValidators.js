const { param } = require('express-validator');
const mongoose = require('mongoose');

exports.markReadValidator = [
  param('id')
    .custom((value) => mongoose.Types.ObjectId.isValid(value))
    .withMessage('Invalid notification ID'),
];
