"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const chatSchema = new mongoose_1.Schema({
    creator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    name: {
        type: String,
        minLength: 2,
        maxLength: 10
    },
    lastMessage: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message'
    },
    // if it exists it means it is group or community chat
    chatImageUrl: {
        type: String,
        default: null
    },
    chatImagePublicId: {
        type: String,
        default: null,
        select: false
    },
    members: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    // if it has length it means that it is group chat
    admins: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    // if exists it means this is community chat
    communityId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Community',
        default: null
    },
    // banned users cannot see chat (used mainly for community chats)
    bannedUsers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
}, {
    timestamps: true
});
const Chat = mongoose_1.models.Chat || (0, mongoose_1.model)('Chat', chatSchema);
exports.default = Chat;
