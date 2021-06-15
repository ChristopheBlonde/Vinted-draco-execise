const express = require("express");
const uid2 = require("uid2");
const SHA256 = require("crypto-js/sha256");
const encBase64 = require("crypto-js/enc-base64");
const router = express.Router();
const Usersignup = require("../models/Usersignup");
const cloudinary = require("cloudinary").v2;
const isAuthenticated = require("../middlewares/authorization");
const Mongoose = require("mongoose");

router.post("/user/signup", async (req, res) => {
  try {
    const emailExist = await Usersignup.find({ email: req.fields.email });
    const userNameTest = await Usersignup.find({
      "account.username": req.fields.username,
    });
    if (!emailExist[0] && !userNameTest[0]) {
      const newSalt = uid2(16);
      const newHash = SHA256(newSalt + req.fields.password).toString(encBase64);
      const newUser = new Usersignup({
        email: req.fields.email,
        account: {
          username: req.fields.username,
          phone: req.fields.phone,
          avatar: null,
        },
        token: uid2(64),
        hash: newHash,
        salt: newSalt,
      });

      if (req.files.picture) {
        newUser.account.avatar = await cloudinary.uploader.upload(
          req.files.picture.path,
          {
            folder: `Vinted/Avatar/${newUser._id}`,
          }
        );
      }

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

router.put("/user/upload/:id", isAuthenticated, async (req, res) => {
  try {
    const userUplaod = await req.Usersignup;
    // test params id is valid
    if (await Mongoose.Types.ObjectId.isValid(req.params.id)) {
      // test if user connect had same id like id in params
      const userTest = await Usersignup.findById(req.params.id);

      if (userTest._id.toString() === userUplaod._id.toString()) {
        // test if username already exist
        let checkName;
        if (req.fields.username) {
          checkName = await Usersignup.findOne({
            "account.username": req.fields.username,
          });
        }
        // test if email already exist
        let checkEmail;
        if (req.fields.email) {
          checkEmail = await Usersignup.findOne({
            email: req.fields.email,
          });
        }

        if (!checkName) {
          if (!checkEmail) {
            if (req.fields.username) {
              userTest.account.username = req.fields.username;
            }
            if (req.fields.email) {
              userTest.email = req.fields.email;
            }
            if (req.fields.phone) {
              userTest.account.phone = req.fields.phone;
            }
            // Delete holder image and upload new one
            if (req.files.picture) {
              await cloudinary.uploader.destroy(
                userUplaod.account.avatar.public_id
              );

              userTest.account.avatar = await cloudinary.uploader.upload(
                req.files.picture.path,
                {
                  folder: `Vinted/Avatar/${userTest._id}`,
                }
              );
            }
            await userTest.save();
            res.status(200).json(userTest);
          } else {
            res.status(400).json({ message: "Email already had an account" });
          }
        } else {
          res.status(400).json({ message: "Username already used" });
        }
      } else {
        res.status(400).json({ message: "Invalid request" });
      }
    } else {
      res.status(400).json({ message: "invalid id" });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;
