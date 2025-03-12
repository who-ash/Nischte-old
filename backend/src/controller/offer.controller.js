import { Menu } from "../models/menu.models.js";
import { Offer } from "../models/offer.model.js";
import { Order } from "../models/order.model.js";
import mongoose from "mongoose";

export const createOffer = async (req, res) => {
  try {
    const { shopId, itemId, offerType, offerDescription, _isActive } = req.body;
    console.log("Received Request Body:", req.body);

    let isOfferExist = await Offer.findOne({ shopId, itemId });
    console.log("Existing Offer Found:", isOfferExist);

    if (isOfferExist) {
      console.log("Updating Existing Offer...");
      const newOffer = {
        offerType: { name: offerType.name },
        offerDescription: {
          discountRate: offerDescription.discountRate,
          minOrder: offerDescription.minOrder,
          plusOffers: offerDescription.plusOffers,
          specialOccasionDate: offerDescription.specialOccasionDate,
          discountDishes: offerDescription.discountDishes,
          numberOfVisits: offerDescription.numberOfVisits,
          description: offerDescription.description,
        },
        _isActive,
      };

      isOfferExist.offers.push(newOffer);
      const savedOffer = await isOfferExist.save();
      console.log("Updated Offer Saved:", savedOffer);

      const newSubDocumentId =
        savedOffer.offers[savedOffer.offers.length - 1]._id;
      console.log("New Offer Subdocument ID:", newSubDocumentId);

      const menuUpdateResult = await Menu.updateOne(
        { shopId, "items._id": itemId },
        { $push: { "items.$.offerId": newSubDocumentId } }
      );

      console.log("Menu Update Result:", menuUpdateResult);

      return res.status(200).json(savedOffer);
    } else {
      console.log("Creating New Offer Document...");
      const newOfferDocument = new Offer({
        shopId,
        itemId,
        offers: [
          {
            offerType: { name: offerType.name },
            offerDescription: {
              discountRate: offerDescription.discountRate,
              minOrder: offerDescription.minOrder,
              plusOffers: offerDescription.plusOffers,
              specialOccasionDate: offerDescription.specialOccasionDate,
              discountDishes: offerDescription.discountDishes,
              numberOfVisits: offerDescription.numberOfVisits,
              description: offerDescription.description,
            },
            _isActive,
          },
        ],
      });

      const savedNewOffer = await newOfferDocument.save();
      console.log("New Offer Document Saved:", savedNewOffer);

      const newSubDocumentId = savedNewOffer.offers[0]._id;
      console.log("New Offer Subdocument ID:", newSubDocumentId);

      const menuUpdateResult = await Menu.updateOne(
        { shopId, "items._id": itemId },
        { $push: { "items.$.offerId": newSubDocumentId } }
      );

      console.log("Menu Update Result:", menuUpdateResult);

      return res.status(201).json(savedNewOffer);
    }
  } catch (error) {
    console.error("Error in creating offer:", error.message);
    return res.status(500).json({
      message: "Not able to create offer",
      error: error.message,
    });
  }
};


export const getAllOffers = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const itemId = req.params.itemId;
    const offers = await Offer.find({
      shopId, 
      itemId,
    });
    res.status(200).json({
      message: "Offers retrieved successfully",
      offers,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to retrieve offers",
      error: error.message,
    });
  }
};

export const offerWithOutMetaData = async (req, res) => {
  try {
    const offerIds = req.query.offerId
      ? req.query.offerId.split(",").map((id) => id.trim())
      : [];

    const validOfferIds = offerIds.filter((id) => mongoose.isValidObjectId(id));

    if (validOfferIds.length === 0) {
      return res.status(400).json({ message: "No valid offer IDs provided." });
    }

    const offers = await Offer.find({
      "offers._id": { $in: validOfferIds },
      "offers._isActive": true,
    });

    if (offers.length === 0) {
      return res.status(404).json({ message: "No offers found." });
    }

    const itemIds = [...new Set(offers.map((doc) => doc.itemId))];

    const menuItems = await Menu.find(
      { "items._id": { $in: itemIds } },
      { "items.$": 1 }
    );

    const itemNameMap = menuItems.reduce((acc, menu) => {
      if (menu.items && menu.items[0]) {
        acc[menu.items[0]._id.toString()] = menu.items[0].itemName;
      }
      return acc;
    }, {});

    const matchingOffers = offers.flatMap((doc) =>
      doc.offers
        .filter(
          (offer) =>
            validOfferIds.includes(offer._id.toString()) && offer._isActive
        )
        .map((offer) => ({
          itemId: doc.itemId,
          itemName: itemNameMap[doc.itemId] || null,
          shopId: doc.shopId,
          _id: offer._id,
          offerType: offer.offerType,
          offerDescription: offer.offerDescription,
          isActive: offer._isActive,
        }))
    );

    if (matchingOffers.length === 0) {
      return res
        .status(404)
        .json({ message: "No matching active offers found." });
    }

    res.status(200).json({ offers: matchingOffers });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "An error occurred while fetching offers.",
      error: error.message,
    });
  }
};

const checkOfferEligibility = async (offer, visitCount) => {
  return offer.offerDescription.numberOfVisits <= visitCount;
};

export const isOfferEligible = async (req, res) => {
  try {
    const { offerIds } = req.body;
    const applicableOffers = [];

    const objectIds = offerIds.map((id) => new mongoose.Types.ObjectId(id));
    const allOffersData = await Offer.find(
      { "offers._id": { $in: objectIds } },
      { offers: 1, shopId: 1, _id: 1 }
    );

    for (const offerData of allOffersData) {
      const matchingOffers = offerData.offers.filter((offer) =>
        objectIds.some((id) => id.equals(offer._id))
      );

      for (const matchedOffer of matchingOffers) {
        const visitCount = await Order.countDocuments({
          "items.shopId": offerData.shopId,
        });

        const isEligible = await checkOfferEligibility(
          matchedOffer,
          visitCount
        );

        if (isEligible) {
          applicableOffers.push({
            offerId: matchedOffer._id,
            parentId: offerData._id,
            isActive: matchedOffer._isActive,
          });
        }
      }
    }

    return res.status(200).json({
      success: true,
      applicableOffers,
    });
  } catch (error) {
    console.error("Error processing offers:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to process the offers",
      error: error.message,
    });
  }
};

export const getSpecificOfferDetails = async (req, res) => {
  try {
    const offer = await Offer.find(
      {
        "offers._id": req.params.id,
      },
      { "offers.$": 1 }
    );
    if (!offer) {
      return res.status(404).json({
        message: "Offer not found",
      });
    }
    res.status(200).json({
      message: "Offer retrieved successfully",
      offer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to retrieve the offer",
      error: error.message,
    });
  }
};

export const updateOffer = async (req, res) => {
  try {
    const { offerType, offerDescription, _isActive } = req.body;
    const offerId = req.params.id;
    const offer = await Offer.findOne({
      "offers._id": offerId,
    });

    if (!offer) {
      throw new Error("Offer not found!");
    }

    const offerToBeUpdated = offer.offers.find(
      (offer) => offer._id.toString() === offerId
    );

    if (!offerToBeUpdated) {
      throw new Error("There is no offer that exists!");
    }

    offerToBeUpdated.offerDescription = {
      discountRate: offerDescription.discountRate,
      minOrder: offerDescription.minOrder,
      plusOffers: offerDescription.plusOffers,
      specialOccasionDate: offerDescription.specialOccasionDate,
      discountDishes: offerDescription.discountDishes,
      numberOfVisits: offerDescription.numberOfVisits,
      description: offerDescription.description,
    };
    offerToBeUpdated._isActive = _isActive;

    const updatedOffer = await offer.save();

    res.status(200).json({
      message: "Offer updated successfully",
      offer: updatedOffer,
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to update the offer",
      error: error.message,
    });
  }
};

export const deleteOffer = async (req, res) => {
  try {
    const { id } = req.params;
    const { shopId, itemId } = req.body;

    const updatedOffer = await Offer.findOneAndUpdate(
      { shopId, itemId },
      { $pull: { offers: { _id: id } } },
      { new: true }
    );

    if (!updatedOffer) {
      return res.status(404).json({
        message: "Offer not found",
      });
    }

    await Menu.updateOne(
      {
        shopId,
        "items._id": itemId,
      },
      {
        $pull: {
          "items.$.offerId": id,
        },
      }
    );

    res.status(200).json({
      message: "Offer deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Unable to delete the offer",
      error: error.message,
    });
  }
};
