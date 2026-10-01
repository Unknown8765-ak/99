import type { Request, Response } from "express";
import mongoose from "mongoose";

import { User } from "../models/user.model.js";
import { Order } from "../models/order.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

export const getAllCustomers = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search = "",
      isActive,
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(
      Math.max(Number(limit), 1),
      100
    );

    const filter: Record<string, unknown> = {
      role: "customer",
    };

    if (search && typeof search === "string") {
      filter.$or = [
        {
          name: {
            $regex: search,
            $options: "i",
          },
        },
        {
          email: {
            $regex: search,
            $options: "i",
          },
        },
        {
          phone: {
            $regex: search,
            $options: "i",
          },
        },
      ];
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [customers, totalCustomers] = await Promise.all([
      User.find(filter)
        .select(
          "_id name email phone role isEmailVerified isActive createdAt updatedAt"
        )
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      User.countDocuments(filter),
    ]);

    const customerIds = customers.map(
      (customer) => customer._id
    );

    const orderStats = await Order.aggregate([
      {
        $match: {
          user: {
            $in: customerIds,
          },
        },
      },
      {
        $group: {
          _id: "$user",
          totalOrders: {
            $sum: 1,
          },
          totalSpent: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const statsMap = new Map(
      orderStats.map((stat) => [
        stat._id.toString(),
        {
          totalOrders: stat.totalOrders,
          totalSpent: stat.totalSpent,
        },
      ])
    );

    const customersWithStats = customers.map((customer) => {
      const stats = statsMap.get(customer._id.toString());

      return {
        ...customer,
        totalOrders: stats?.totalOrders ?? 0,
        totalSpent: stats?.totalSpent ?? 0,
      };
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          customers: customersWithStats,
          pagination: {
            currentPage: pageNumber,
            totalPages: Math.ceil(
              totalCustomers / limitNumber
            ),
            totalCustomers,
            limit: limitNumber,
          },
        },
        "Customers fetched successfully"
      )
    );
  }
);

export const getCustomerById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const customerId = Array.isArray(id) ? id[0] : id;

    if (
      !customerId ||
      !mongoose.isValidObjectId(customerId)
    ) {
      throw new ApiError(
        400,
        "Invalid customer ID"
      );
    }

    const customer = await User.findOne({
      _id: customerId,
      role: "customer",
    })
      .select(
        "_id name email phone role isEmailVerified isActive createdAt updatedAt"
      )
      .lean();

    if (!customer) {
      throw new ApiError(
        404,
        "Customer not found"
      );
    }

    const orderStats = await Order.aggregate([
      {
        $match: {
          user: new mongoose.Types.ObjectId(customerId),
        },
      },
      {
        $group: {
          _id: null,
          totalOrders: {
            $sum: 1,
          },
          totalSpent: {
            $sum: "$totalAmount",
          },
        },
      },
    ]);

    const recentOrders = await Order.find({
      user: customerId,
    })
      .select(
        "_id items totalAmount orderStatus paymentStatus paymentMethod createdAt"
      )
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const stats = orderStats[0] ?? {
      totalOrders: 0,
      totalSpent: 0,
    };

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          customer,
          stats: {
            totalOrders: stats.totalOrders,
            totalSpent: stats.totalSpent,
          },
          recentOrders,
        },
        "Customer fetched successfully"
      )
    );
  }
);

export const updateCustomerStatus = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { isActive } = req.body;

    if (
      !id ||
      !mongoose.isValidObjectId(id)
    ) {
      throw new ApiError(
        400,
        "Invalid customer ID"
      );
    }

    if (typeof isActive !== "boolean") {
      throw new ApiError(
        400,
        "isActive must be a boolean"
      );
    }

    const customer = await User.findOne({
      _id: id,
      role: "customer",
    });

    if (!customer) {
      throw new ApiError(
        404,
        "Customer not found"
      );
    }

    customer.isActive = isActive;

    await customer.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          _id: customer._id,
          name: customer.name,
          email: customer.email,
          isActive: customer.isActive,
        },
        `Customer ${
          isActive ? "activated" : "deactivated"
        } successfully`
      )
    );
  }
);