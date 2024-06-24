"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createComment = exports.addCollaborator = exports.getSharableLink = exports.getCompletedTodos = exports.getDeletedTodos = exports.restoreTodo = exports.deleteTodo = exports.editTodo = exports.getTodoDetails = exports.getTodos = exports.createTodo = exports.getUserData = exports.loginUser = exports.registeruser = void 0;
const client_1 = require("@prisma/client");
const auth_1 = require("../utils/auth");
const zod_1 = require("zod");
const prisma = new client_1.PrismaClient();
const userSchema = zod_1.z.object({
    username: zod_1.z.string().min(3, { message: "Username must be at least 3 characters long" }),
    password: zod_1.z.string().min(3, { message: "Password must be at least 3 characters long" }),
    firstName: zod_1.z.string().min(1, { message: "First name is required" }),
    lastName: zod_1.z.string().min(1, { message: "Last name is required" }),
});
const todoSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, { message: "Title is required" }),
    description: zod_1.z.string().optional(),
    done: zod_1.z.boolean().optional(),
});
const registeruser = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield prisma.user.create({
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
        const token = (0, auth_1.createToken)(user);
        return res.status(201).json({
            token,
            success: true,
            message: "User created successfully",
            user,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});
exports.registeruser = registeruser;
const loginUser = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { username, password } = req.body;
        const user = yield prisma.user.findUnique({
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
        });
        if ((user === null || user === void 0 ? void 0 : user.password) !== password) {
            return res.status(401).json({
                success: false,
                message: "Invalid username or password",
            });
        }
        const token = (0, auth_1.createToken)(user);
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
    }
    catch (error) {
    }
});
exports.loginUser = loginUser;
const getUserData = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user) {
            return res.status(404).json({
                success: false,
                message: "User Not Found"
            });
        }
        const user = req.user;
        return res.status(200).json({
            success: true,
            user
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
});
exports.getUserData = getUserData;
const createTodo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const todo = yield prisma.todo.create({
            data: {
                title,
                description,
                done,
                ownerId,
            },
        });
        return res.status(201).json({
            success: true,
            message: "todo created successfully",
            todo,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});
exports.createTodo = createTodo;
const getTodos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { type } = req.query;
        let todos = [];
        switch (type) {
            case 'owned':
                todos = yield prisma.todo.findMany({
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
                todos = yield prisma.todo.findMany({
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
                todos = yield prisma.todo.findMany({
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
                todos = yield prisma.todo.findMany({
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
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});
exports.getTodos = getTodos;
const getTodoDetails = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const todoId = req.params.uuid;
        if (!todoId) {
            return res.status(404).json({
                success: false,
                message: "Please provide a todo UUID",
            });
        }
        const todo = yield prisma.todo.findUnique({
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
        const finalTodo = Object.assign({}, todo);
        if (todo.ownerId === req.user.uuid) {
            finalTodo.isOwner = true;
            finalTodo.isCollaborator = false;
        }
        else {
            finalTodo.isOwner = false;
            finalTodo.isCollaborator = true;
        }
        res.status(200).json({
            success: true,
            todo: finalTodo,
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});
exports.getTodoDetails = getTodoDetails;
const editTodo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const todoFound = prisma.todo.findUnique({
            where: {
                uuid: req.params.uuid,
            }
        });
        if (!todoFound) {
            return res.status(404).json({
                success: false,
                message: "no todos found with this id"
            });
        }
        const updatedTodo = req.body;
        const todo = yield prisma.todo.update({
            data: Object.assign({}, updatedTodo),
            where: {
                uuid: req.params.uuid
            }
        });
        if (!todo) {
            return res.status(500).json({
                success: false,
                message: "internal server error",
                todo
            });
        }
        return res.status(200).json({
            success: true,
            message: "Todo updated successfully",
            todo
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "internal server error"
        });
    }
});
exports.editTodo = editTodo;
const deleteTodo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const todoFound = prisma.todo.findUnique({
            where: {
                uuid: req.params.uuidu,
            }
        });
        if (!todoFound) {
            return res.status(404).json({
                success: false,
                message: "no todos found with this id"
            });
        }
        const deletedTodo = yield prisma.todo.update({
            data: {
                isDeleted: true,
            },
            where: {
                uuid: req.params.uuid
            }
        });
        if (!deletedTodo) {
            return res.status(500).json({
                success: false,
                message: "internal server error",
            });
        }
        res.status(200).json({
            success: true,
            message: "Todo deleted successfully"
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "internal server error"
        });
    }
});
exports.deleteTodo = deleteTodo;
const restoreTodo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const todoFound = prisma.todo.findUnique({
            where: {
                uuid: req.params.uuid,
            }
        });
        if (!todoFound) {
            return res.status(404).json({
                success: false,
                message: "no todos found with this id"
            });
        }
        const deletedTodo = yield prisma.todo.update({
            data: {
                isDeleted: false,
            },
            where: {
                uuid: req.params.uuid
            }
        });
        if (!deletedTodo) {
            return res.status(500).json({
                success: false,
                message: "internal server error",
            });
        }
        res.status(200).json({
            success: true,
            message: "Todo restored successfully"
        });
    }
    catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "internal server error"
        });
    }
});
exports.restoreTodo = restoreTodo;
const getDeletedTodos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const todos = yield prisma.todo.findMany({
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
        });
        return res.status(200).json({
            success: true,
            results: todos.length,
            todos,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});
exports.getDeletedTodos = getDeletedTodos;
const getCompletedTodos = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const todos = yield prisma.todo.findMany({
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
        });
        return res.status(200).json({
            success: true,
            results: todos.length,
            todos,
        });
    }
    catch (err) {
        console.error(err);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});
exports.getCompletedTodos = getCompletedTodos;
const getSharableLink = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const todoUuid = req.params.uuid;
    try {
        // Fetch the todo by its uuid
        const todo = yield prisma.todo.findUnique({
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
    }
    catch (error) {
        console.error('Error fetching todo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.getSharableLink = getSharableLink;
const addCollaborator = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const todoUuid = req.params.uuid;
    const userUuid = req.user.uuid; // Assuming userId of the new collaborator
    try {
        // Fetch the todo by its uuid
        const todo = yield prisma.todo.findUnique({
            where: { uuid: todoUuid },
        });
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        if (todo.ownerId === userUuid) {
            return res.status(403).json({ error: 'You are the owner of this todo' });
        }
        // Check if the user is already a collaborator
        const existingCollaborator = yield prisma.todoCollaborator.findFirst({
            where: {
                todoId: todo.uuid,
                userId: userUuid,
            },
        });
        if (existingCollaborator) {
            return res.status(400).json({ error: 'User is already a collaborator' });
        }
        const ownerDetails = yield prisma.user.findUnique({
            where: { uuid: todo.ownerId },
        });
        // Add the user as a collaborator to the todo
        const newCollaborator = yield prisma.todoCollaborator.create({
            data: {
                userId: userUuid,
                todoId: todo.uuid,
            },
        });
        if (!newCollaborator) {
            console.error('Error adding collaborator:');
            return res.status(500).json({ error: 'Internal server error' });
        }
        const da = yield prisma.todo.update({
            where: { uuid: todoUuid },
            data: {
                shared: true,
            }
        });
        res.json({ success: true, message: 'User added as collaborator', collaborator: newCollaborator, todo, owner: ownerDetails });
    }
    catch (error) {
        console.error('Error adding collaborator:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.addCollaborator = addCollaborator;
const createComment = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const todoUuid = req.params.uuid;
    const userUuid = req.user.uuid;
    const { content } = req.body;
    try {
        // Fetch the todo by its uuid
        const todo = yield prisma.todo.findUnique({
            where: { uuid: todoUuid },
        });
        if (!todo) {
            return res.status(404).json({ error: 'Todo not found' });
        }
        if (todo.ownerId !== userUuid) {
            const existingCollaborator = yield prisma.todoCollaborator.findFirst({
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
        const commentData = yield prisma.comment.create({
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
        });
    }
    catch (error) {
        console.error('Error adding comment:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});
exports.createComment = createComment;
