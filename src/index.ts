import express from 'express';
import { router } from "./router/router";
import cors from "cors"

const app = express();

// Middleware to parse JSON request bodies
app.use(cors())
app.use(express.json());

// Use the router
app.use('/api/v1', router);

const PORT = 4000;

app.listen(PORT, () => {
    console.log(`Server running at port ${PORT}`);
}).on('error', (err: any) => {
    console.error(`Error occurred: ${err.message}`);
});
