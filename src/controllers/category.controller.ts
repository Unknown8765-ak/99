import type { Request, Response } from "express";

import { Category } from "../models/category.model.js";
import { Product } from "../models/product.model.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// 1. CREATE CATEGORY
export const createCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { name, slug, description, image } = req.body;

    const existingCategory = await Category.findOne({
      $or: [{ name }, { slug }],
    });

    if (existingCategory) {
      throw new ApiError(
        409,
        "Category with this name or slug already exists"
      );
    }

    const category = await Category.create({
      name,
      slug,
      description,
      image,
    });

    return res.status(201).json(
      new ApiResponse(
        201,
        category,
        "Category created successfully"
      )
    );
  }
);

// 2. GET ALL CATEGORIES (ADMIN)
export const getAllCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await Category.find()
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json(
      new ApiResponse(
        200,
        categories,
        "Categories fetched successfully"
      )
    );
  }
);

// 3. GET CATEGORY BY ID
export const getCategoryById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const category = await Category.findById(id).lean();

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        category,
        "Category fetched successfully"
      )
    );
  }
);

// 4. UPDATE CATEGORY
export const updateCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;
    const { name, slug, description, image, isActive } = req.body;

    const category = await Category.findById(id);

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    if (name || slug) {
      const duplicateCategory = await Category.findOne({
        _id: { $ne: id as string },
        $or: [
          ...(name ? [{ name }] : []),
          ...(slug ? [{ slug }] : []),
        ],
      });

      if (duplicateCategory) {
        throw new ApiError(
          409,
          "Another category with this name or slug already exists"
        );
      }
    }

    const updatedCategory = await Category.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(description !== undefined && { description }),
          ...(image !== undefined && { image }),
          ...(isActive !== undefined && { isActive }),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        updatedCategory,
        "Category updated successfully"
      )
    );
  }
);

// 5. DELETE CATEGORY (SOFT DELETE)
export const deleteCategory = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    if (typeof id !== "string") {
      throw new ApiError(400, "Invalid category ID");
    }

    const category = await Category.findById(id);

    if (!category) {
      throw new ApiError(404, "Category not found");
    }

    const productExists = await Product.exists({
      category: id,
      isActive: true,
    });

    if (productExists) {
      throw new ApiError(
        400,
        "Cannot deactivate category containing active products"
      );
    }

    category.isActive = false;
    await category.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        null,
        "Category deactivated successfully"
      )
    );
  }
);

// 6. GET ACTIVE CATEGORIES (PUBLIC)
export const getActiveCategories = asyncHandler(
  async (_req: Request, res: Response) => {
    const categories = await Category.find({
      isActive: true,
    })
      .sort({ name: 1 })
      .lean();

    return res.status(200).json(
      new ApiResponse(
        200,
        categories,
        "Active categories fetched successfully"
      )
    );
  }
);