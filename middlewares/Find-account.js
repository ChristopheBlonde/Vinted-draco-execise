const account = require("../models/Usersignup");

const user = async (offer) => {
  const arr = [];
  for (let i = 0; i < offer.length; i++) {
    const offerUser = await account
      .find({
        _id: offer[i].owner,
      })
      .select(
        "_id account.username account.phone account.avatar.secure_url account.avatar.original_filename"
      );
    offer[i].owner = offerUser[0];
    arr.push(offer[i]);
  }
  return arr;
};

module.exports = user;
