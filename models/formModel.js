import mongoose from 'mongoose';

const fromSchema = new mongoose.Schema({
     title:{
        type:String,
        required:true
     },
        description:{
        type:String,
        required:true
     },
        userId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:'User',
        required:true
     },
       images:{
        type:String
     },
        phoneModel:{
        type:String,
        required:true
     },
       condition:{
        type:String,
        Enum:['new','like new','used','refurbished'],
        required:true
       },
       storage:{
        type:String,
        Enum:['32GB','64GB','128GB','256GB','512GB','1TB'],
        required:true
       }

        
},{timestamps:true});


export const Form = mongoose.model('Form', fromSchema);