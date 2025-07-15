// This is a meta package that automatically installs @auth-strategy-manager/core
// See README.md for details and usage examples.

const core = require('@auth-strategy-manager/core');

// Re-export all named exports
Object.keys(core).forEach((key) => {
  exports[key] = core[key];
});

// Re-export default export
module.exports = core;
