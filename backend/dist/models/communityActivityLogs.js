"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const communityActivityLogs_1 = require("configs/communityActivityLogs");
const communityActivityLogsSchema = new mongoose_1.Schema({
    community: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    logType: {
        type: String,
        enum: [
            communityActivityLogs_1.COMMUNITY_LOG_TYPE.COMMUNITY_INFO_UPDATED,
            communityActivityLogs_1.COMMUNITY_LOG_TYPE.SETTING_CHANGED,
            communityActivityLogs_1.COMMUNITY_LOG_TYPE.MODERATOR_MADE_REQUESTS,
            communityActivityLogs_1.COMMUNITY_LOG_TYPE.HANDLE_MODERATOR_REQUESTS
        ],
        required: true
    },
    text: {
        type: String,
        required: true
    },
    moderator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    post: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Post', // or community post
        default: null
    },
    comment: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Comment',
        default: null
    },
    moderatorRequest: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'CommunityModeratorChangeRequest',
        default: null
    },
    photoUrl: {
        type: String,
        default: null
    }
}, {
    timestamps: true
});
const CommunityActivityLog = mongoose_1.models.CommunityActivityLog || (0, mongoose_1.model)('CommunityActivityLog', communityActivityLogsSchema);
exports.default = CommunityActivityLog;
