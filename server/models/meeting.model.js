import mongoose,{Schema} from "mongoose";
const meetingSchema=new Schema({
    meetingtitle: {
        type: String,
        required: true
    },
    meetinglink: {
        type: String,
        required: true
    },
    meetingtime: {
        type: Date,
        required: true
    },
    createdBy:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User"
    }
})
export default mongoose.model("Meeting",meetingSchema)