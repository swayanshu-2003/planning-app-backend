"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const router_1 = require("./router/router");
const cors_1 = __importDefault(require("cors"));
const app = (0, express_1.default)();
// Middleware to parse JSON request bodies
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Use the router
app.use('/api/v1', router_1.router);
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
}).on('error', (err) => {
    console.error(`Error occurred: ${err.message}`);
});
