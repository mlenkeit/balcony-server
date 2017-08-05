'use strict';

class ValidationError extends Error {

  constructor(errors, fileName, lineNumber) {
    super('Validation failed', fileName, lineNumber);
    this.errors = errors;
  }

}

module.exports = ValidationError;