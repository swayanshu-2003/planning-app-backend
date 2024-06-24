import express from 'express';
import { registeruser, createTodo, getTodos, loginUser, editTodo, deleteTodo, restoreTodo, getDeletedTodos, getSharableLink, addCollaborator, getCompletedTodos, getTodoDetails, getUserData, createComment } from '../controller/controller';
import { verifyToken } from '../utils/auth';

export const router = express.Router();

//route for user 
router.route('/user/create').post(registeruser);
router.route('/user/login').post(loginUser);
router.route('/user').get(verifyToken, getUserData);





//todo routes
router.route('/todos').get(verifyToken, getTodos);
router.route('/todo/:uuid').get(verifyToken, getTodoDetails);
router.route('/todos/deleted').get(verifyToken, getDeletedTodos);
router.route('/todos/completed').get(verifyToken, getCompletedTodos);
router.route('/todo/create').post(verifyToken, createTodo);
router.route('/todo/edit/:uuid').patch(verifyToken, editTodo);
router.route('/todo/delete/:uuid').delete(verifyToken, deleteTodo);
router.route('/todo/restore/:uuid').get(verifyToken, restoreTodo);
router.route('/todo/share/:uuid').get(verifyToken, getSharableLink);
router.route('/todo/:uuid/collab').get(verifyToken, addCollaborator);
router.route('/todo/comment/:uuid').post(verifyToken, createComment);
