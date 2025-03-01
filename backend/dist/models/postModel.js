"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const postSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Post must have the creator. User ID not provided']
    },
    communityId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Community'
    },
    text: {
        type: String,
        maxLength: 300
    },
    photos: [
        {
            // following cloudinary properties
            secure_url: String,
            public_id: String
        }
    ],
    videoURL: {
        // following cloudinary properties
        secure_url: String,
        public_id: String
    },
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
    tagedUsers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }
    ],
    hideFromUsers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User',
        }
    ]
}, {
    timestamps: true
});
const Post = mongoose_1.models.Post || (0, mongoose_1.model)('Post', postSchema);
exports.default = Post;
