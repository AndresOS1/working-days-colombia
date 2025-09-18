import { Request, Response } from "express";

export const healthCheck = (req: Request, res: Response) => {
  res.status(200).json({ status: "ok" });
};

export const helloWorld = (req: Request, res: Response) => {
  res.status(200).json({ message: "Hello World" });
};
