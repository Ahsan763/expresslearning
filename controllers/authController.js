import userModule from "../modules/userModule.js"
import { hashPassword, compareHashPassword } from "../utils/auth.js";
import JWT from "jsonwebtoken"
export const signupController = async(req,res) =>{
  try {
    const {first_name,last_name,email,phone,address,password} = req.body;
    if(!first_name){
      return res.send({
        error:"First name is required"
      })
    }
    if(!last_name){
      return res.send({
        error:"Last name is required"
      })
    }
    if(!email){
      return res.send({
        error:"Email is required"
      })
    }
    if(!phone){
      return res.send({
        error:"Phone no. is required"
      })
    }
    if(!address){
      return res.send({
        error:"Address is required"
      })
    }
    // checking user email
    const existingUser = await userModule.findOne({email})
    // existing user
    if(existingUser){
       return res.status(200).send({
        success:true,
        message:"Email is already registered"
      })
    }
    // register user
    const hashedPassword = await hashPassword(password)
    const user = await new userModule({first_name,last_name,email,phone,address,password:hashedPassword}).save();
    res.status(201).send({
      success:true,
      message:"User signedup successfully",
      user
    })
  } catch (error) {
    console.log("🚀 ~ signupController ~ error:", error);
    res.status(500).send({
      success:false,
      message:"Error in signup",
      error
    })
  }
}
export const loignController= async(req,res)=>{
  try {
    const {email,password} = req.body;
    if(!email || !password){
      res.status(404).send({
        success:false,
        message:"Email or password is not found",
      })
    }
    const user = await userModule.findOne({email});
    if(!user){
      res.status(404).send({
        success:false,
        message:"Email is not registered"

      })
    }
    const match = await compareHashPassword(password,user.password)
    if(!match){
      return res.status(401).send({
        success:false,
        message:"Password is wrong"
      })
    }
    const token = await JWT.sign({_id:userModule._id},process.env.jwt_secret,{expiresIn:"7d"})
    res.status(200).send({
      success:true,
      message:"Login Successfully",
      user:{
        first_name:user.first_name,
        last_name:user.last_name,
        email:user.email,
        address:user.address,
        phone:user.phone
      },
      token
    })
  } catch (error) {
    
    console.log("🚀 ~ loignController ~ error:", error)
    res.status(500).send({
      success:false,
      message:"Error in login",
      error
    })
  }
}