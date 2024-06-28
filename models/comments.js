const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    CommentId: { type: mongoose.Schema.Types.ObjectId},
    Comment: { type: String, required: true },
    CommentedBy: { type: String, required: true },
    CommentDate: { type: Date, required: true },
});

const Comment = mongoose.model('Comments', userSchema);

module.exports = Comment;
