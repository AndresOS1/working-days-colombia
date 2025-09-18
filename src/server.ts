import express, { Request, Response } from "express";
import dotenv from "dotenv";
import router from "./routes.js";

dotenv.config({ quiet: true });

const app = express();

app.disable("x-powered-by");

app.use(router);

const PORT = process.env.PORT || "3000";

// Health check endpoint
app.get("/health", (request: Request, res: Response) =>
  res.status(200).send({ status: "ok" })
);

app
  .listen(Number(PORT), () => {
    console.log("Server running at PORT: ", PORT);
  })
  .on("error", (error: Error) => {
    throw new Error(error.message);
  });
