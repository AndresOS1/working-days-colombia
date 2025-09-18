import dotenv from "dotenv";
import app from "./app";

dotenv.config({ quiet: true });

const PORT = process.env.PORT || "3000";

app
  .listen(Number(PORT), () => {
    console.log("Server running at PORT:", PORT);
  })
  .on("error", (error: Error) => {
    throw new Error(error.message);
  });
