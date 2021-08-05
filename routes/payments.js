const express = require("express");
const router = express.Router();
const authorization = require("../middlewares/authorization");
require("dotenv").config();
const stripe = require("stripe")(process.env.STRIPE_API_SECRET_KEY);
const cloudinary = require("cloudinary").v2;
const Offer = require("../models/offer");

router.post("/payment", authorization, async (req, res) => {
  try {
    const tokenStripe = req.fields.stripeToken;
    const articlesInfo = req.fields.article;
    const user = req.Usersignup;

    const response = await stripe.charges.create({
      amount: req.fields.price * 100,
      currency: "eur",
      description: articlesInfo.product_name,
      source: tokenStripe,
    });
    /* update BDD */
    const offerToDelete = await Offer.findByIdAndDelete(articlesInfo._id);
    const offerPicturesKeys = Object.keys(offerToDelete.product_image);
    const picturesToDelete = [];
    if (offerPicturesKeys.length <= 5) {
      offerPicturesKeys.forEach((elem) => {
        picturesToDelete.push(
          offerToDelete.product_image[elem].result.public_id
        );
      });
      await cloudinary.api.delete_resources(picturesToDelete);
      await cloudinary.api.delete_folder("Vinted/offers/" + offerToDelete._id);
    } else {
      await cloudinary.api.delete_resources(
        offerToDelete.product_image.public_id
      );
      await cloudinary.api.delete_folder("Vinted/offers/" + offerToDelete._id);
    }

    if (response.status === "succeeded") {
      res.status(200).json({
        status: "succeeded",
        user: user,
        article: offerToDelete,
      });
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
