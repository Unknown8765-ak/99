import "./config/env.js";
import dbConnection from "./db/index.js";
import { app } from "./app.js";

const PORT = Number(process.env.PORT) || 8000;

console.log("PORT:", PORT);

dbConnection()
  .then(() => {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Server is running on Port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Mongoose connection error:", error);
    process.exit(1);
  });