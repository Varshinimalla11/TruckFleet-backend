// authorizeRole.js
module.exports = function (...allowedRoles) {
  return function (req, res, next) {
    if (!req.user || !allowedRoles.includes(req.user.role)) {
      return res.status(403).send("Access denied. Insufficient permissions.");
    }
    next();
  };
};
