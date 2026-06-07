import mongoose from "mongoose"
const userSchema = new mongoose.Schema({
  first_name:{
    type:String,
    required:true,
    trim:true,
  },
  last_name:{
    type:String,
    required:true,
    trim:true,
  },
  email:{
    type:String,
    required:true,
    unique:true,
  },
  phone:{
    type:String,
    required:true,
    trim:true,
  },
  address:{
    type:String,
    required:true,
    trim:true,
  },
  password:{
    type:String,
    required:true,
  },
  role:{
    type:Number,
    default:0,
  },
},{timestamps:true})
export default mongoose.model("users",userSchema);