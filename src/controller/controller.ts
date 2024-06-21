import { Request, Response, NextFunction } from 'express';
import { PrismaClient } from '@prisma/client';
import { createToken } from '../utils/auth';
import { z } from 'zod';



const prisma = new PrismaClient();

const userSchema = z.object({
    username: z.string().min(3, { message: "Username must be at least 3 characters long" }),
    password: z.string().min(3, { message: "Password must be at least 3 characters long" }),
    firstName: z.string().min(1, { message: "First name is required" }),
    lastName: z.string().min(1, { message: "Last name is required" }),
});
const todoSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }),
    description: z.string().optional(),
    done: z.boolean().optional(),
    userId: z.number().int().min(1)
});
const todoUpdateSchema = z.object({
    title: z.string().min(1, { message: "Title is required" }).optional(),
    description: z.string().optional(),
    done: z.boolean().optional(),
    userId: z.number().int().min(1)
}).partial();

export const registeruser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Validate the request body against the schema
        const validateReq = userSchema.safeParse(req.body);
        if (!validateReq.success) {
            return res.status(400).json({
                success: false,
                message: validateReq.error.issues[0].message,
            });
        }

        const { username, password, firstName, lastName } = validateReq.data;

        // Create the user in the database
        const user = await prisma.user.create({
            data: {
                username,
                password,
                firstName,
                lastName,
            },
            select: {
                username: true,
                firstName: true,
                lastName: true,
            },
        });

        return res.status(201).json({
            success: true,
            message: "User created successfully",
            user,
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};



export const loginUser = async (req: Request, res: Response) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({
            select: {
                password: true,
                username: true,
                firstName: true,
                lastName: true,
                id: true
            },
            where: {
                username,
            }
        })
        if (user?.password !== password) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }
        const token: string = createToken(user);
        // console.log(token)
        if (!token) {
            return res.status(500).json({
                success: false,
                message: "Internal server error",
            });
        }
        return res.status(200).json({
            success: true,
            token,
            user
        });

    } catch (error) {

    }
}















export const createTodo = async (req: Request, res: Response) => {
    try {
        const validateReq = todoSchema.safeParse(req.body);
        if (!validateReq.success) {
            return res.status(400).json({
                success: false,
                message: validateReq.error.issues[0].message,
            });
        }

        const { title, description, done, userId } = validateReq.data;
        console.log(validateReq.data)

        const todo = await prisma.todo.create({

            data: {
                title,
                description,
                done,
                userId,
            },
            select: {
                User: true,
                title: true,
                description: true,
                done: true,
            },
        })

        return res.status(201).json({
            success: true,
            message: "todo created successfully",
            todo,
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}

export const getTodos = async (req: Request, res: Response) => {
    try {
        const todos = await prisma.todo.findMany({
            select: {
                id: true,
                title: true,
                description: true,
                done: true,
            },
            where: {
                userId: parseInt(req.user.id, 10),
                isDeleted: false
            }
        })
        return res.status(200).json({
            success: true,
            results: todos.length,
            todos,
        });
    }
    catch (err: any) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}


export const editTodo = async (req: Request, res: Response) => {
    try {
        const todoFound = prisma.todo.findUnique({
            where: {
                id: parseInt(req.params.id, 10),
            }
        })
        if (!todoFound) {
            return res.status(404).json({
                success: false,
                message: "no todos found with this id"
            })
        }
        const validateReq = todoUpdateSchema.safeParse(req.body);
        if (!validateReq.success) {
            return res.status(400).json({
                success: false,
                message: "error validating",
            })
        }
        const updatedTodo = validateReq.data;

        const todo = await prisma.todo.update({
            data: {
                ...updatedTodo
            },
            select: {
                id: true,
                title: true,
                description: true,
                done: true,
            },
            where: {
                id: parseInt(req.params.id, 10)
            }
        })
        if (!todo) {
            return res.status(500).json({
                success: false,
                message: "internal server error",
                todo
            })
        }
        return res.status(200).json({
            success: true,
            message: "Todo updated successfully",
            todo
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "internal server error"
        })
    }
}

export const deleteTodo = async (req: Request, res: Response) => {
    try {
        const todoFound = prisma.todo.findUnique({
            where: {
                id: parseInt(req.params.id, 10),
            }
        })
        if (!todoFound) {
            return res.status(404).json({
                success: false,
                message: "no todos found with this id"
            })
        }
        const deletedTodo = await prisma.todo.update({
            data: {
                isDeleted: true,
            },
            where: {
                id: parseInt(req.params.id, 10)
            }
        })
        if (!deletedTodo) {
            return res.status(500).json({
                success: false,
                message: "internal server error",
            })
        }
        res.status(200).json({
            success: true,
            message: "Todo deleted successfully"
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "internal server error"
        })
    }
}


export const restoreTodo = async (req: Request, res: Response) => {
    try {
        const todoFound = prisma.todo.findUnique({
            where: {
                id: parseInt(req.params.id, 10),
            }
        })
        if (!todoFound) {
            return res.status(404).json({
                success: false,
                message: "no todos found with this id"
            })
        }
        const deletedTodo = await prisma.todo.update({
            data: {
                isDeleted: false,
            },
            where: {
                id: parseInt(req.params.id, 10)
            }
        })
        if (!deletedTodo) {
            return res.status(500).json({
                success: false,
                message: "internal server error",
            })
        }
        res.status(200).json({
            success: true,
            message: "Todo restored successfully"
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "internal server error"
        })
    }
}

export const getDeletedTodos = async (req: Request, res: Response) => {
    try {
        const todos = await prisma.todo.findMany({
            select: {
                id: true,
                title: true,
                description: true,
                done: true,
            },
            where: {
                userId: parseInt(req.user.id, 10),
                isDeleted: true
            }
        })
        return res.status(200).json({
            success: true,
            results: todos.length,
            todos,
        });
    }
    catch (err: any) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}




