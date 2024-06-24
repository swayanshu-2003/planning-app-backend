import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken"

export const createToken = (user: any) => {
    const token: string = jwt.sign({ user: user }, "swayanshu", {
        expiresIn: "5d"
    });
    return token
}

export const verifyToken = async (req: any, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;
    console.log(authHeader)
    if (!authHeader) {
        return res.status(401).json({
            success: false,
            message: "No token Provided"
        })
    }
    const token = authHeader.split(" ")[1];
    console.log(token)
    try {
        const decoded: any = await jwt.verify(token, "swayanshu");
        req.user = decoded.user;
        console.log(req.user)
        next();
    } catch (error) {
        console.error(error);
    }
}

