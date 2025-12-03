import type { Request, Response, NextFunction } from "express";
import userModel, { type IUser } from "../models/user.model.js";
import ErrorHandler from "../utils/ErrorHandler.js";
import { CatchAsyncError } from "../middleware/catchAsyncError.js";
import jwt, { type JwtPayload, type Secret } from "jsonwebtoken";
import "dotenv/config";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import sendMail from "../utils/sendMail.js";
import {
    accessTokenOptions,
    refreshTokenOptions,
    sendToken,
} from "../utils/jwt.js";
import { redis } from "../utils/redis.js";
import { getUserById } from "../services/user.service.js";

interface IRegistrationBody {
    name: string;
    email: string;
    password: string;
    avatar?: string;
}

export const registrationUser = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { name, email, password } = req.body;

            const isEmailExist = await userModel.findOne({ email });

            if (isEmailExist) {
                return next(new ErrorHandler("email already taken", 400));
            }

            const user: IRegistrationBody = {
                name,
                email,
                password,
            };

            const activationToken = createActivationToken(user);

            const activationCode = activationToken.activationCode;

            const data = { user: { name: user.name }, activationCode };

            const __filename = fileURLToPath(import.meta.url);
            const __dirname = path.dirname(__filename);

            const html = await ejs.renderFile(
                path.join(__dirname, "../mails/activation-mail.ejs"),
                data
            );

            try {
                await sendMail({
                    email: user.email,
                    subject: "Activate your account",
                    template: "activation-mail.ejs",
                    data,
                });

                res.status(201).json({
                    success: true,
                    message: "please check your email to activate your account",
                    activationToken: activationToken.token,
                });
            } catch (error: any) {
                return next(new ErrorHandler(error.message, 400));
            }
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

interface IActivationToken {
    token: string;
    activationCode: string;
}

export const createActivationToken = (user: any): IActivationToken => {
    const activationCode = Math.floor(1000 + Math.random() * 9000).toString();

    const token = jwt.sign(
        {
            user,
            activationCode,
        },
        process.env.ACTIVATION_SECRET as Secret,
        {
            expiresIn: "5m",
        }
    );

    return { token, activationCode };
};

interface IActivationRequest {
    activation_token: string;
    activation_code: string;
}

export const activateUser = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { activation_token, activation_code } =
                req.body as IActivationRequest;

            const newUser: { user: IUser; activationCode: string } = jwt.verify(
                activation_token,
                process.env.ACTIVATION_SECRET as string
            ) as { user: IUser; activationCode: string };

            if (newUser.activationCode !== activation_code) {
                return next(new ErrorHandler("invalid activation code", 400));
            }

            const { name, email, password } = newUser.user;

            const existUse = await userModel.findOne({ email });

            if (existUse) {
                return next(new ErrorHandler("email already exist", 400));
            }

            const user = await userModel.create({
                name,
                email,
                password,
            });

            res.status(201).json({
                success: true,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

interface ILoginRequest {
    email: string;
    password: string;
}

export const loginUser = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const { email, password } = req.body as ILoginRequest;

            if (!email || !password) {
                return next(
                    new ErrorHandler("please enter email and password", 400)
                );
            }

            console.log("checkpoint #1");

            const user = await userModel.findOne({ email }).select("+password");

            if (!user) {
                return next(new ErrorHandler("invalid email or password", 400));
            }

            console.log("checkpoint #2");

            const isPasswordMatch = await user.comparePassword(password);

            if (!isPasswordMatch) {
                return next(new ErrorHandler("invalid email or password", 400));
            }

            console.log("checkpoint #3");

            sendToken(user, 200, res);
            console.log("checkpoint #4");
        } catch (error: any) {
            return next(new ErrorHandler("bi sorun olustu", 400));
        }
    }
);

export const logoutUser = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            res.cookie("access_token", "", { maxAge: 1 });
            res.cookie("refresh_token", "", { maxAge: 1 });
            const userId = req.user?.id || "";
            redis.del(userId);
            res.status(200).json({
                success: true,
                message: "logged out successfuly",
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const updateAccessToken = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const refresh_token = req.cookies.refresh_token as string;
            const decoded = jwt.verify(
                refresh_token,
                process.env.REFRESH_TOKEN as string
            ) as JwtPayload;

            const message = "coulld not refresh token";

            if (!decoded) {
                return next(new ErrorHandler("message", 400));
            }

            const session = await redis.get(decoded.id as string);

            if (!session) {
                return next(new ErrorHandler(message, 400));
            }

            const user = JSON.parse(session);

            const accessToken = jwt.sign(
                { id: user._id },
                process.env.ACCESS_TOKEN as string,
                {
                    expiresIn: "5m",
                }
            );

            const refreshToken = jwt.sign(
                { id: user._id },
                process.env.REFRESH_TOKEN as string,
                {
                    expiresIn: "3d",
                }
            );

            res.cookie("access_token", accessToken, accessTokenOptions);
            res.cookie("refresh_token", refreshToken, refreshTokenOptions);

            res.status(200).json({
                status: "success",
                accessToken,
            });
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

export const getUserInfo = CatchAsyncError(
    async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user?._id;
            getUserById(userId as string, res);
        } catch (error: any) {
            return next(new ErrorHandler(error.message, 400));
        }
    }
);

//3:38:17
