import { Menu } from "../models/menu.models.js";
import { Shop } from "../models/shop.model.js";
import { uploadFile } from "../service/minio.service.js";

export const createMenu = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const { itemName, itemDescription, price, offerId } = req.body;

    const checkForShop = await Shop.findById(shopId);
    if (!checkForShop) {
      throw new Error("Shop doesn't exist");
    }

    let menu = await Menu.findOne({ shopId });

    if (menu) {
      const existingItem = menu.items.find(
        (item) => item.itemName === itemName
      );

      if (existingItem) {
        throw new Error("Item name already exists");
      }

      let pictureUrl = null;
      if (req.file) {
        pictureUrl = await uploadFile(req.file);
      }

      menu.items.push({
        itemName,
        itemDescription,
        price,
        picture: pictureUrl,
        offerId,
      });
      const updatedMenu = await menu.save();
      res.status(200).json(updatedMenu);
    } else {
      let pictureUrl = null;
      if (req.file) {
        pictureUrl = await uploadFile(req.file);
      }

      const newMenu = new Menu({
        items: [
          {
            itemName,
            itemDescription,
            price,
            picture: pictureUrl,
            offerId,
          },
        ],
        shopId,
      });

      const savedMenu = await newMenu.save();
      res.status(200).json(savedMenu);
    }
  } catch (error) {
    res.status(500).json({
      message: "Failed to create the menu",
      error: error.message,
    });
  }
};

export const getMenuItem = async (req, res) => {
  try {
    const { itemId } = req.params;

    const menu = await Menu.findOne({ "items._id": itemId }, { "items.$": 1 });

    if (!menu) {
      return res.status(404).json({ message: "Menu or item not found" });
    }

    const item = menu.items[0];

    res.status(200).json(item);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get the menu item",
      error: error.message,
    });
  }
};

export const getAllMenuOfShop = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const checkForShop = await Shop.findById(shopId);

    if (!checkForShop) {
      return res.status(404).json({
        message: "Shop doesn't exist",
        error: error.message,
      });
    }

    const menu = await Menu.find({
      shopId,
    });
    res.status(200).json(menu);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get the menu",
      error: error.message,
    });
  }
};

export const getXitems = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search || "";  
    const skip = (page - 1) * limit;

    const searchQuery = {
      $or: [
        { 'items.itemName': { $regex: search, $options: 'i' } }, 
        { 'items.itemDescription': { $regex: search, $options: 'i' } }
      ]
    };

    const menus = await Menu.aggregate([
      { $match: searchQuery }, 
      { $unwind: "$items" },    
      { $skip: skip },     
      { $limit: limit },      
      {
        $project: {
          itemName: "$items.itemName",
          itemDescription: "$items.itemDescription",
          price: "$items.price",
          picture: "$items.picture",
          shopId: "$shopId",
          offerId: "$items.offerId"
        }
      },
    ]);

    const totalItems = await Menu.aggregate([
      { $match: searchQuery },
      { $unwind: "$items" },
      { $count: "totalItems" },
    ]);

    const total = totalItems.length > 0 ? totalItems[0].totalItems : 0;
    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      items: menus,
      pagination: {
        currentPage: page,
        itemsPerPage: limit,
        totalItems: total,
        totalPages: totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to get the items",
      error: error.message,
    });
  }
};


export const updateMenu = async (req, res) => {
  try {
    const { itemId, shopId } = req.params;

    const shop = await Shop.findById(shopId);
    if (!shop) {
      return res.status(404).json({ message: "Shop doesn't exist" });
    }

    const menu = await Menu.findOne({ shopId, "items._id": itemId });
    if (!menu) {
      return res
        .status(404)
        .json({ message: "Menu not found or item does not exist in any menu" });
    }

    const { itemName, itemDescription, price, category } = req.body;

    let pictureUrl;
    if (req.file) {
      pictureUrl = await uploadFile(req.file);
    }

    const duplicateItem = menu.items.find(
      (item) => item.itemName === itemName && item._id.toString() !== itemId
    );

    if (duplicateItem) {
      return res
        .status(400)
        .json({ message: "Item name already exists in this shop's menu" });
    }

    const updateFields = {
      "items.$.itemName": itemName,
      "items.$.itemDescription": itemDescription,
      "items.$.price": price,
      "items.$.category": category,
    };

    if (pictureUrl) {
      updateFields["items.$.picture"] = pictureUrl;
    }

    const updatedMenu = await Menu.findOneAndUpdate(
      { shopId, "items._id": itemId },
      {
        $set: updateFields,
      },
      { new: true }
    );

    if (!updatedMenu) {
      return res
        .status(404)
        .json({ message: "Menu item not found while updating!" });
    }

    res.status(200).json(updatedMenu);
  } catch (error) {
    res.status(500).json({
      message: "Failed to update menu",
      error: error.message,
    });
  }
};

export const deleteItem = async (req, res) => {
  try {
    const shopId = req.params.shopId;
    const itemId = req.params.itemId;

    const checkForShop = await Shop.findById(shopId);
    if (!checkForShop) {
      return res.status(404).json({ message: "Shop doesn't exist" });
    }

    const updatedMenu = await Menu.findOneAndUpdate(
      { shopId, "items._id": itemId },
      { $pull: { items: { _id: itemId } } },
      { new: true }
    );

    if (!updatedMenu) {
      return res.status(404).json({ message: "Menu item not found" });
    }

    res.status(200).json({
      message: "Menu item has been deleted successfully!",
      updatedMenu,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete the menu item",
      error: error.message,
    });
  }
};
