// models/Message.js
import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  project: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
  content: { type: String, required: true },
  type: { type: String, enum: ["text", "file"], default: "text" },
  fileUrl: { type: String }
}, { timestamps: true });

export default mongoose.model("Message", MessageSchema);
