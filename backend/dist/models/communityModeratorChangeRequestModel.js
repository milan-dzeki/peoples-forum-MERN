"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const communityModeratorChangeRequests_1 = require("configs/communityModeratorChangeRequests");
const communityModeratorChangeRequestSchema = new mongoose_1.Schema({
    status: {
        type: String,
        enum: ['pending', 'approved', 'declined'],
        default: 'pending',
        required: true
    },
    requestType: {
        type: String,
        enum: [
            communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_DESCRIPTION,
            communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_PROFILE_PHOTO,
            communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.REMOVE_PROFILE_PHOTO,
            communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_BANNER_PHOTO,
            communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.REMOVE_BANNER_PHOTO,
            communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.ADD_RULE,
            communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_SINGLE_RULE,
            communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.UPDATE_RULES,
            communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_SINGLE_RULE,
            communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_MULTIPLE_RULES,
            communityModeratorChangeRequests_1.COMMUNITY_MODERATOR_REQUEST_TYPES.DELETE_ALL_RULES
        ],
        // required: true
    },
    community: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Community',
        required: true
    },
    communityCreator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    moderator: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requestText: {
        type: String,
        required: true
    },
    forUser: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
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
    },
    message: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Message'
    },
    photo: {
        secure_url: String,
        public_id: String
    },
    newDescriptionValue: String,
    newRules: [
        {
            _id: mongoose_1.Schema.Types.ObjectId,
            title: String,
            description: String
        }
    ],
    deleteRuleIds: [
        {
            type: String
        }
    ]
}, {
    timestamps: true
});
const CommunityModeratorChangeRequest = mongoose_1.models.CommunityModeratorChangeRequest || (0, mongoose_1.model)('CommunityModeratorChangeRequest', communityModeratorChangeRequestSchema);
exports.default = CommunityModeratorChangeRequest;
