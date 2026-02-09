import mongoose from "mongoose";

const inventorySchema = new mongoose.Schema({
    phoneModel:{
        type:String,
        required:true
    },
    storage:{
        type:String,
        enum:["32GB","64GB","128GB","256GB","512GB","1TB","2TB"],
        required:true
    },
    imeiNumber:{
        type:String
    },
    purchasePrice:{
        type:Number,
        required:true
    },
    purchaseDate:{
        type:Date,
        required:true
    },
    condition:{ 
        type:String,
        enum:["New","Like New","Good","Fair","Poor"],
        required:true
    },
    salePrice:{
        type:Number
    },
    saleDate:{
        type:Date
    },
    buyer:{
        type:String
    },
    source:{
        type:String,
        required:true
    },
    notes:{
        type:String
    },
    status:{
        type:String,
        enum:["In Stock","Sold","Reserved"],
        default:"In Stock"
    }
},{timestamps:true});

export const Inventory = mongoose.model("Inventory", inventorySchema);