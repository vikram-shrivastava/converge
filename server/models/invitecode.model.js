import mongoose,{Schema} from "mongoose";
// inviteSchema.js
const inviteSchema = new Schema({
    companyId: { type: Schema.Types.ObjectId, ref: "Company", required: true },
    roleId: { type: Schema.Types.ObjectId, ref: "Role", required: true },
    email: { type: String }, // optional if you want email-bound invite
    code: { type: String, required: true, unique: true },
    status: { type: String, enum: ["pending", "accepted", "expired"], default: "pending" },
    expiresAt: { type: Date, required: true },
    generatedBy: { type: Schema.Types.ObjectId, ref: "User", required: true }, // who generated the invite
    acceptedBy: { type: Schema.Types.ObjectId, ref: "User" }, // who accepted the invite
  }, { timestamps: true });
export default mongoose.model("InviteCode", inviteSchema);  