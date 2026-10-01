import type { Request, Response } from "express";
import mongoose from "mongoose";

import { Order } from "../models/order.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

/**
 * GET ALL ORDERS - ADMIN
 *
 * Supports:
 * - Pagination
 * - Search
 * - Order status filter
 * - Payment status filter
 * - Sorting
 */
export const getAllOrders = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      orderStatus = "",
      paymentStatus = "",
      sort = "newest",
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const filter: Record<string, unknown> = {};

    /**
     * Search
     *
     * Since customer name is stored inside shippingAddress,
     * we can search:
     * - Order ID
     * - Customer name
     * - Phone
     * - Postal code
     */
    if (typeof search === "string" && search.trim()) {
      const searchValue = search.trim();

      const searchConditions: Record<string, unknown>[] = [
        {
          "shippingAddress.fullName": {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          "shippingAddress.phone": {
            $regex: searchValue,
            $options: "i",
          },
        },
        {
          "shippingAddress.postalCode": {
            $regex: searchValue,
            $options: "i",
          },
        },
      ];

      /**
       * If search looks like a valid MongoDB ObjectId,
       * allow searching by order ID as well.
       */
      if (mongoose.isValidObjectId(searchValue)) {
        searchConditions.push({
          _id: searchValue,
        });
      }

      filter.$or = searchConditions;
    }

    if (typeof orderStatus === "string" && orderStatus.trim()) {
      filter.orderStatus = orderStatus.trim();
    }

    if (
      typeof paymentStatus === "string" &&
      paymentStatus.trim()
    ) {
      filter.paymentStatus = paymentStatus.trim();
    }
    let sortOption: Record<string, 1 | -1> = {
      createdAt: -1,
    };

    if (sort === "oldest") {
      sortOption = {
        createdAt: 1,
      };
    }

    if (sort === "amount_low") {
      sortOption = {
        totalAmount: 1,
      };
    }

    if (sort === "amount_high") {
      sortOption = {
        totalAmount: -1,
      };
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [orders, totalOrders] = await Promise.all([
      Order.find(filter)
        .populate("user", "name email phone")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Order.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          orders,

          pagination: {
            currentPage: pageNumber,
            totalPages: Math.ceil(
              totalOrders / limitNumber
            ),
            totalOrders,
            limit: limitNumber,
          },
        },
        "Orders fetched successfully"
      )
    );
  }
);


export const getAdminOrderById = asyncHandler(
  async (req: Request, res: Response) => {
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

    const order = await Order.findById(normalizedOrderId)
      .populate("user", "name email phone")
      .populate("items.product", "name slug images price sku")
      .lean();

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

/**
 * UPDATE ORDER STATUS - ADMIN
 *
 * Allowed:
 * pending
 * confirmed
 * processing
 * shipped
 * out_for_delivery
 * delivered
 * cancelled
 * returned
 */
export const updateOrderStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const normalizedOrderId = Array.isArray(orderId)
      ? orderId[0]
      : orderId;

    if (
      !normalizedOrderId ||
      !mongoose.isValidObjectId(normalizedOrderId)
    ) {
      throw new ApiError(400, "Invalid order ID");
    }

    const allowedStatuses = [
      "pending",
      "confirmed",
      "processing",
      "shipped",
      "out_for_delivery",
      "delivered",
      "cancelled",
      "returned",
    ] as const;

    if (!allowedStatuses.includes(status)) {
      throw new ApiError(
        400,
        "Invalid order status"
      );
    }

    const order = await Order.findById(
      normalizedOrderId
    );

    if (!order) {
      throw new ApiError(404, "Order not found");
    }


    if (order.orderStatus === status) {
      throw new ApiError(
        400,
        `Order is already ${status}`
      );
    }

  
    order.orderStatus = status;


    order.statusHistory.push({
      status,
      timestamp: new Date(),
      ...(note &&
        typeof note === "string" && {
          note: note.trim(),
        }),
    });

   
    if (status === "delivered") {
      order.deliveredAt = new Date();
    }

   
    if (status === "cancelled") {
      order.cancelledAt = new Date();
    }

    await order.save();

    const updatedOrder = await Order.findById(
      normalizedOrderId
    )
      .populate("user", "name email phone")
      .populate(
        "items.product",
        "name slug images price sku"
      );

    return res.status(200).json(
      new ApiResponse(
        200,
        updatedOrder,
        "Order status updated successfully"
      )
    );
  }
);