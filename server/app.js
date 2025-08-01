import express from 'express';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import dotenv from 'dotenv';
const app = express();
dotenv.config();
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));
app.use(express.json({
    limit:'50mb'
}));
app.use(express.urlencoded({ extended: true ,limit: '50mb' }));
app.use(cookieParser());

//routes import

//routesdeclaration

app.get('/', (req, res) => {
    res.status(200).json({ message: 'Server is running' });
});
// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({ message: 'Internal Server Error', error: err.message });
});
// 404 handler
app.use((req, res) => {
    res.status(404).json({ message: 'Not Found' });
});

export {app};