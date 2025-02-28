"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const postCommentSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    post: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post',
        required: true
    },
    communityId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Community'
    },
    text: String,
    photoUrl: String,
    photoPublicId: {
        type: String,
        select: false
    },
    videoUrl: String,
    videoPublicId: {
        type: String,
        select: false
    },
    tagedUsers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    downvoteCount: {
        type: Number,
        default: 0
    },
    upvoteCount: {
        type: Number,
        default: 0
    },
    sharedCount: {
        type: Number,
        default: 0
    },
    parentComment: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'PostComment'
    }
}, {
    timestamps: true
});
const PostComment = mongoose_1.models.PostComment || (0, mongoose_1.model)('PostComment', postCommentSchema);
exports.default = PostComment;
