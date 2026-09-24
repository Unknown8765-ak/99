import mongoose, {
  Document,
  Schema,
  Types,
} from "mongoose";

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "processing"
  | "shipped"
  | "out_for_delivery"
  | "delivered"
  | "cancelled"
  | "returned";

export type PaymentStatus =
  | "pending"
  | "paid"
  | "failed"
  | "refunded";

export type PaymentMethod = "cod" | "razorpay";

interface IOrderItem {
  product: Types.ObjectId;
  name: string;
  sku: string;
  image?: string;
  quantity: number;
  price: number;
  subtotal: number;
}

interface IShippingAddress {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

/**
 * Order status history
 */
export interface IOrderStatusHistory {
  status: OrderStatus;
  timestamp: Date;
  note?: string;
}

export interface IOrder extends Document {
  user: Types.ObjectId;

  items: IOrderItem[];

  shippingAddress: IShippingAddress;

  subtotal: number;
  deliveryCharge: number;
  discount: number;
  totalAmount: number;

  orderStatus: OrderStatus;

  /**
   * Complete order status timeline
   */
  statusHistory: IOrderStatusHistory[];

  paymentStatus: PaymentStatus;
  paymentMethod: PaymentMethod;

  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;

  cancelledAt?: Date;
  deliveredAt?: Date;

  createdAt: Date;
  updatedAt: Date;
}

const orderItemSchema = new Schema<IOrderItem>(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },

    name: {
      type: String,
      required: true,
      trim: true,
    },

    sku: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: String,
      trim: true,
    },

    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    price: {
      type: Number,
      required: true,
      min: 0,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  {
    _id: false,
  }
);

const shippingAddressSchema = new Schema<IShippingAddress>(
  {
    fullName: {
      type: String,
      required: true,
      trim: true,
    },

    phone: {
      type: String,
      required: true,
      trim: true,
    },

    addressLine1: {
      type: String,
      required: true,
      trim: true,
    },

    addressLine2: {
      type: String,
      trim: true,
    },

    city: {
      type: String,
      required: true,
      trim: true,
    },

    state: {
      type: String,
      required: true,
      trim: true,
    },

    postalCode: {
      type: String,
      required: true,
      trim: true,
    },

    country: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    _id: false,
  }
);

/**
 * Order status history schema
 */
const orderStatusHistorySchema =
  new Schema<IOrderStatusHistory>(
    {
      status: {
        type: String,
        enum: [
          "pending",
          "confirmed",
          "processing",
          "shipped",
          "out_for_delivery",
          "delivered",
          "cancelled",
          "returned",
        ],
        required: true,
      },

      timestamp: {
        type: Date,
        default: Date.now,
      },

      note: {
        type: String,
        trim: true,
      },
    },
    {
      _id: false,
    }
  );

const orderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },

    items: {
      type: [orderItemSchema],
      required: true,

      validate: {
        validator: (items: IOrderItem[]) =>
          items.length > 0,

        message:
          "Order must contain at least one item",
      },
    },

    shippingAddress: {
      type: shippingAddressSchema,
      required: true,
    },

    subtotal: {
      type: Number,
      required: true,
      min: 0,
    },

    deliveryCharge: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    discount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },

    totalAmount: {
      type: Number,
      required: true,
      min: 0,
    },

    orderStatus: {
      type: String,
      enum: [
        "pending",
        "confirmed",
        "processing",
        "shipped",
        "out_for_delivery",
        "delivered",
        "cancelled",
        "returned",
      ],
      default: "pending",
      index: true,
    },

    /**
     * Order tracking history
     */
    statusHistory: {
      type: [orderStatusHistorySchema],
      default: [
        {
          status: "pending",
          timestamp: new Date(),
          note: "Order placed successfully",
        },
      ],
    },

    paymentStatus: {
      type: String,
      enum: [
        "pending",
        "paid",
        "failed",
        "refunded",
      ],
      default: "pending",
      index: true,
    },

    paymentMethod: {
      type: String,
      enum: ["cod", "razorpay"],
      required: true,
    },

    razorpayOrderId: {
      type: String,
      sparse: true,
      index: true,
    },

    razorpayPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },

    razorpaySignature: {
      type: String,
      select: false,
    },

    cancelledAt: Date,

    deliveredAt: Date,
  },
  {
    timestamps: true,
  }
);

orderSchema.index({
  user: 1,
  createdAt: -1,
});

orderSchema.index({
  orderStatus: 1,
  createdAt: -1,
});

export const Order = mongoose.model<IOrder>(
  "Order",
  orderSchema
);