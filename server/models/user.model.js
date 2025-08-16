// models/User.js
import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profilePic: { type: String },
  googleId: { type: String }, // for OAuth login
  password: { type: String }, // optional if email/password login
  role: { type:String, enum:["Executive","Manager","Team Lead","Team Member"],default:"user"},
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }],
  refreshToken: { type: String }, // for refresh token


  //this is for email verification
  verifyCode:{type:String}, // for email verification
  verifyCodeexpiry:{type:Date}, // for email verification expiry
  isVerified: { type: Boolean, default: false }, // for email verification


  //this is to perform soft delete
  isDeleted: { type: Boolean, default: false }, // for soft delete
  DeletedAt: { type: Date }, // for soft delete timestamp

  //all of this is to reset forgetted password
  resetpassverifyCode: { type: String, default:null }, // for reset password
  resetpassverifyCodeexpiry:{type:Date,default:null},// for reset password
  resetpassverified:{ type: Boolean, default: false }, // for reset password verification
}, { timestamps: true });
UserSchema.methods.generateAccessToken = function () {
  const accesstoken = jwt.sign({ _id: this._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  return accesstoken;
};
UserSchema.methods.generateRefreshToken=function(){
  const refreshtoken=jwt.sign({_id:this._id},process.env.JWT_SECRET,{expiresIn:"1d"});
  return refreshtoken
};
UserSchema.methods.checkpassword=function(password){
  return bcrypt.compare(password,this.password)
}
export default mongoose.model("User", UserSchema);
