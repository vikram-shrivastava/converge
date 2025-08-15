const teamSchema = new Schema({
    name: { type: String, required: true },
    department: { type: String, required: true },
    projectId: { type: Schema.Types.ObjectId, ref: "Project" },
    members: [{ type: Schema.Types.ObjectId, ref: "TeamMember" }]
}, { timestamps: true });
