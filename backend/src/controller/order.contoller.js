import { Order } from "../models/order.model.js";

export const createOrder = async (req, res) => {
  try {
    const {
      userId,
      items,
      cartTotal,
      transactionId,
      originalQuantity,
      totalItems,
      totalSavings,
    } = req.body;

    console.log("req body: ", req.body);

    const existingOrder = await Order.findOne({ transactionId });
    if (existingOrder) {
      return res.status(400).json({
        success: false,
        message: "Order with this transaction ID already exists.",
      });
    }

    if (!userId || !items || items.length === 0 || !cartTotal || !transactionId) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields.",
      });
    }

    const order = new Order({
      userId,
      items,
      cartTotal,
      transactionId,
      originalQuantity,
      totalItems,
      totalSavings,
    });

    const savedOrder = await order.save();

    return res.status(201).json({
      success: true,
      message: "Order created successfully.",
      order: savedOrder,
    });
  } catch (error) {
    console.error("Error in creating order: ", error.message);
    return res.status(500).json({
      success: false,
      message: "Failed to create the order.",
      error: error.message,
    });
  }
};


export const getAllUserOrder = async (req, res) => {
  try {
    const userId = req.params.userId;
    const userOrder = await Order.find({ userId });
    res.status(200).json(userOrder);
  } catch (error) {
    res.status(500).json({
      message: "Failed to get all the user order",
      error: error.message,
    });
  }
};

export const getOrdersForOwner = async (req, res) => {
  try {
    const { shopId } = req.params;
    const { search } = req.query;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    
    let query = { "items.shopId": shopId };
    
    if (search?.trim()) {
      const searchTerm = search.trim();
      
      const idSearchPattern = searchTerm.toLowerCase();
      
      const allOrders = await Order.find({ "items.shopId": shopId })
        .select('_id')
        .lean();
        
      const matchingIds = allOrders
        .filter(order => 
          order._id.toString().slice(-8).toLowerCase().includes(idSearchPattern)
        )
        .map(order => order._id);

      query = {
        "items.shopId": shopId,
        $or: [
          { _id: { $in: matchingIds } },
          { transactionId: new RegExp(searchTerm, 'i') },
          { "items.itemName": new RegExp(searchTerm, 'i') }
        ]
      };
    }

    const totalOrders = await Order.countDocuments(query);
    
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select({
        _id: 1,
        transactionId: 1,
        createdAt: 1,
        status: 1,
        cartTotal: 1,
        totalItems: 1,
        totalSavings: 1,
        'items._id': 1,
        'items.itemName': 1,
        'items.quantity': 1,
        'items.basePrice': 1,
        'items.finalPrice': 1,
        'items.appliedOffer': 1
      })
      .lean();

    const processedOrders = orders.map(order => ({
      ...order,
      _id: order._id.toString()
    }));
      
    res.status(200).json({
      orders: processedOrders,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalOrders / limit),
        totalOrders,
        hasMore: page * limit < totalOrders
      }
    });
  } catch (error) {
    console.error('Order fetch error:', error);
    res.status(500).json({
      message: "Failed to get the order details",
      error: error.message
    });
  }
};


export const deleteOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const deletedOrder = await Order.findByIdAndDelete(orderId);

    if (!deletedOrder) {
      return res.status(404).json({
        message: "Order not found",
      });
    }

    res.status(200).json({
      message: "Order and its items deleted successfully",
      deletedOrder,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete order",
      error: error.message,
    });
  }
};

export const updateOrderStatus = async(req, res) => {
  try {
    const { orderId } = req.params;
    const status = "collected";
    const order = await Order.findByIdAndUpdate(
      orderId,
      { status }, 
      { new: true } 
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    res.status(200).json({
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update the order status",
      error: error.message,
    });
  }
}
