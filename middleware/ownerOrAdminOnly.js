module.exports = function (req, res, next) {
  if (req.user.role !== "owner" && req.user.role !== "admin") {
    return res
      .status(403)
      .send("Only owners or admins can perform this action.");
  }
  next();
};
