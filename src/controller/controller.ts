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
});


export const registeruser = async (req: any, res: Response, next: NextFunction) => {
    try {
        // Validate the any body against the schema
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
                uuid: true
            },
        });
        const token = createToken(user);
        return res.status(201).json({
            token,
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



export const loginUser = async (req: any, res: Response) => {
    try {
        const { username, password } = req.body;
        const user = await prisma.user.findUnique({
            select: {
                password: true,
                username: true,
                firstName: true,
                lastName: true,
                uuid: true
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


export const getUserData = async (req: any, res: Response) => {
    try {
        if (!req.user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            })
        }
        const user = req.user;
        return res.status(200).json({
            success: true,
            user
        })
    } catch (error) {
        console.error(error)
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        })
    }
}





















export const createTodo = async (req: any, res: Response) => {
    try {
        const validateReq = todoSchema.safeParse(req.body);
        if (!validateReq.success) {
            return res.status(400).json({
                success: false,
                message: validateReq.error.issues[0].message,
            });
        }
        const ownerId = req.user.uuid;
        const { title, description, done } = validateReq.data;

        const todo = await prisma.todo.create({

            data: {
                title,
                description,
                done,
                ownerId,
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

export const getTodos = async (req: any, res: Response) => {
    try {
        const { type } = req.query;
        let todos: any = [];

        switch (type) {
            case 'owned':
                todos = await prisma.todo.findMany({
                    where: {
                        ownerId: req.user.uuid,
                        isDeleted: false,
                        done: false,
                    },
                    include: {
                        owner: true,
                        collaborators: {
                            include: {
                                user: {
                                    select: {
                                        username: true,
                                        firstName: true,
                                        lastName: true,
                                        uuid: true,
                                    },
                                },
                            },
                        },
                    },
                });
                break;

            case 'collab':
                todos = await prisma.todo.findMany({
                    where: {
                        collaborators: {
                            some: {
                                userId: req.user.uuid,
                            },
                        },
                        isDeleted: false,
                    },
                    include: {
                        owner: true,
                        collaborators: {
                            include: {
                                user: {
                                    select: {
                                        username: true,
                                        firstName: true,
                                        lastName: true,
                                        uuid: true,
                                    },
                                },
                            },
                        },
                    },
                });
                break;

            case 'deleted':
                todos = await prisma.todo.findMany({
                    where: {
                        ownerId: req.user.uuid,
                        isDeleted: true,
                    },
                    include: {
                        owner: true,
                        collaborators: {
                            include: {
                                user: {
                                    select: {
                                        username: true,
                                        firstName: true,
                                        lastName: true,
                                        uuid: true,
                                    },
                                },
                            },
                        },
                    },
                });
                break;

            case 'completed':
                todos = await prisma.todo.findMany({
                    where: {
                        ownerId: req.user.uuid,
                        done: true,
                    },
                    include: {
                        owner: true,
                        collaborators: {
                            include: {
                                user: {
                                    select: {
                                        username: true,
                                        firstName: true,
                                        lastName: true,
                                        uuid: true,
                                    },
                                },
                            },
                        },
                    },
                });
                break;

            default:
                return res.status(400).json({ error: 'Invalid type parameter' });
        }

        return res.status(200).json({
            success: true,
            results: todos.length,
            todos,
        });
    } catch (err: any) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
}




export const getTodoDetails = async (req: any, res: Response) => {
    try {
        const todoId = req.params.uuid;
        if (!todoId) {
            return res.status(404).json({
                success: false,
                message: "Please provide a todo UUID",
            });
        }

        const todo = await prisma.todo.findUnique({
            where: {
                uuid: todoId,
            },
            include: {
                owner: true,
                collaborators: {
                    include: {
                        user: {
                            select: {
                                username: true,
                                firstName: true,
                                lastName: true,
                                uuid: true,
                            },
                        },
                    },
                },
                comments: {
                    include: {
                        author: {
                            select: {
                                username: true,
                                firstName: true,
                                lastName: true,
                                uuid: true,
                            },
                        },
                    },
                },
            },
        });

        if (!todo) {
            return res.status(404).json({
                success: false,
                message: "Todo not found",
            });
        }

        const finalTodo: any = { ...todo };
        if (todo.ownerId === req.user.uuid) {
            finalTodo.isOwner = true;
            finalTodo.isCollaborator = false;
        } else {
            finalTodo.isOwner = false;
            finalTodo.isCollaborator = true;
        }

        res.status(200).json({
            success: true,
            todo: finalTodo,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
};

export const editTodo = async (req: any, res: Response) => {
    try {
        const todoFound = prisma.todo.findUnique({
            where: {
                uuid: req.params.uuid,
            }
        })
        if (!todoFound) {
            return res.status(404).json({
                success: false,
                message: "no todos found with this id"
            })
        }

        const updatedTodo = req.body;
        const todo = await prisma.todo.update({
            data: {
                ...updatedTodo
            },
            where: {
                uuid: req.params.uuid
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

export const deleteTodo = async (req: any, res: Response) => {
    try {
        const todoFound = prisma.todo.findUnique({
            where: {
                uuid: req.params.uuidu,
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
                uuid: req.params.uuid
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


export const restoreTodo = async (req: any, res: Response) => {
    try {
        const todoFound = prisma.todo.findUnique({
            where: {
                uuid: req.params.uuid,
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
                uuid: req.params.uuid
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

export const getDeletedTodos = async (req: any, res: Response) => {
    try {
        const todos = await prisma.todo.findMany({
            select: {
                uuid: true,
                title: true,
                description: true,
                done: true,
            },
            where: {
                ownerId: req.user.uuid,
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


export const getCompletedTodos = async (req: any, res: Response) => {
    try {
        const todos = await prisma.todo.findMany({
            select: {
                uuid: true,
                title: true,
                description: true,
                done: true,
            },
            where: {
                ownerId: req.user.uuid,
                done: true
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




export const getSharableLink = async (req: any, res: Response) => {
    const todoUuid = req.params.uuid;

    try {
        // Fetch the todo by its uuid
        const todo = await prisma.todo.findUnique({
            where: { uuid: todoUuid },
            include: { owner: true }, // Include owner details if needed
        });

        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        // Here, you can construct a shareable link however you like
        // Example: Assuming your frontend will construct the full URL
        const shareableLink = `${req.protocol}://${req.get('host')}/todo/${todo.uuid}`;

        // You can also return additional details if needed
        res.json({ shareableLink, todo });
    } catch (error) {
        console.error('Error fetching todo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}


export const addCollaborator = async (req: any, res: Response) => {
    const todoUuid = req.params.uuid;
    const userUuid = req.user.uuid; // Assuming userId of the new collaborator

    try {
        // Fetch the todo by its uuid
        const todo = await prisma.todo.findUnique({
            where: { uuid: todoUuid },
        });

        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        if (todo.ownerId === userUuid) {
            return res.status(403).json({ error: 'You are the owner of this todo' });
        }
        // Check if the user is already a collaborator
        const existingCollaborator = await prisma.todoCollaborator.findFirst({
            where: {
                todoId: todo.uuid,
                userId: userUuid,
            },
        });

        if (existingCollaborator) {
            return res.status(400).json({ error: 'User is already a collaborator' });
        }
        const ownerDetails = await prisma.user.findUnique({
            where: { uuid: todo.ownerId },
        })
        // Add the user as a collaborator to the todo
        const newCollaborator = await prisma.todoCollaborator.create({
            data: {
                userId: userUuid,
                todoId: todo.uuid,
            },
        });
        if (!newCollaborator) {
            console.error('Error adding collaborator:');
            return res.status(500).json({ error: 'Internal server error' });
        }
        const da = await prisma.todo.update({
            where: { uuid: todoUuid },
            data: {
                shared: true,
            }
        })

        res.json({ success: true, message: 'User added as collaborator', collaborator: newCollaborator, todo, owner: ownerDetails });
    } catch (error) {
        console.error('Error adding collaborator:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};




export const createComment = async (req: any, res: Response) => {
    const todoUuid = req.params.uuid;
    const userUuid = req.user.uuid;
    const { content } = req.body;

    try {
        // Fetch the todo by its uuid
        const todo = await prisma.todo.findUnique({
            where: { uuid: todoUuid },
        });

        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }

        if (todo.ownerId !== userUuid) {
            const existingCollaborator = await prisma.todoCollaborator.findFirst({
                where: {
                    todoId: todo.uuid,
                    userId: userUuid,
                },
            });
            if (!existingCollaborator) {
                return res.status(403).json({ error: 'unauthorised' });
            }
            // return res.status(403).json({ error: 'You are the owner of this todo' });
        }
        const commentData = await prisma.comment.create({
            data: {
                content,
                authorId: userUuid,
                todoId: todoUuid,
            }
        });
        if (!commentData) {
            return res.status(500).json({ error: 'Internal server error' });
        }
        return res.status(200).json({
            success: true,
            message: 'Comment added successfully',
            comment: commentData,
        })

    } catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }


}



