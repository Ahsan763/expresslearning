import mongoose from "mongoose"
import colors from "colors"
import dotenv from "dotenv"
const connectDb = async()=>{
  try {
    const conn = await mongoose.connect(process.env.mongo_uri);
    console.log(`Connected to mongodb ${conn.connection.host}`.bgMagenta.white)
  } catch (error) {
    console.log(`Error in mongo db ${error}`.bgRed.white)
  }
}
export default connectDb;