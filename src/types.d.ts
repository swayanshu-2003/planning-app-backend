import { Request } from 'express';

declare module 'express-serve-static-core' {
    interface Request {
        user?: any;  // Use an appropriate type for your user object
    }
}