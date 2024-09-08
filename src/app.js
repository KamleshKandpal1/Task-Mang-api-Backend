import dotenv from "dotenv";
import connectDB from "./DB/index.js";
import { app } from "./index.js";

dotenv.config({
  path: "./.env",
});
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Server is runnig at port ${process.env.PORT}`);
    });
    app.on("error", () => {
      console.log("ERR:", error);
      throw error;
    });
  })
  .catch((err) => {
    console.log("Mongo db connection is falied", err);
  });
app.get("/", (req, res) => {
  res.json("Connected");
});
