import "dotenv/config";
import { Redis } from "ioredis";

const redisClient = () => {
    const redisUrl = process.env.REDIS_URL;
    if (redisUrl) {
        console.log("redis connected");
        return redisUrl;
    }

    throw new Error("redis connection failed");
};

export const redis = new Redis(redisClient());
