const express = require("express");
const router = express.Router();
const cloudinary = require("cloudinary").v2;
const authorization = require("../middlewares/authorization");
const Offer = require("../models/offer");
const findUser = require("../middlewares/Find-account");

router.post("/offer/publish", authorization, async (req, res) => {
  try {
    const { title, description, price, condition, city, brand, size, color } =
      req.fields;

    const newOffer = await new Offer({
      product_name: title,
      product_description: description,
      product_price: price,
      product_details: [
        { ETAT: condition },
        { MARQUE: brand },
        { TAILLE: size },
        { COULEUR: color },
        { EMPLACEMENT: city },
      ],
      owner: req.Usersignup,
      product_image: {},
    });

    if (req.files) {
      const pictures = Object.keys(req.files);
      results = {};
      pictures.forEach(async (elem) => {
        const picture = req.files[elem];
        const result = await cloudinary.uploader.upload(picture.path, {
          folder: `/Vinted/offers/${newOffer._id}`,
        });
        results[elem] = {
          sucess: true,
          result: result,
        };
        if (Object.keys(results).length === pictures.length) {
          newOffer.product_image = results;
          await newOffer.save();
          res.status(200).json(newOffer);
        }
      });
    } else {
      res.status(200).json(newOffer);
    }
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/offer", async (req, res) => {
  try {
    let search;
    let limitOffer;
    if (req.query.limit) {
      limitOffer = Number(req.query.limit);
    } else {
      limitOffer = 20;
    }
    let skipOffer = 0;
    let sort;
    // Method conditions
    if (req.query.title && !req.query.priceMin && !req.query.priceMax) {
      search = { product_name: new RegExp(req.query.title, "i") };
    }
    if (req.query.title && req.query.priceMax && req.query.priceMin) {
      search = {
        product_name: new RegExp(req.query.title, "i"),
        product_price: {
          $lte: Number(req.query.priceMax),
          $gte: Number(req.query.priceMin),
        },
      };
    }
    if (req.query.priceMax && req.query.priceMin && !req.query.title) {
      search = {
        product_price: {
          $lte: Number(req.query.priceMax),
          $gte: Number(req.query.priceMin),
        },
      };
    }
    if (req.query.priceMax && !req.query.priceMin && !req.query.title) {
      search = { product_price: { $lte: Number(req.query.priceMax) } };
    }
    if (req.query.priceMin && !req.query.priceMax && !req.query.title) {
      search = { product_price: { $gte: Number(req.query.priceMin) } };
    }
    if (req.query.priceMax && !req.query.priceMin && req.query.title) {
      search = {
        product_price: {
          $lte: Number(req.query.priceMax),
        },
        product_name: new RegExp(req.query.title, "i"),
      };
    }
    if (!req.query.priceMax && req.query.priceMin && req.query.title) {
      search = {
        product_price: {
          $gte: Number(req.query.priceMin),
        },
        product_name: new RegExp(req.query.title, "i"),
      };
    }
    // Method empty object search filters
    /*
search = {}
if (req.query.title) {
  search.product_name = new RegExp(req.query.title, "i");
}
if (req.query.priceMin) { 
search.product_price = { $gte: Number(req.query.priceMin) };
}
if (req.query.priceMax) {
  if (search.product_price) {
  search.product_price.$lte = Number(req.query.priceMax);
  } else {
  search.product_price = { $lte: Number(req.query.priceMax) };
  }
}
    */
    if (req.query.sort) {
      if (req.query.sort === "price-asc") {
        sort = { product_price: "asc" };
      } else {
        sort = { product_price: "desc" };
      }
    }
    if (!req.query.page || req.query.page < 1) {
      limitOffer = 20;
    } else {
      skipOffer = limitOffer * req.query.page - limitOffer;
    }
    console.log(limitOffer);
    let offers = await Offer.find(search)
      .sort(sort)
      .skip(skipOffer)
      .limit(limitOffer)
      .select(
        "product_details product_name product_desciption product_price product_image.secure_url product_image.original_filename owner"
      );
    const count = await Offer.find(search).countDocuments();
    // loop for check and return user info = .populate()
    offers = await findUser(offers);

    res.status(200).json({
      count: count,
      offers: offers,
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.put("/offer/upload/:id", authorization, async (req, res) => {
  try {
    const newDoc = await Offer.findById(req.params.id);
    console.log(newDoc.product_image.public_id);
    if (req.fields.product_name) {
      newDoc.product_name = req.fields.product_name;
    }
    if (req.fields.product_price) {
      newDoc.product_price = req.fields.product_price;
    }
    if (req.fields.product_description) {
      newDoc.product_description = req.fields.product_description;
    }
    // loop for change product_details
    if (req.fields.product_details) {
      for (let j = 0; j < req.fields.product_details.length; j++) {
        let key = Object.keys(req.fields.product_details[j]);
        for (let i = 0; i < newDoc.product_details.length; i++) {
          let keys = Object.keys(newDoc.product_details[i]);
          if (keys[0] === key[0]) {
            newDoc.product_details[i][keys] =
              req.fields.product_details[j][key];
          }
        }
      }
    }
    if (req.files.picture) {
      await cloudinary.uploader.destroy(newDoc.product_image.public_id);
      const imageModified = await cloudinary.uploader.upload(
        req.files.picture.path,
        {
          folder: "/Vinted/offers/" + req.params.id,
        }
      );
      newDoc.product_image = imageModified;
    }
    // Method to change an object in db
    newDoc.markModified("product_details");
    await newDoc.save();
    res.status(200).json(newDoc);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/offer/delete/:id", authorization, async (req, res) => {
  try {
    const offerToDelete = await Offer.findByIdAndDelete(req.params.id);
    if (!offerToDelete) {
      res.status(400).json({ message: "Offer already deleted or not exist" });
    } else {
      await cloudinary.uploader.destroy(offerToDelete.product_image.public_id);
      await cloudinary.api.delete_folder("Vinted/offers/" + req.params.id);
      res.status(200).json({ message: "Offer has been delete" });
    }
  } catch (error) {
    res.status(400).json({ error });
  }
});

router.get("/offer/:id", async (req, res) => {
  try {
    let viewOffer = await Offer.find({ _id: req.params.id })
      .populate(
        "owner",
        "account.username account.phone account.avatar.secure_url account.avatar.original_filename"
      )
      .select(
        "product_details product_name product_desciption product_price product_image"
      );
    // loop to check user account = .populate()
    // viewOffer = await findUser(viewOffer);

    res.status(200).json(viewOffer);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});
module.exports = router;
