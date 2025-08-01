import dotenv from 'dotenv';
dotenv.config();
export const DB_NAME=process.env.DB_NAME ;
console.log("DB_NAME:", DB_NAME);
export const PORT = process.env.PORT || 5000;