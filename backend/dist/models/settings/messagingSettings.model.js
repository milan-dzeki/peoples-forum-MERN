"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messagingSettingsSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    whoCanMessageMe: {
        type: [{
                type: String,
                enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one']
            }],
        default: ['everyone']
    },
    requestMessaging: {
        type: Boolean,
        default: false
    },
    whatMessageDataCanPeopleSendMe: {
        type: [{
                type: String,
                enum: ['all_data_types', 'text_messages', 'audio_messages', 'video_messages', 'link_messages']
            }],
        default: ['all_data_types']
    },
    addMeToJoinedCommunitiesChats: {
        type: Boolean,
        default: false
    },
    usersThatCannotMessageMe: {
        users: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            }
        ]
    },
    // Will be readded when communities and chats models are created
    // blockedCommunitiesChats: {
    //   communities: [
    //     {
    //     }
    //   ]
    // }
}, {
    timestamps: true
});
messagingSettingsSchema.virtual('whoCanMessageMe.metadata').get(function () {
    return {
        displayName: 'Who can message me',
        description: 'This setting decides who can send you messages'
    };
});
messagingSettingsSchema.virtual('requestMessaging.metadata').get(function () {
    return {
        displayName: 'User must request before messaging me',
        description: 'This setting decides whether users can message you instantly or need to first send you message request'
    };
});
messagingSettingsSchema.virtual('whatMessageDataCanPeopleSendMe.metadata').get(function () {
    return {
        displayName: 'What type of messages people can send me',
        description: 'This setting decides whether users can send you text, audio, video or link messages'
    };
});
messagingSettingsSchema.virtual('addMeToJoinedCommunitiesChats.metadata').get(function () {
    return {
        displayName: 'Add me to joined communities chats',
        description: 'This setting decides whether you will receive request to be added to community chats (if it have them enabled or if automatic join is sent) upon joining. Keep in mind that if you disable this, and after a time enable it again, you will not be added to these chats. You will have to manually ask to join them on corresponding community page'
    };
});
messagingSettingsSchema.virtual('usersThatCannotMessageMe.metadata').get(function () {
    return {
        displayName: 'Users you disabled from messaging you',
        description: 'This setting stores users that you decided cannot message you but which you havent blocked'
    };
});
const MessagingSettings = mongoose_1.models.MessagingSettings || (0, mongoose_1.model)('InteractionSettings', messagingSettingsSchema);
exports.default = MessagingSettings;
