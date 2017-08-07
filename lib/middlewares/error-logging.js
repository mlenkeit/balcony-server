'use strict';

const HttpError = require('./../util/HttpError');

module.exports = function() {
  return function(err, req, res, next) {
    if (err instanceof HttpError && err.isClientError === true) {
      req.logMessage('warn', 'HTTP client error', {
        statusCode: err.statusCode,
        message: err.message
      });
    } else {
      req.logMessage('error', 'HTTP server error', {
        statusCode: err.statusCode,
        message: err.message,
        name: err.name,
        stack: err.stack
      });
    }
    next(err);
  };
};
