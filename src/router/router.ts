import express from 'express';
import { registeruser, createTodo, getTodos, loginUser, editTodo, deleteTodo, restoreTodo, getDeletedTodos } from '../controller/controller';
import { verifyToken } from '../utils/auth';

export const router = express.Router();

//route for user 
router.route('/user/create').post(registeruser);
router.route('/user/login').post(loginUser);





//todo routes
router.route('/todos').get(verifyToken, getTodos);
router.route('/todos/deleted').get(verifyToken, getDeletedTodos);
router.route('/todo/create').post(verifyToken, createTodo);
router.route('/todo/edit/:id').patch(verifyToken, editTodo);
router.route('/todo/delete/:id').delete(verifyToken, deleteTodo);
router.route('/todo/restore/:id').get(verifyToken, restoreTodo);
