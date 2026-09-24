import cors from "cors";
import express from "express";
import cookieParser from "cookie-parser";
import helmet from "helmet";

const app = express();

app.use(helmet());
console.log("cors",process.env.CORS_ORIGIN)
console.log("PORT APP",process.env.PORT)
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || "http://localhost:5000",
    credentials: true,
  })
);

app.use(express.json({limit: "16kb",}));
app.use(express.urlencoded({extended: true,limit: "16kb",}));
app.use(cookieParser());
app.use(express.static("public"));


app.get("/", (_req, res) => {
  res.status(200).json({
    success: true,
    message: "99 API is running",
  });
});
import authRoutes from "./routes/auth.routes.js";
import categoryRoutes from "./routes/category.route.js";
import uploadRoutes from "./routes/upload.routes.js";
import cartRoutes from "./routes/cart.routes.js";
import addressRoutes from "./routes/address.routes.js";
import orderRoutes from "./routes/order.routes.js";
import productRoutes from "./routes/product.routes.js";
import supportRoutes from "./routes/support.routes.js";
import wishlistRoutes from "./routes/wishlist.routes.js"


app.use("/api/v1/auth", authRoutes);
app.use("/api/v1/categories", categoryRoutes);
app.use("/api/v1/uploads", uploadRoutes);
app.use("/api/v1/cart", cartRoutes);
app.use("/api/v1/addresses", addressRoutes);
app.use("/api/v1/orders", orderRoutes);
app.use("/api/v1/products", productRoutes);
app.use("/api/v1/support", supportRoutes);
app.use("/api/v1/wishlist", wishlistRoutes);

export { app };