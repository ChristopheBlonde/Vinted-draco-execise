const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const router = express.Router();
const Usersignup = require("../models/Usersignup");
const cloudinary = require("cloudinary").v2;

router.post("/user/signup", async (req, res) => {
  try {
    const emailExist = await Usersignup.find({ email: req.fields.email });
    const userNameTest = await Usersignup.find({
      username: req.fields.username,
    });
    if (!emailExist[0] || userNameTest[0]) {
      const newSalt = uid2(16);
      const newHash = SHA256(newSalt + req.fields.password).toString(encBase64);
      const newUser = new Usersignup({
        email: req.fields.email,
        account: {
          username: req.fields.username,
          phone: req.fields.phone,
          avatar: await cloudinary.uploader.upload(req.files.picture.path, {
            folder: `Vinted/Avatar/${req.fields.username}`,
          }),
        },
        token: uid2(64),
        hash: newHash,
        salt: newSalt,
      });
      await newUser.save();

      res.status(200).json({
        _id: newUser.id,
        token: newUser.token,
        account: newUser.account,
      });
    } else {
      res
        .status(409)
        .json({ message: "email already exist or invalid user name" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.post("/user/login", async (req, res) => {
  try {
    const userLogin = await Usersignup.find({ email: req.fields.email });
    if (userLogin[0]) {
      const testHashValid = SHA256(
        userLogin[0].salt + req.fields.password
      ).toString(encBase64);
      if (userLogin[0] && testHashValid === userLogin[0].hash) {
        res.status(200).json({
          _id: userLogin[0].id,
          token: userLogin[0].token,
          account: userLogin[0].account,
        });
      } else {
        res.status(401).json({ message: "Invalid email or password." });
      }
    } else {
      res.status(401).json({ message: "Account not found" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;
