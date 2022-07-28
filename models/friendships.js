const mongoose = require("mongoose");

const friendshipsSchema = new mongoose.Schema({
    to_user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    } , 
    from_user : {
        type : mongoose.Schema.Types.ObjectId,
        ref : "User"
    } , 
} , {
    timeStamps : true
})

const Friendships = mongoose.model("Friendships" , friendshipsSchema);
module.exports = Friendships;