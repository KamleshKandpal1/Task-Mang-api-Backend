import express, { urlencoded } from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
const app = express();

app.use(
  cors({
    origin: [process.env.CORS_ORIGIN || "*"],
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);
app.use(
  express.json({
    limit: "20kb",
  })
);
app.use(
  urlencoded({
    extended: true,
    limit: "20kb",
  })
);
app.use(express.static("public"));
app.use(cookieParser());

// routes import
import UserRouter from "./routes/user.routes.js";
import TaskRouter from "./routes/task.routes.js";

// routes declaration
app.use("/api/v1/users", UserRouter);
app.use("/api/v1/tasks", TaskRouter);

export { app };
