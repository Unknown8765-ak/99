import type { Request, Response } from "express";
import mongoose from "mongoose";

import { Order } from "../models/order.model.js";
import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";
import { Address } from "../models/address.model.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import Exchange, {ExchangeReason,} from "../models/exchange.model.js";



export const createOrder = asyncHandler(
  async (req, res) => {
    const userId = req.user.id;

    const { addressId, paymentMethod = "cod" } = req.body;

    if (!mongoose.isValidObjectId(addressId)) {
      throw new ApiError(400, "Invalid address ID");
    }

    if (paymentMethod !== "cod") {
      throw new ApiError(
        400,
        "Currently only COD payment is supported"
      );
    }
    

    const session = await mongoose.startSession();

    try {
      let createdOrder;

      await session.withTransaction(async () => {
        const address = await Address.findOne({
          _id: addressId,
          user: userId,
        }).session(session);

        if (!address) {
          throw new ApiError(404, "Address not found");
        }

        const cart = await Cart.findOne({
          user: userId,
        }).session(session);

        if (!cart || cart.items.length === 0) {
          throw new ApiError(400, "Your cart is empty");
        }

        const orderItems = [];
        let subtotal = 0;

        for (const cartItem of cart.items) {
          const product = await Product.findOneAndUpdate(
            {
              _id: cartItem.product,
              isActive: true,
              stock: { $gte: cartItem.quantity },
            },
            {
              $inc: { stock: -cartItem.quantity },
            },
            {
              new: true,
              session,
            }
          );

          if (!product) {
            throw new ApiError(
              400,
              "Product unavailable or insufficient stock"
            );
          }

          const price = product.price;
          const itemSubtotal = price * cartItem.quantity;

          subtotal += itemSubtotal;

          orderItems.push({
            product: product._id,
            name: product.name,
            sku: product.sku,
            image: product.images?.[0],
            quantity: cartItem.quantity,
            price,
            subtotal: itemSubtotal,
          });
        }

        const deliveryCharge = subtotal >= 199 ? 0 : 40;
        const discount = 0;
        const totalAmount = subtotal + deliveryCharge - discount;

        const estimatedDeliveryDate = new Date();
          estimatedDeliveryDate.setDate(
            estimatedDeliveryDate.getDate() + 2
          );

    if(!estimatedDeliveryDate){
      throw new ApiError(404, "delivery date is not found");
    }

        const shippingAddress = {
          fullName: address.fullName,
          phone: address.phone,
          addressLine1: address.addressLine1,
          addressLine2: address.addressLine2,
          city: address.city,
          state: address.state,
          postalCode: address.postalCode,
          country: address.country,
        };

        const order = new Order({
          user: userId,
          items: orderItems,
          shippingAddress,
          subtotal,
          deliveryCharge,
          discount,
          totalAmount,
          estimatedDeliveryDate,
          orderStatus: "confirmed",
          paymentStatus: "pending",
          paymentMethod: "cod",
        });

        await order.save({ session });

        cart.items = [];
        await cart.save({ session });

        createdOrder = order;
      });

      return res.status(201).json(
        new ApiResponse(
          201,
          createdOrder,
          "Order created successfully"
        )
      );
    } finally {
      await session.endSession();
    }
  }
);


export const getMyOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user.id;

    const orders = await Order.find({
      user: userId,
    }).sort({
      createdAt: -1,
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        orders,
        "Orders fetched successfully"
      )
    );
  }
);



export const getOrderById = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { orderId } = req.params;
    const normalizedOrderId = Array.isArray(orderId)
      ? orderId[0]
      : orderId;

    if (!normalizedOrderId || !mongoose.isValidObjectId(normalizedOrderId)) {
      throw new ApiError(400, "Invalid order ID");
    }

    const order = await Order.findOne({
      _id: normalizedOrderId,
      user: userId,
    });

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        order,
        "Order fetched successfully"
      )
    );
  }
);



export const cancelOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user.id;
    const { orderId } = req.params;
    const normalizedOrderId = Array.isArray(orderId)
      ? orderId[0]
      : orderId;

    if (!normalizedOrderId || !mongoose.isValidObjectId(normalizedOrderId)) {
      throw new ApiError(400, "Invalid order ID");
    }

    const session = await mongoose.startSession();

    try {
      let cancelledOrder;

      await session.withTransaction(async () => {
        const order = await Order.findOne({
          _id: normalizedOrderId,
          user: userId,
        }).session(session);

        if (!order) {
          throw new ApiError(404, "Order not found");
        }

        const cancellableStatuses = [
          "pending",
          "confirmed",
          "processing",
        ];

        if (!cancellableStatuses.includes(order.orderStatus)) {
          throw new ApiError(
            400,
            "This order cannot be cancelled"
          );
        }

        for (const item of order.items) {
          await Product.updateOne(
            { _id: item.product },
            { $inc: { stock: item.quantity } },
            { session }
          );
        }

        order.orderStatus = "cancelled";
        order.cancelledAt = new Date();

        await order.save({ session });

        cancelledOrder = order;
      });

      return res.status(200).json(
        new ApiResponse(
          200,
          cancelledOrder,
          "Order cancelled successfully"
        )
      );
    } finally {
      await session.endSession();
    }
  }
);

export const trackOrder = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = req.user.id;

    const { orderId } = req.params;

    const normalizedOrderId = Array.isArray(orderId)
      ? orderId[0]
      : orderId;

    if (
      !normalizedOrderId ||
      !mongoose.isValidObjectId(normalizedOrderId)
    ) {
      throw new ApiError(400, "Invalid order ID");
    }

    const order = await Order.findOne({
      _id: normalizedOrderId,
      user: userId,
    }).select(
      "_id orderStatus createdAt updatedAt cancelledAt deliveredAt"
    );

    if (!order) {
      throw new ApiError(404, "Order not found");
    }

    const statusSteps = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
    ] as const;

    const currentStatus = order.orderStatus;

    const currentStep = statusSteps.indexOf(
      currentStatus as (typeof statusSteps)[number]
    );

    const tracking = statusSteps.map((status, index) => ({
      status,
      completed:
        currentStatus === "cancelled" || currentStatus === "returned"
          ? false
          : index <= currentStep,
      current: status === currentStatus,
    }));

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orderId: order._id,
          orderStatus: order.orderStatus,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt,
          cancelledAt: order.cancelledAt,
          deliveredAt: order.deliveredAt,
          tracking,
        },
        "Order tracking fetched successfully"
      )
    );
  }
);

export const createExchangeRequest = asyncHandler(async (req, res) => {
  const userId = req.user.id;
 const rawOrderId = req.params.orderId;

  const orderId = Array.isArray(rawOrderId)
  ? rawOrderId[0]
  : rawOrderId;
  const { productId, quantity, reason } = req.body;

  if (!mongoose.isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order ID");
  }

  if (!mongoose.isValidObjectId(productId)) {
    throw new ApiError(400, "Invalid product ID");
  }

  if (!quantity || !Number.isInteger(quantity) || quantity < 1) {
    throw new ApiError(
      400,
      "Exchange quantity must be at least 1" 
    );
  }

 if (!reason || typeof reason !== "string" || !reason.trim()) {
  throw new ApiError(400, "Exchange reason is required");
}
    const exchangeReason = reason.trim() as ExchangeReason;

  const order = await Order.findOne({
    _id: orderId,
    user: userId,
  });

  if (!order) {
    throw new ApiError(
      404,
      "Order not found or you are not authorized to access this order"
    );
  }


  if (order.orderStatus !== "delivered") {
    throw new ApiError(
      400,
      "Exchange can only be requested after the order is delivered"
    );
  }


  const orderItem = order.items.find(
    (item) => item.product.toString() === productId
  );

  if (!orderItem) {
    throw new ApiError(
      400,
      "This product does not belong to the selected order"
    );
  }

  if (quantity > orderItem.quantity) {
    throw new ApiError(
      400,
      `You can only exchange up to ${orderItem.quantity} item(s)`
    );
  }


 const existingExchange = await Exchange.findOne({
    order: orderId,
    product: productId,
    user: userId,
    status: {
      $in: [
        "requested",
        "approved",
        "pickup_pending",
        "picked_up",
        "replacement_shipped",
      ],
    },
  });

  if (existingExchange) {
    throw new ApiError(
      400,
      "Exchange request already exists for this product"
    );
  }

  const exchangeRequest = await Exchange.create({
    order: orderId,
    user: userId,
    product: productId,
    quantity,
    reason:exchangeReason,
    status: "requested",
  });


  return res.status(201).json(
    new ApiResponse(
      201,
      exchangeRequest,
      "Exchange request submitted successfully"
    )
  );
});

export const getExchangeRequestStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const userId = req.user.id;

    const normalizedOrderId = Array.isArray(orderId)
      ? orderId[0]
      : orderId;

    if (
      !normalizedOrderId ||
      !mongoose.isValidObjectId(normalizedOrderId)
    ) {
      throw new ApiError(400, "Invalid order ID");
    }

    const exchangeRequest = await Exchange.findOne({
      order: normalizedOrderId,
      user: userId,
    })
      .populate("product", "name images price sku")
      .populate("replacementOrderId");

    if (!exchangeRequest) {
      throw new ApiError(
        404,
        "No exchange request found for this order"
      );
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        exchangeRequest,
        "Exchange request fetched successfully"
      )
    );
  }
);