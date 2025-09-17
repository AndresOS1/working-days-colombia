import express, { Request, Response } from "express";
import dotenv from "dotenv";

dotenv.config({quiet: true});
const app = express();

const PORT = process.env.PORT;

app.get("/", (request: Request, response: Response) => { 
  response.status(200).send("Hello World");
}); 
app.get("/health", (_req, res) => res.status(200).send({ status: "ok" }));

app.listen(PORT, () => { 
  console.log("Server running at PORT: ", PORT); 
}).on("error", (error) => {
  throw new Error(error.message);
});