// models/Project.js
import mongoose from "mongoose";

const ProjectSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  members: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" }
  }],
  tasks: [{ type: mongoose.Schema.Types.ObjectId, ref: "Task" }],
  chats: [{ type: mongoose.Schema.Types.ObjectId, ref: "Message" }]
}, { timestamps: true });

export default mongoose.model("Project", ProjectSchema);
