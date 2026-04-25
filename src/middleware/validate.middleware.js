const { validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const errorMsg = errors.array().map(e => e.msg).join(', ');
    console.warn('[Validation Failed]', errorMsg, req.body);
    return res.status(400).json({ success: false, message: errorMsg, errors: errors.array() });
  }
  next();
};

module.exports = { validate };
