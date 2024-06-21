import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"

export const createToken = (user: any) => {
    const token: string = jwt.sign({ user: user }, "swayanshu", {
        expiresIn: "5d"
    });
    return token
}

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "No token Provided"
        })
    }
    const token = authHeader.split(" ")[1];
    try {
        const decoded: any = await jwt.verify(token, "swayanshu");
        req.user = decoded.user;
        // console.log(decoded)
        next();
    } catch (error) {
        console.error(error);
    }
}

