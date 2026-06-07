import express from "express";
import colors from "colors";
import dotenv from "dotenv";
import morgon from "morgan"
import connectDb from "./config/db.js";
import authRoutes from "./routes/authRoutes.js"
dotenv.config();
// Database connection
connectDb();
// rest object
const app = express();

// middleware 
app.use(express.json());
app.use(morgon('dev'));
// routes
app.use("/",authRoutes)
app.get("/",(req,res)=>{
  res.send("wellcome 1")
})
const port = process.env.port || 8081; 
app.listen(port,()=>{
  console.log(`Server is running on ${port}`.bgGreen.white)
})