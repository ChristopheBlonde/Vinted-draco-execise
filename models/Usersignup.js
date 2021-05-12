const mongoose = require("mongoose");

const Usersignup = mongoose.model("Usersignup", {
  email: {
    unique: true,
    type: String,
  },
  account: {
    username: {
      required: true,
      type: String,
    },
    phone: String,
    avatar: Object,
  },
  token: String,
  hash: String,
  salt: String,
});

module.exports = Usersignup;
