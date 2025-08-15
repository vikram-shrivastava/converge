// models/Role.js
import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true }, // e.g., "Founder", "Manager"
  permissions: [{ type: String, required: true }] // e.g., ["create_task", "delete_project"]
}, { timestamps: true });

export default mongoose.model("Role", RoleSchema);
