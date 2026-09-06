const requestPasswordResetHandler = require('./request-password-reset').handler;

// For password recovery, redirect all legacy send-otp calls directly to request-password-reset
exports.handler = async function (event) {
  return await requestPasswordResetHandler(event);
};

