import express from "express";
import router from "./routes.js";

const app = express();

app.disable("x-powered-by");

app.use(router);

export default app;
