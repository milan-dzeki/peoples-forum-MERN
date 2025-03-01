"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const notificationsSchema = new mongoose_1.Schema({
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Notification receiver is required']
    },
    notificationType: {
        type: String,
        enum: [
            'becomeCommunityModeratorRequest',
            'becomeCommunityMemberRequest'
        ]
    },
    text: {
        type: String,
        required: [true, 'Notification message is required']
    },
    read: {
        type: Boolean,
        default: false
    },
    sender: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    community: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Community'
    },
    post: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post'
    },
    comment: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Comment'
    },
    chat: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Chat'
    }
}, {
    timestamps: true
});
const Notification = mongoose_1.models.Notification || (0, mongoose_1.model)('Notification', notificationSchema);
exports.default = Notification;
