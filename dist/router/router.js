"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.router = void 0;
const express_1 = __importDefault(require("express"));
const controller_1 = require("../controller/controller");
const auth_1 = require("../utils/auth");
exports.router = express_1.default.Router();
//route for user 
exports.router.route('/user/create').post(controller_1.registeruser);
exports.router.route('/user/login').post(controller_1.loginUser);
//todo routes
exports.router.route('/todos').get(auth_1.verifyToken, controller_1.getTodos);
exports.router.route('/todos/deleted').get(auth_1.verifyToken, controller_1.getDeletedTodos);
exports.router.route('/todo/create').post(auth_1.verifyToken, controller_1.createTodo);
exports.router.route('/todo/edit/:id').patch(auth_1.verifyToken, controller_1.editTodo);
exports.router.route('/todo/delete/:id').delete(auth_1.verifyToken, controller_1.deleteTodo);
exports.router.route('/todo/restore/:id').get(auth_1.verifyToken, controller_1.restoreTodo);
