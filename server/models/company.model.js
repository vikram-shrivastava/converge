import mongoose,{Schema} from "mongoose";
const companySchema = new Schema({
    name: { type: String, required: true },
    description: { type: String },
    email: { type: String, required: true, unique: true },
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true }
}, { timestamps: true });

export default mongoose.model("Company",companySchema)