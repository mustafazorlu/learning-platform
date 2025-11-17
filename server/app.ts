import "dotenv/config";
import express, {
    type NextFunction,
    type Request,
    type Response,
} from "express";
export const app = express();
import cors from "cors";
import cookieParser from "cookie-parser";
import { ErrorMiddleware } from "./middleware/error.js";
import userRouter from "./routes/user.route.js";

app.use(express.json({ limit: "50mb" }));
app.use(cookieParser());
app.use(
    cors({
        origin: process.env.ORIGIN,
    })
);

app.use("/api/v1", userRouter);

app.get("/test", (req: Request, res: Response, next: NextFunction) => {
    res.status(200).json({
        success: true,
        message: "api is working",
    });
});

app.all(/.*/, (req: Request, res: Response, next: NextFunction) => {
    const err = new Error(`route ${req.originalUrl} not found`) as any;
    err.statusCode = 404;
    next(err);
});

app.use(ErrorMiddleware);
