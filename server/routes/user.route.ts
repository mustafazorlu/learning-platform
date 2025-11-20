import express from "express";
import {
    activateUser,
    loginUser,
    logoutUser,
    registrationUser,
} from "../controllers/user.controller.js";
import { isAuthenticated } from "../middleware/auth.js";
const userRouter = express.Router();

userRouter.post("/registration", registrationUser);
userRouter.post("/activate-user", activateUser);
userRouter.post("/login", loginUser);
userRouter.get("/logout", isAuthenticated, logoutUser);

export default userRouter;

//2 44 05
