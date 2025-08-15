// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  profilePic: { type: String },
  googleId: { type: String }, // for OAuth login
  password: { type: String }, // optional if email/password login
  role: { type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true },
  projects: [{ type: mongoose.Schema.Types.ObjectId, ref: "Project" }]
}, { timestamps: true });

export default mongoose.model("User", UserSchema);
