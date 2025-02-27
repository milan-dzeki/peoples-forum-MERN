"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const messagingSettings = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    whoCanMessageMe: {
        checked: {
            everyone: {
                type: Boolean,
                default: true
            },
            followers: {
                type: Boolean,
                default: true
            },
            people_I_follow: {
                type: Boolean,
                default: true
            },
            friends: {
                type: Boolean,
                default: true
            },
            friends_of_friends: {
                type: Boolean,
                default: true
            },
            no_one: {
                type: Boolean,
                default: false
            }
        },
        displayName: {
            type: String,
            default: 'Who can message me',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides who can send you messages',
            immutable: true
        }
    },
    requestMessaging: {
        checked: {
            type: Boolean,
            default: false
        },
        displayName: {
            type: String,
            default: 'User must request before messaging me',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides whether users can message you instantly or need to first send you message request',
            immutable: true
        }
    },
    whatMessageDataCanPeopleSendMe: {
        checked: {
            all_data_types: {
                type: Boolean,
                default: true
            },
            text_messages: {
                type: Boolean,
                default: true
            },
            audio_messages: {
                type: Boolean,
                default: true
            },
            video_messages: {
                type: Boolean,
                default: true
            },
            link_messages: {
                type: Boolean,
                default: true
            }
        },
        displayName: {
            type: String,
            default: 'What type of messages people can send me',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides whether users can send you text, audio, video or link messages',
            immutable: true
        }
    },
    addMeToJoinedCommunitiesChats: {
        checked: {
            type: Boolean,
            default: true
        },
        displayName: {
            type: String,
            default: 'Add me to joined communities chats',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting decides whether you will receive request to be added to community chats (if it have them enabled or if automatic join is sent) upon joining. Keep in mind that if you disable this, and after a time enable it again, you will not be added to these chats. You will have to manually ask to join them on corresponding community page',
            immutable: true
        }
    },
    usersThatCannotMessageMe: {
        users: [
            {
                type: mongoose_1.Schema.Types.ObjectId,
                ref: 'User'
            }
        ],
        displayName: {
            type: String,
            default: 'Users you disabled from messaging you',
            immutable: true
        },
        description: {
            type: String,
            default: 'This setting stores users that you decided cannot message you but which you havent blocked',
            immutable: true
        }
    }
}, {
    timestamps: true
});
const MessagingSettings = mongoose_1.models.MessagingSettings || (0, mongoose_1.model)('InteractionSettings', messagingSettings);
exports.default = MessagingSettings;
