import { Document, Model, Schema, Types, model } from "mongoose";


export type ExchangeReason =
  | "damaged"
  | "wrong_product"
  | "size_issue"
  | "defective"
  | "missing_item"
  | "other";

export type ExchangeStatus =
  | "requested"
  | "approved"
  | "rejected"
  | "pickup_pending"
  | "picked_up"
  | "replacement_shipped"
  | "completed";


export interface IExchange extends Document {
  order: Types.ObjectId;
  user: Types.ObjectId;
  product: Types.ObjectId;
  quantity: number; 
  reason: ExchangeReason; 
  status: ExchangeStatus; 
  adminNote?: string; 
  rejectedReason?: string;  
  replacementOrderId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}


const exchangeSchema = new Schema<IExchange>(
  {

    order: {
      type: Schema.Types.ObjectId,
      ref: "Order",
      required: true,
    },

    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },



    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },


    quantity: {
      type: Number,
      required: true,
      min: 1,
    },

    reason: {
      type: String,
      enum: [
        "damaged",
        "wrong_product",
        "size_issue",
        "defective",
        "missing_item",
        "other",
      ],
      required: true,
    },


    status: {
      type: String,
      enum: [
        "requested",
        "approved",
        "rejected",
        "pickup_pending",
        "picked_up",
        "replacement_shipped",
        "completed",
      ],
      default: "requested",
    },


    adminNote: {
      type: String,
      trim: true,
    },
    
    rejectedReason: {
      type: String,
      trim: true,
    },

    replacementOrderId: {
      type: Schema.Types.ObjectId,
      ref: "Order",
    },
  },
  {
    timestamps: true,
  }
);

// Useful for finding all exchange requests
// belonging to a particular user.
exchangeSchema.index({ user: 1 });

// Useful for finding exchanges for an order.
exchangeSchema.index({ order: 1 });

// Useful for admin filtering by status.
exchangeSchema.index({ status: 1 });


const Exchange: Model<IExchange> = model<IExchange>(
  "Exchange",
  exchangeSchema
);

export default Exchange;