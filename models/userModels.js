const mongoose = require("mongoose");
const schema = new mongoose.Schema({ 
    name:{
        type:String
    },
    email:{
        type: String,
        required: true,
        unique:true
    },
    password:{
        type:String,
        required:true,
    },
    phoneNo:{
        type:String,
    },
    createdAt:{
        type:Date,
        default:Date.now
    },
     role: {
        type: String,
        enum: ['admin', 'seller', 'customer'],
        default: 'customer'
    },
     isActive: {
        type: Boolean,
        default: false
    },

 });
const User = mongoose.model('User', schema);
module.exports = User;