"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const receivedNotificationsSettingsSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User'
    },
    postsNotifications: {
        myPostsVoted: {
            type: Boolean,
            default: true
        },
        myPostsCommented: {
            type: Boolean,
            default: true
        },
        myPostsShared: {
            type: Boolean,
            default: true
        },
        myCommentsVoted: {
            type: Boolean,
            default: true
        },
        myCommentsShared: {
            type: Boolean,
            default: true
        },
        peopleIFollowCreatePost: {
            type: Boolean,
            default: true
        },
        peopleIFollowVotePost: {
            type: Boolean,
            default: true
        },
        peopleIFollowComment: {
            type: Boolean,
            default: true
        },
        peopleIFollowVoteComment: {
            type: Boolean,
            default: true
        },
        postTags: {
            type: Boolean,
            default: true
        },
        commentTags: {
            type: Boolean,
            default: true
        },
        commentReplies: {
            type: Boolean,
            default: true
        }
    },
    communitiesNotifications: {
        newCommunityPost: {
            type: Boolean,
            default: true
        },
        communityRulesUpdated: {
            type: Boolean,
            default: true
        },
        communityDeleted: {
            type: Boolean,
            default: true
        },
        newCommunityChatCreated: {
            type: Boolean,
            default: true
        },
        communityChatDeleted: {
            type: Boolean,
            default: true
        },
        yourCommunityPostsDeleted: {
            type: Boolean,
            default: true
        },
        yourCommunityCommentsDeleted: {
            type: Boolean,
            default: true
        },
        notificationsTurnedOffForCommunities: {
            communities: [
                {
                    type: mongoose_1.Schema.Types.ObjectId,
                    ref: 'Community'
                }
            ]
        },
    }
}, {
    timestamps: true
});
// Post Notifications virtuals --START
receivedNotificationsSettingsSchema.virtual('postsNotifications.myPostsVoted.metadata').get(function () {
    return {
        displayName: 'Notify me for my post votes',
        description: 'This setting decides whether you will be notified when your posts are voted'
    };
});
receivedNotificationsSettingsSchema.virtual('postsNotifications.myPostsCommented.metadata').get(function () {
    return {
        displayName: 'Notify me when my posts get comments',
        description: 'This setting decides whether you will be notified when your posts get comments'
    };
});
receivedNotificationsSettingsSchema.virtual('postsNotifications.myPostsShared.metadata').get(function () {
    return {
        displayName: 'Notify me when people share my posts',
        description: 'This setting decides whether you will be notified when people share your posts'
    };
});
receivedNotificationsSettingsSchema.virtual('postsNotifications.myCommentsVoted.metadata').get(function () {
    return {
        displayName: 'Notify me when people vote my comments',
        description: 'This setting decides whether you will be notified when people vote your comments'
    };
});
receivedNotificationsSettingsSchema.virtual('postsNotifications.myCommentsShared.metadata').get(function () {
    return {
        displayName: 'Notify me when people share my comments',
        description: 'This setting decides whether you will be notified when people share your comments'
    };
});
receivedNotificationsSettingsSchema.virtual('postsNotifications.peopleIFollowCreatePost.metadata').get(function () {
    return {
        displayName: 'Notify me when people I follow post',
        description: 'This setting decides whether you will be notified when people you follow create posts',
    };
});
receivedNotificationsSettingsSchema.virtual('postsNotifications.peopleIFollowVotePost.metadata').get(function () {
    return {
        displayName: 'Notify me when people I follow vote post',
        description: 'This setting decides whether you will be notified when people you follow vote posts'
    };
});
receivedNotificationsSettingsSchema.virtual('postsNotifications.peopleIFollowComment.metadata').get(function () {
    return {
        displayName: 'Notify me when people I follow post comments',
        description: 'This setting decides whether you will be notified when people you follow post comment'
    };
});
receivedNotificationsSettingsSchema.virtual('postsNotifications.peopleIFollowVoteComment.metadata').get(function () {
    return {
        displayName: 'Notify me when people I follow vote comments',
        description: 'This setting decides whether you will be notified when people you follow vote comments'
    };
});
receivedNotificationsSettingsSchema.virtual('postsNotifications.postTags.metadata').get(function () {
    return {
        displayName: 'Notify me when I am taged in posts',
        description: 'This setting decides whether you will be notified when you are taged in posts'
    };
});
receivedNotificationsSettingsSchema.virtual('postsNotifications.commentTags.metadata').get(function () {
    return {
        displayName: 'Notify me when I am taged in comments',
        description: 'This setting decides whether you will be notified when you are taged in comments'
    };
});
receivedNotificationsSettingsSchema.virtual('postsNotifications.commentReplies.metadata').get(function () {
    return {
        displayName: 'Notify me when my comments get replies',
        description: 'This setting decides whether you will be notified when your comments get replies'
    };
});
// Post Notifications virtuals --END
// Communities Notifications virtuals --START
receivedNotificationsSettingsSchema.virtual('communitiesNotifications.newCommunityPost.metadata').get(function () {
    return {
        displayName: 'Notify me when new community post get created',
        description: 'This setting decides whether you will be notified when new community post is created'
    };
});
receivedNotificationsSettingsSchema.virtual('communitiesNotifications.communityRulesUpdated.metadata').get(function () {
    return {
        displayName: 'Notify me when new community rules get updated',
        description: 'This setting decides whether you will be notified when community rules get updated'
    };
});
receivedNotificationsSettingsSchema.virtual('communitiesNotifications.communityDeleted.metadata').get(function () {
    return {
        displayName: 'Notify me when new communities get deleted',
        description: 'This setting decides whether you will be notified when comunities get deleted'
    };
});
receivedNotificationsSettingsSchema.virtual('communitiesNotifications.newCommunityChatCreated.metadata').get(function () {
    return {
        displayName: 'Notify me when new community chats get created',
        description: 'This setting decides whether you will be notified when community chats get created'
    };
});
receivedNotificationsSettingsSchema.virtual('communitiesNotifications.communityChatDeleted.metadata').get(function () {
    return {
        displayName: 'Notify me when community chats get deleted',
        description: 'This setting decides whether you will be notified when community chats get deleted'
    };
});
receivedNotificationsSettingsSchema.virtual('communitiesNotifications.yourCommunityPostsDeleted.metadata').get(function () {
    return {
        displayName: 'Notify me when my community posts get deleted',
        description: 'This setting decides whether you will be notified when your community posts are deleted by admins'
    };
});
receivedNotificationsSettingsSchema.virtual('communitiesNotifications.yourCommunityCommentsDeleted.metadata').get(function () {
    return {
        displayName: 'Notify me when my community comments get deleted',
        description: 'This setting decides whether you will be notified when your community comments are deleted by admins'
    };
});
receivedNotificationsSettingsSchema.virtual('communitiesNotifications.notificationsTurnedOffForCommunities.metadata').get(function () {
    return {
        displayName: 'Dont get notifications from these communities',
        description: 'You will not get any notifications from activities in these communities'
    };
});
// Communities Notifications virtuals --END
const ReceivedNotificationSettings = mongoose_1.models.NotificationSettings || (0, mongoose_1.model)('ReceivedNotificationSettings', receivedNotificationsSettingsSchema);
exports.default = ReceivedNotificationSettings;
