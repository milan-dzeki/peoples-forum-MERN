"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const notifications_1 = require("configs/notifications");
const notificationsSchema = new mongoose_1.Schema({
    receiver: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Notification receiver is required']
    },
    notificationType: {
        type: String,
        enum: [
            notifications_1.NOTIFICATION_TYPES.BECOME_COMMUNITY_MODERATOR_INVITATION,
            notifications_1.NOTIFICATION_TYPES.BECOME_COMMUNITY_MEMBER_INVITATION,
            notifications_1.NOTIFICATION_TYPES.BANNED_FROM_COMMUNITY,
            notifications_1.NOTIFICATION_TYPES.REMOVED_COMMUNITY_BAN,
            notifications_1.NOTIFICATION_TYPES.USER_REQUESTED_TO_JOIN_COMMUNITY,
            notifications_1.NOTIFICATION_TYPES.USER_ACCEPTED_COMMUNITY_MEMBER_INVITE,
            notifications_1.NOTIFICATION_TYPES.USER_ACCEPTED_COMMUNITY_MODERATOR_INVITE,
            notifications_1.NOTIFICATION_TYPES.REQUEST_TO_JOIN_COMMUNITY_AS_MODERATOR_ACCEPTED,
            notifications_1.NOTIFICATION_TYPES.REQUEST_TO_JOIN_COMMUNITY_AS_MEMBER_ACCEPTED,
            notifications_1.NOTIFICATION_TYPES.REQUEST_TO_JOIN_COMMUNITY_AS_MODERATOR_DECLINED,
            notifications_1.NOTIFICATION_TYPES.REQUEST_TO_JOIN_COMMUNITY_AS_MEMBER_DECLINED,
            notifications_1.NOTIFICATION_TYPES.COMMUNITY_SETTINGS_CHANGED
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
const Notification = mongoose_1.models.Notification || (0, mongoose_1.model)('Notification', notificationsSchema);
exports.default = Notification;
