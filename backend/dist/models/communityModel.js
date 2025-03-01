"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const communitySchema = new mongoose_1.Schema({
    creator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, 'Community creator ID is required']
    },
    pendingInvitedModerators: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    moderators: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    access: {
        type: String,
        enum: {
            values: ['public', 'private'],
            message: 'Communitys access value can only be "public" or "private"'
        },
        default: 'public'
    },
    name: {
        type: String,
        required: [true, 'Community Name is required'],
        minLength: [2, 'Community Name must be at least 2 characters long'],
        maxLength: [30, 'Community Name must not exceed 30 characters']
    },
    description: {
        type: String,
        required: [true, 'Community Description is required'],
        minLength: [10, 'Community Description must be at least 10 characters long'],
        maxLength: [100, 'Community Description must not exceed 100 characters']
    },
    bannerImageUrl: String,
    bannerImagePublicId: {
        type: String,
        select: false
    },
    profileImageUrl: String,
    profilImagePublicId: {
        type: String,
        select: false
    },
    rules: [
        {
            title: {
                type: String,
                required: false,
                minLength: 5,
                maxLength: 20
            },
            description: {
                type: String,
                required: false,
                minLength: 5,
                maxLength: 100
            }
        }
    ],
    pendingInvitedUsers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    joinedUsers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    bannedUsers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    availableChats: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'Chat'
        }
    ]
}, {
    timestamps: true
});
const Community = mongoose_1.models.Community || (0, mongoose_1.model)('Community', communitySchema);
exports.default = Community;
