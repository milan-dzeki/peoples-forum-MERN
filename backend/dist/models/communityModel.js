"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const communityInputRules_1 = __importDefault(require("configs/validators/community/communityInputRules"));
const community_1 = require("configs/community");
const communitySchema = new mongoose_1.Schema({
    creator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: [true, communityInputRules_1.default.creatorId.requiredErrorMessage]
    },
    pendingInvitedModerators: [
        {
            invitedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            },
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ],
    moderators: [
        {
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            customPermissions: {
                type: [{
                        type: String,
                        enum: [
                            community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_DESCRIPTION,
                            community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_PROFILE_PHOTO,
                            community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_PROFILE_PHOTOO,
                            community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_BANNER_PHOTO,
                            community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_BANNER_PHOTO,
                            community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_RULES,
                            community_1.COMMUNITY_PERMISSION_NAMES.UPDATE_COMMUNITY_ACCESS,
                            community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_POSTS,
                            community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_COMMENTS,
                            community_1.COMMUNITY_PERMISSION_NAMES.PIN_POSTS,
                            community_1.COMMUNITY_PERMISSION_NAMES.BAN_USERS,
                            community_1.COMMUNITY_PERMISSION_NAMES.UNDO_BAN_USERS,
                            community_1.COMMUNITY_PERMISSION_NAMES.INVITE_USERS_AS_MEMBERS,
                            community_1.COMMUNITY_PERMISSION_NAMES.INVITE_USERS_AS_MODERATORS,
                            community_1.COMMUNITY_PERMISSION_NAMES.WITHDRAW_INVITE_USERS_AS_MEMBERS,
                            community_1.COMMUNITY_PERMISSION_NAMES.WITHDRAW_INVITE_USERS_AS_MODERATORS,
                            community_1.COMMUNITY_PERMISSION_NAMES.BAN_USERS_FROM_CHATS,
                            community_1.COMMUNITY_PERMISSION_NAMES.UNDO_BAN_USERS_FROM_CHATS,
                            community_1.COMMUNITY_PERMISSION_NAMES.ACCEPT_JOIN_REQUESTS,
                            community_1.COMMUNITY_PERMISSION_NAMES.DECLINE_JOIN_REQUESTS,
                            community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_CHATS,
                            community_1.COMMUNITY_PERMISSION_NAMES.REMOVE_CHAT_MESSAGES
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
            invitedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            },
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ],
    members: [
        {
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            },
            joinDate: {
                type: Date,
                default: Date.now
            }
        }
    ],
    bannedUsers: [
        {
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            },
            bannedBy: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            }
        }
    ],
    userJoinRequests: [
        {
            user: {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            },
            requestDate: {
                type: Date,
                default: Date.now
            }
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
