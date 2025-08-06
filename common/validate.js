const passwordComplexity = require("joi-password-complexity");

const complexityOptions = {
  min: 6,
  max: 1024,
  lowerCase: 1,
  upperCase: 1,
  numeric: 1,
  symbol: 1,
  requirementCount: 4,
};

module.exports = passwordComplexity(complexityOptions);
