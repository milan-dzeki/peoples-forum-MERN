"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const communityInputRules_1 = __importDefault(require("configs/validators/community/communityInputRules"));
const communitySchema = new mongoose_1.Schema({
    creator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, communityInputRules_1.default.creatorId.requiredErrorMessage]
    },
    pendingInvitedModerators: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    moderators: [
        {
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            },
            customPermissions: {
                type: [{
                        type: String,
                        enum: [
                            'update_description',
                            'update_profile_photo',
                            'remove_profile_photo',
                            'update_banner_photo',
                            'remove_banner_photo',
                            'update_rules',
                            'update_community_access',
                            'remove_posts',
                            'remove_comments',
                            'pin_posts',
                            'ban_users',
                            'undo_ban_users',
                            'invite_users_as_members',
                            'invite_users_as_moderators',
                            'withdraw_invite_users_as_members',
                            'withdraw_invite_users_as_meoderators',
                            'ban_users_from_chats',
                            "undo_ban_users_from_chats",
                            "remove_chats",
                            'remove_chat_messages'
                        ]
                    }],
                default: []
            }
        }
    ],
    name: {
        type: String,
        required: [true, communityInputRules_1.default.name.requiredErrorMessage],
        minLength: [
            communityInputRules_1.default.name.minLength.value,
            communityInputRules_1.default.name.minLength.errorMessage
        ],
        maxLength: [
            communityInputRules_1.default.name.maxLength.value,
            communityInputRules_1.default.name.maxLength.errorMessage
        ]
    },
    description: {
        type: String,
        required: [true, communityInputRules_1.default.description.requiredErrorMessage],
        minLength: [
            communityInputRules_1.default.description.minLength.value,
            communityInputRules_1.default.description.minLength.errorMessage
        ],
        maxLength: [
            communityInputRules_1.default.description.maxLength.value,
            communityInputRules_1.default.description.maxLength.errorMessage
        ]
    },
    bannerImageUrl: String,
    bannerImagePublicId: {
        type: String,
        select: false
    },
    profileImageUrl: String,
    profileImagePublicId: {
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
