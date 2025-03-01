"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messageSchema = new mongoose_1.Schema({
    chatId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Chat',
        required: true
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    communityId: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Community',
        default: null
    },
    edited: {
        type: Boolean,
        default: false
    },
    deleted: {
        type: Boolean,
        default: false
    },
    text: String,
    photoUrl: String,
    photoPublicId: {
        type: String,
        select: false
    },
    audioUrl: String,
    audioPublicId: {
        type: String,
        select: false
    },
    videoUrl: String,
    videoPublicId: {
        type: String,
        select: false
    },
    fileUrl: String,
    filePublicId: {
        type: String,
        select: false
    },
    reactions: [
        {
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            reaction: String
        }
    ],
    seenBy: [
        {
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
            },
            dateTime: Date
        }
    ],
    repliedTo: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message',
        default: null
    },
    taged: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
}, {
    timestamps: true
});
const Message = mongoose_1.models.Message || (0, mongoose_1.model)('Message', messageSchema);
exports.default = Message;
