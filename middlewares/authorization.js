const User = require("../models/Usersignup");

const isAuthenticated = async (req, res, next) => {
  if (req.headers.authorization) {
    const user = await User.findOne({
      token: req.headers.authorization.replace("Bearer ", ""),
    }).select("_id token account");
    if (user) {
      req.Usersignup = user;
      return next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

module.exports = isAuthenticated;
