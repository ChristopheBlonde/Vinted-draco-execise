const moogose = require("mongoose");

const Offer = moogose.model("Offer", {
  product_name: String,
  product_description: String,
  product_price: Number,
  product_details: Array,
  product_image: { type: moogose.Schema.Types.Mixed, default: {} },
  owner: {
    type: moogose.Schema.Types.ObjectId,
    ref: "Usersignup",
  },
});

module.exports = Offer;
