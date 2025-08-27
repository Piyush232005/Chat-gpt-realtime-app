const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
    user:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'user'
    },
    chat:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'chat'
    },
    content:{
        type: String,
        required: true
    },
    role:{
        type: String,
        enum: ['user', 'model','system'],
        required: true
    }
}, {
    timestamps: true
});

const messageModel = mongoose.model('message', messageSchema);

// This is the line that was missing!
module.exports = messageModel;