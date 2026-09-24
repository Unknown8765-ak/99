import type { Request, Response } from "express";

import { Cart } from "../models/cart.model.js";
import { Product } from "../models/product.model.js";

import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

type AuthenticatedRequest = Request & {
  user?: {
    id?: string;
  };
};

export const addToCart = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;

    const { productId, quantity = 1 } = req.body;

    // 1. Check authenticated user
    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    // 2. Validate quantity
    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new ApiError(
        400,
        "Quantity must be a positive integer"
      );
    }

    // 3. Find active product
    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      throw new ApiError(
        404,
        "Product not found or inactive"
      );
    }

    // 4. Check stock
    if (product.stock < quantity) {
      throw new ApiError(
        400,
        `Only ${product.stock} items are available`
      );
    }

    // 5. Find user's cart
    let cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      // 6. Create new cart
      cart = await Cart.create({
        user: userId,
        items: [
          {
            product: product._id,
            quantity,
            price: product.price,
          },
        ],
      });
    } else {
      // 7. Check whether product already exists
      const existingItem = cart.items.find(
        (item: { product: { toString(): string }; quantity: number; price: number }) =>
          item.product.toString() === product._id.toString()
      );

      if (existingItem) {
        const updatedQuantity =
          existingItem.quantity + quantity;

        // 8. Check combined quantity against stock
        if (updatedQuantity > product.stock) {
          throw new ApiError(
            400,
            `Only ${product.stock} items are available`
          );
        }

        existingItem.quantity = updatedQuantity;

        // Update current price snapshot
        existingItem.price = product.price;
      } else {
        // 9. Add new item
        cart.items.push({
          product: product._id,
          quantity,
          price: product.price,
        });
      }

      await cart.save();
    }

    // 10. Populate product details
    await cart.populate({
      path: "items.product",
      select: "name slug images price stock isActive",
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        cart,
        "Product added to cart successfully"
      )
    );
  }
);

// 2. GET CART
export const getCart = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;

    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.product",
        select: "name slug images price stock isActive",
      })
      .lean();

    if (!cart) {
      return res.status(200).json(
        new ApiResponse(
          200,
          {
            items: [],
            totalItems: 0,
            totalAmount: 0,
          },
          "Cart fetched successfully"
        )
      );
    }

    const validItems = cart.items.filter(
      (item: any) =>
        item.product && item.product.isActive
    );

    const totalItems = validItems.reduce(
      (total: number, item: any) =>
        total + item.quantity,
      0
    );

    const totalAmount = validItems.reduce(
      (total: number, item: any) =>
        total + item.price * item.quantity,
      0
    );

    return res.status(200).json(
      new ApiResponse(
        200,
        {
          ...cart,
          items: validItems,
          totalItems,
          totalAmount,
        },
        "Cart fetched successfully"
      )
    );
  }
);

// 3. UPDATE CART ITEM
export const updateCartItem = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const { productId, quantity } = req.body;

    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    if (
      !Number.isInteger(quantity) ||
      quantity < 1
    ) {
      throw new ApiError(
        400,
        "Quantity must be a positive integer"
      );
    }

    const product = await Product.findOne({
      _id: productId,
      isActive: true,
    });

    if (!product) {
      throw new ApiError(
        404,
        "Product not found or inactive"
      );
    }

    if (quantity > product.stock) {
      throw new ApiError(
        400,
        `Only ${product.stock} items are available`
      );
    }

    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    const item = cart.items.find(
      (item) =>
        item.product.toString() === productId
    );

    if (!item) {
      throw new ApiError(
        404,
        "Product not found in cart"
      );
    }

    item.quantity = quantity;
    item.price = product.price;

    await cart.save();

    await cart.populate({
      path: "items.product",
      select: "name slug images price stock isActive",
    });

    return res.status(200).json(
      new ApiResponse(
        200,
        cart,
        "Cart item updated successfully"
      )
    );
  }
);

// 4. REMOVE FROM CART
export const removeFromCart = asyncHandler(
  async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.id;
    const { productId } = req.params;

    if (!userId) {
      throw new ApiError(401, "Unauthorized request");
    }

    const cart = await Cart.findOne({
      user: userId,
    });

    if (!cart) {
      throw new ApiError(404, "Cart not found");
    }

    const initialLength = cart.items.length;

    cart.items = cart.items.filter(
      (item) =>
        item.product.toString() !== productId
    ) as typeof cart.items;

    if (cart.items.length === initialLength) {
      throw new ApiError(
        404,
        "Product not found in cart"
      );
    }

    await cart.save();

    return res.status(200).json(
      new ApiResponse(
        200,
        cart,
        "Product removed from cart successfully"
      )
    );
  }
);

