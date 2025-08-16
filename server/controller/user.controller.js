import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/user.model.js'
import InviteCode from '../models/invitecode.model.js'
import { sendEmail } from '../helpers/mailsender.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
const options={
    httpOnly: true,
      secure: false,            // Set to true in production
      sameSite: 'lax',
}
const norm = (e) => e.trim().toLowerCase();

const signup = async (req, res) => {
    try {
        const { name, password } = req.body;
        const { receivedinvitecode } = req.params; // invite code from params
        const rawemail = req.body.email; // email from body
        const email=norm(rawemail); // Normalize email to lowercase
        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required" });
        }
        // Validate email format
        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser && !existingUser.isDeleted) {
            return res.status(400).json({ message: "Email already registered" });
        }

        let role = "executive"; // default role if no invite
        if (receivedinvitecode) {
            const invitecode = await InviteCode.findOne({ code: receivedinvitecode });

            if (!invitecode || invitecode.status !== "pending" || new Date(invitecode.expiresAt).getTime() < Date.now()) {
                return res.status(400).json({ message: "Invalid or expired invite code" });
            }

            role = invitecode.role || "user"; // assign role from invite
            invitecode.status = "accepted";
            await invitecode.save();
        }

        // Create new user
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ name, email, password: hashedPassword, role });
        const verificationToken = crypto.randomBytes(20).toString('hex');
        newUser.verifyCode = verificationToken;
        newUser.verifyCodeexpiry = Date.now() + 24*60*60*1000; // 24h expiry
        await newUser.save();
        //add acceptedBy field to InviteCode model
        const invitecode=await InviteCode.findOne({ code: receivedinvitecode });
        if (invitecode) {
            invitecode.acceptedBy = newUser._id; // link user to invite code
        }
        const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${encodeURIComponent(verificationToken)}`;
        await sendEmail(
            email,
            "Verify your email",
            `Hi ${name},\n\nPlease verify your email by clicking this link:\n ${verificationLink}\n\nThanks!`
        );

        return res.status(201).json({
            message: "User created successfully. Please verify your email.",
            user: { id: newUser._id, name: newUser.name, email: newUser.email, role: newUser.role }
        });

    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
};

const login=async(req,res)=>{
    try {
        const {password}=req.body
        const rawemail = req.body.email; // email from body
        const email=norm(rawemail); // Normalize email to lowercase
        if(!email || !password){
            return res.status(400).json({message:"Email and password are required"})
        }
        // Validate email format
        const user=await User.findOne({email})
        if(!user || user.isDeleted){
            return res.status(404).json({message:"User not found"})
        }
        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in" });
        }
        const isPasswordValid=await user.checkpassword(password)
        if(!isPasswordValid){
            return res.status(401).json({message:"Invalid password"})
        }
        const accesstoken=user.generateAccessToken()
        const refreshtoken=user.generateRefreshToken()
        user.refreshToken = refreshtoken; // Save the refresh token to the user model
        await user.save()
        const loggedInuser=await User.findById(user._id).select('-password -refreshToken');
        return res
            .status(200)
            .cookie("accessToken",accesstoken,options)
            .cookie("refreshToken",refreshtoken,options)
            .json({
                message:"Used Logged in Successfully",
                user:loggedInuser
            })
    } catch (error) {
        return res.status(500).json({message:"Internal server error",error:error.message})
    }
}
const logout=async(req,res)=>{
    try {
        const userId = req.user.id || req.user._id;
    
        const user = await User.findById(userId);
        if (!user) {
          return res.status(400).json({ message: "Invalid User ID" });
        }
        user.refreshToken = null;
        await user.save();
    
        return res
          .status(200)
          .clearCookie("accessToken", { httpOnly: true, sameSite: "Lax" })
          .clearCookie("refreshToken", { httpOnly: true, sameSite: "Lax" })
          .json({ message: "User logged out successfully" });
    
      } catch (error) {
        console.error("Logout error:", error.message);
        return res.status(500).json({ message: "Cannot log out user" });
      }
}
const verifyEmail = async (req, res) => {
    try {
        const { token } = req.params;
        const user = await User.findOne({ verifyCode: token });
        if (!user || user.isVerified || !user.verifyCodeexpiry || user.verifyCodeexpiry < Date.now()) {
            // Token is invalid or expired
            return res.status(400).json({ message: "Invalid or expired verification token" });
        }
        user.isVerified = true;
        user.verifyCode = null; // clear token
        user.verifyCodeexpiry = null; // clear expiry
        await user.save();

        return res.status(200).json({ message: "Email verified successfully! You can now login." });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
const reqresetpassword=async(req,res)=>{
    try {
        const rawemail = req.body.email; // email from body
        const email=norm(rawemail); // Normalize email to lowercase
        if(!email){
            return res.status(400).json({message:"All fields are required"})
        }
        email=norm(email); // Normalize email to lowercase
        // Validate email format
        const user=await User.findOne({email})
        if(!user){
            return res.status(404).json({message:"User not found"})
        }
        //logic to send email for reset password
        const verifyCode= Math.floor(100000 + Math.random() * 900000).toString();
        const verifyCodeexpiry=Date.now() + 15 * 60 * 1000;
        //send email using nodemailer
        await sendEmail(email,"Reset Password",`Your verification code is: ${verifyCode}\nThis Code is only valid for 15 minutes`)
        //save the verify code to the user model
        user.resetpassverifyCode = verifyCode;
        user.resetpassverifyCodeexpiry = verifyCodeexpiry;
        await user.save();
        return res.status(200).json({message:"Reset Password email sent successfully"})

    } catch (error) {
        return res.status(500).json({message:"Internal server error",error:error.message})
        
    }
}
const verifyResetCode=async(req,res)=>{
    try {
        const {verifyCode } = req.body;
        const rawemail = req.body.email; // email from body
        const email=norm(rawemail); // Normalize email to lowercase
        if(!verifyCode || !email){
            return res.status(400).json({message:"Email and verification code are required"})
        }
        // Validate email format
        const user = await User.findOne({ email });
        if(!user){
            return res.status(404).json({message:"User not found"})
        }
        if(user.resetpassverifyCode !== verifyCode || user.resetpassverifyCodeexpiry < Date.now()){
            return res.status(400).json({message:"Invalid or expired verification code"})
        }
        //logic to reset password
        user.resetpassverified = true; // Mark the user as verified
        await user.save();
        return res.status(200).json({message:"Verification successful, you can now reset your password"})
    } catch (error) {
        return res.status(500).json({message:"Internal server error",error:error.message})
    }
}
const changedPassword=async(req,res)=>{
    try {
        const {newPassword}=req.body
        const rawemail = req.body.email; // email from body
        const email=norm(rawemail); // Normalize email to lowercase
        if(!newPassword || !email){
            return res.status(400).json({message:"new password or email are required"})
        }
        // Validate email format
        const prevuser = await User.findOne({ email });
        if (!prevuser || !prevuser.resetpassverified) {
            return res.status(403).json({ message: "User is not verified for password reset" });
        }
        const hashedBcryptPassword = await bcrypt.hash(newPassword, 10);
        const user = await User.findByIdAndUpdate(
            prevuser._id,
            { password: hashedBcryptPassword, resetpassverifyCode: null ,resetpassverifyCodeexpiry:null,resetpassverified:false},
            { new: true }
        );
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ message: "Password changed successfully" });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
const getuser=async(req,res)=>{
    try {
        const userId=req.user._id || req.user.id; // Assuming req.user is set after authentication
        const user = await User.findById(userId).select('-password -refreshToken');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ user });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
const updateuser=async(req,res)=>{
    try {
        const userId = req.user._id || req.user.id; // Assuming req.user is set after authentication
        const { profilePic } = req.body;
        const user = await User.findByIdAndUpdate(
            userId,
            { profilePic },
            { new: true, runValidators: true }
        ).select('-password -refreshToken');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ message: "User updated successfully", user });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
const deleteuser=async(req,res)=>{
    try {
        const userId = req.user._id || req.user.id; // Assuming req.user is set after authentication
        const user = await User.findByIdAndUpdate(
            userId,
            { isDeleted: true,DeletedAt: new Date() ,verifyCode:null,verifyCodeexpiry:null,isVerified:false,refreshToken:null}, // Soft delete
            { new: true }
        ).select('-password -refreshToken');
        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        return res.status(200).json({ message: "User deleted successfully", user });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
const getallusers=async(req,res)=>{
    try {
        const users = await User.find({ isDeleted: false }).select('-password -refreshToken');
        if (!users || users.length === 0) {
            return res.status(200).json({ message: "No users found" });
        }
        return res.status(200).json({ users });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}
const generateInviteCode=async(req,res)=>{
    try {
        const { role } = req.body;
        if (!role) {
            return res.status(400).json({ message: "Role is required" });
        }
        const code = crypto.randomBytes(3).toString('hex'); // Generate a random 6-character code
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days expiry

        const inviteCode = new InviteCode({ code, role, expiresAt, status: 'pending',generatedBy: req.user._id });
        await inviteCode.save();

        return res.status(201).json({ message: "Invite code created successfully", code });
    } catch (error) {
        return res.status(500).json({ message: "Internal server error", error: error.message });
    }
}

export {signup,login,reqresetpassword,logout,getuser,updateuser,deleteuser,getallusers,verifyResetCode,changedPassword,verifyEmail,generateInviteCode}