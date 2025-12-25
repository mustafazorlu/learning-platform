import userModel from "../models/user.model.js";
import type { Response } from "express";

export const getUserById = async (id: string, res: Response) => {
    const user = await userModel.findById(id);
    res.status(201).json({
        success: true,
        user,
    });
};
