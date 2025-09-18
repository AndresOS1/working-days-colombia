import express, { Request, Response } from "express";
import router from "./routes.js";

const app = express();

app.disable("x-powered-by");

app.use(router);

// Health check endpoint
app.get("/health", (req: Request, res: Response) =>
  res.status(200).send({ status: "ok" })
);

export default app;
