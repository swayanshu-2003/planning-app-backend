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
exports.getDeletedTodos = exports.restoreTodo = exports.deleteTodo = exports.editTodo = exports.getTodos = exports.createTodo = exports.loginUser = exports.registeruser = void 0;
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
    userId: zod_1.z.number().int().min(1)
});
const todoUpdateSchema = zod_1.z.object({
    title: zod_1.z.string().min(1, { message: "Title is required" }).optional(),
    description: zod_1.z.string().optional(),
    done: zod_1.z.boolean().optional(),
    userId: zod_1.z.number().int().min(1)
}).partial();
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
            },
        });
        return res.status(201).json({
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
                id: true
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
    }
    catch (error) {
    }
});
exports.loginUser = loginUser;
const createTodo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const validateReq = todoSchema.safeParse(req.body);
        if (!validateReq.success) {
            return res.status(400).json({
                success: false,
                message: validateReq.error.issues[0].message,
            });
        }
        const { title, description, done, userId } = validateReq.data;
        console.log(validateReq.data);
        const todo = yield prisma.todo.create({
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
        const todos = yield prisma.todo.findMany({
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
exports.getTodos = getTodos;
const editTodo = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const todoFound = prisma.todo.findUnique({
            where: {
                id: parseInt(req.params.id, 10),
            }
        });
        if (!todoFound) {
            return res.status(404).json({
                success: false,
                message: "no todos found with this id"
            });
        }
        const validateReq = todoUpdateSchema.safeParse(req.body);
        if (!validateReq.success) {
            return res.status(400).json({
                success: false,
                message: "error validating",
            });
        }
        const updatedTodo = validateReq.data;
        const todo = yield prisma.todo.update({
            data: Object.assign({}, updatedTodo),
            select: {
                id: true,
                title: true,
                description: true,
                done: true,
            },
            where: {
                id: parseInt(req.params.id, 10)
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
                id: parseInt(req.params.id, 10),
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
                id: parseInt(req.params.id, 10)
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
                id: parseInt(req.params.id, 10),
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
                id: parseInt(req.params.id, 10)
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
                id: true,
                title: true,
                description: true,
                done: true,
            },
            where: {
                userId: parseInt(req.user.id, 10),
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
