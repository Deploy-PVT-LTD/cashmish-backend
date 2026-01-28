import mongoose from "mongoose";

const mobileSchema = new mongoose.Schema({
    brand:{
        type:String,
        enum:['Apple','Samsung'],
        required:true
    },
    phoneModel:{
        type:String,
        required:true
    },
    basePrice:{
        type:Number,
        required:true
    },
    pictureUrl:{
        type:String
    },
    isActive:{
        type:Boolean,
        default:true
    }
},{timestamps:true})

export const Mobile = mongoose.model('Mobile', mobileSchema);