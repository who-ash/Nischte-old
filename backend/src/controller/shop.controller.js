import { Shop } from "../models/shop.model.js";
import { uploadFile } from "../service/minio.service.js";

export const createShop = async (req, res) => {
  try {
    const { shopName, address, contactNo, ownerId, email } = req.body;

    const pictureUrl = await uploadFile(req.file);

    const newShop = new Shop({
      shopName,
      email,
      address,
      contactNo,
      picture: pictureUrl,
      ownerId,
    });

    const savedShop = await newShop.save();

    res.status(201).json({
      message: "Shop created successfully!",
      shop: savedShop,
    });
  } catch (error) {
    console.error("Error creating shop:", error);
    res.status(500).json({
      message: "Failed to create shop",
      error: error.message,
    });
  }
};

export const getShops = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 15;
    const search = req.query.search || "";

    const skip = (page - 1) * limit;

    const searchQuery = search
      ? {
          $or: [
            { shopName: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
            { contactNo: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const total = await Shop.countDocuments(searchQuery);

    const shops = await Shop.find(searchQuery)
      .skip(skip)
      .limit(limit)
      .sort({ shopName: 1 });

    res.status(200).json({
      shops,
      total,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page * limit < total,
    });
  } catch (error) {
    console.error("Error fetching shops:", error);
    res.status(500).json({
      message: "Failed to get the shops",
      error: error.message,
    });
  }
};

// Return all the shop of particular owner
export const getAllOwnerShops = async (req, res) => {
  try {
    const ownerId = req.params.ownerId;
    const shops = await Shop.find({ ownerId });
    res.status(200).json(shops);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get shop details",
      error: error.message,
    });
  }
};

// Return particular shop
export const getShop = async (req, res) => {
  try {
    const shopId = req.params.id;
    const shop = await Shop.findById(shopId);
    
    if (!shop) {
      return res.status(404).json({ success: false, message: "Shop not found" });
    }

    res.status(200).json({ success: true, shop });
  } catch (error) {
    res.status(500).json({
      success: false, 
      message: "Failed to get shop details",
      error: error.message,
    });
  }
};


export const updateShop = async (req, res) => {
  try {
    const shopId = req.params.id;
    // console.log("body", req.body)
    const updateData = { ...req.body};
    if ( req.file ) {
      // console.log("file check", req.file)
      const pictureUrl = await uploadFile(req.file);
      updateData.picture = pictureUrl;
    }
    const updatedShop = await Shop.findByIdAndUpdate(
      shopId,
      {
        $set: updateData,
      },
      {
        new: true,
      }
    );
    res.status(200).json(updatedShop);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update shop details",
      error: error.message,
    });
  }
};

export const deleteUser = async (req, res) => {
  try {
    await Shop.findByIdAndDelete(req.params.id);
    // Todo: Delete corresponding sharing fields
    res.status(200).json({
      message: "Shop has been deleted successfully!",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete shop",
      error: error.message,
    });
  }
};
