import type { Request, Response } from "express";

import { Product } from "../models/product.model.js";
import { Category } from "../models/category.model.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

// 1. CREATE PRODUCT
export const createProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      name,
      slug,
      description,
      category,
      images,
      price,
      stock,
      sku,
    } = req.body;

    const existingCategory = await Category.findOne({
      _id: category,
      isActive: true,
    });

    if (!existingCategory) {
      throw new ApiError(404, "Active category not found");
    }

    const existingProduct = await Product.findOne({
      $or: [{ slug }, { sku }],
    });

    if (existingProduct) {
      throw new ApiError(
        409,
        "Product with this slug or SKU already exists"
      );
    }

    const product = await Product.create({
      name,
      slug,
      description,
      category,
      images,
      price,
      stock,
      sku,
    });

    return res
      .status(201)
      .json(
        new ApiResponse(201, product, "Product created successfully")
      );
  }
);


// 2. GET ALL PRODUCTS
export const getAllProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      isActive,
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

    const filter: Record<string, unknown> = {};

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { sku: { $regex: search, $options: "i" } },
      ];
    }

    if (category) {
      filter.category = category;
    }

    if (isActive !== undefined) {
      filter.isActive = isActive === "true";
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          products,
          pagination: {
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProducts / limitNumber),
            totalProducts,
            limit: limitNumber,
          },
        },
        "Products fetched successfully"
      )
    );
  }
);


// 3. GET PRODUCT BY ID
export const getProductById = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await Product.findById(id)
      .populate("category", "name slug")
      .lean();

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return res
      .status(200)
      .json(
        new ApiResponse(200, product, "Product fetched successfully")
      );
  }
);


// 4. UPDATE PRODUCT
export const updateProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const {
      name,
      slug,
      description,
      category,
      images,
      price,
      stock,
      sku,
      isActive,
    } = req.body;

    const product = await Product.findById(id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (category) {
      const existingCategory = await Category.findOne({
        _id: category,
        isActive: true,
      });

      if (!existingCategory) {
        throw new ApiError(404, "Active category not found");
      }
    }

    if (slug || sku) {
      const duplicateProduct = await Product.findOne({
        _id: { $ne: product._id },
        $or: [
          ...(slug ? [{ slug }] : []),
          ...(sku ? [{ sku }] : []),
        ],
      });

      if (duplicateProduct) {
        throw new ApiError(
          409,
          "Another product with this slug or SKU already exists"
        );
      }
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      {
        $set: {
          ...(name !== undefined && { name }),
          ...(slug !== undefined && { slug }),
          ...(description !== undefined && { description }),
          ...(category !== undefined && { category }),
          ...(images !== undefined && { images }),
          ...(price !== undefined && { price }),
          ...(stock !== undefined && { stock }),
          ...(sku !== undefined && { sku }),
          ...(isActive !== undefined && { isActive }),
        },
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("category", "name slug");

    return res.status(200).json(
      new ApiResponse(
        200,
        updatedProduct,
        "Product updated successfully"
      )
    );
  }
);


// 5. DELETE PRODUCT (SOFT DELETE)
export const deleteProduct = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    if (!product.isActive) {
      throw new ApiError(400, "Product is already inactive");
    }

    product.isActive = false;
    await product.save();

    return res
      .status(200)
      .json(
        new ApiResponse(200, null, "Product deleted successfully")
      );
  }
);

// 6. GET ACTIVE PRODUCTS
export const getActiveProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 10,
      search,
      category,
      sort = "newest",
    } = req.query;

    const pageNumber = Math.max(Number(page), 1);
    const limitNumber = Math.min(Math.max(Number(limit), 1), 100);

    const filter: Record<string, unknown> = {
      isActive: true,
    };

    if (search) {
      filter.name = {
        $regex: search,
        $options: "i",
      };
    }

    if (category) {
      filter.category = category;
    }

    let sortOption: Record<string, 1 | -1> = {
      createdAt: -1,
    };

    if (sort === "price_low") {
      sortOption = { price: 1 };
    }

    if (sort === "price_high") {
      sortOption = { price: -1 };
    }

    const skip = (pageNumber - 1) * limitNumber;

    const [products, totalProducts] = await Promise.all([
      Product.find(filter)
        .populate("category", "name slug")
        .sort(sortOption)
        .skip(skip)
        .limit(limitNumber)
        .lean(),

      Product.countDocuments(filter),
    ]);

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          products,
          pagination: {
            currentPage: pageNumber,
            totalPages: Math.ceil(totalProducts / limitNumber),
            totalProducts,
            limit: limitNumber,
          },
        },
        "Active products fetched successfully"
      )
    );
  }
);


// 7. GET PRODUCT BY SLUG
export const getProductBySlug = asyncHandler(
  async (req: Request, res: Response) => {
    const { slug } = req.params;

    if (typeof slug !== "string") {
      throw new ApiError(400, "Invalid product slug");
    }

    const product = await Product.findOne({
      slug,
      isActive: true,
    })
      .populate("category", "name slug")
      .lean();

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    return res.status(200).json(
      new ApiResponse(
        200,
        product,
        "Product fetched successfully"
      )
    );
  }
);

export const getSimilarProducts = asyncHandler(
  async (req: Request, res: Response) => {
    const { id } = req.params;

    const product = await Product.findById(id);

    if (!product) {
      throw new ApiError(404, "Product not found");
    }

    const products = await Product.find({
      category: product.category,
      _id: { $ne: product._id },
      isActive: true,
    })
      .sort({ createdAt: -1 })
      .limit(10)
      .populate("category", "name slug");

    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          products,
          "Similar products fetched successfully"
        )
      );
  }
);