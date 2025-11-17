import "dotenv/config";
import { app } from "./app.js";
import connectDB from "./utils/db.js";

app.listen(process.env.PORT, () => {
    console.log("server is connected" + " " + process.env.PORT);
    connectDB();
});
