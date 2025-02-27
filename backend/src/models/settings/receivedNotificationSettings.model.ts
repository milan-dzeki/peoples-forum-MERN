import { Schema, models, model } from 'mongoose';

const receivedNotificationsSettingsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  postsNotifications: {
    myPostsVoted: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me for my post votes',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when your posts are voted',
        immutable: true
      }
    },
    myPostsCommented: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me for my post gets comments',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when your posts get comments',
        immutable: true
      }
    },
    myPostsShared: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when people share my posts',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when people share your posts',
        immutable: true
      }
    },
    myCommentsShared: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when people share my comments',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when people share your comments',
        immutable: true
      }
    },
    peopleIFollowCreatePost: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when people I follow post',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when people you follow create posts',
        immutable: true
      }
    },
    peopleIFollowVotePost: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when people I follow vote post',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when people you follow vote posts',
        immutable: true
      }
    },
    peopleIFollowComment: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when people I follow post comments',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when people you follow post comment',
        immutable: true
      }
    },
    peopleIFollowVoteComments: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when people I follow vote comments',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when people you follow vote comments',
        immutable: true
      }
    },
    postTags: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when I am taged in posts',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when you are taged in posts',
        immutable: true
      }
    },
    commentTags: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when I am taged in comments',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when you are taged in comments',
        immutable: true
      }
    },
    commentReplies: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when my comments get replies',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when your comments get replies',
        immutable: true
      }
    }
  },
  communitiesNotifications: {
    newCommunityPost: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when new community post get created',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when new community post is created',
        immutable: true
      }
    },
    communityRulesUpdated: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when new community rules get updated',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when community rules get updated',
        immutable: true
      }
    },
    communityDeleted: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when new communities get deleted',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when comunities get deleted',
        immutable: true
      }
    },
    newCommunityChatCreated: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when new community chats get created',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when community chats get created',
        immutable: true
      }
    },
    communityChatDeleted: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when new community chats get deleted',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when community chats get deleted',
        immutable: true
      }
    },
    yourCommunityPostsDeleted: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when my community posts get deleted',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when your community posts are deleted by admins',
        immutable: true
      }
    },
    yourCommunityCommentsDeleted: {
      checked: {
        type: Boolean,
        default: true
      },
      displayName: {
        type: String,
        default: 'Notify me when my community comments get deleted',
        immutable: true
      },
      description: {
        type: String,
        default: 'This setting decides whether you will be notified when your community comments are deleted by admins',
        immutable: true
      }
    },
    notificationsTurnedOffForCommunities: {
      communities: [
        {
          type: Schema.Types.ObjectId,
          ref: 'Community'
        }
      ],
      displayName: {
        type: String,
        default: 'Dont get notifications from these communities',
        immutable: true
      },
      description: {
        type: String,
        default: 'You will not get any notifications from activities in these communities',
        immutable: true
      }
    },
  }
}, {
  timestamps: true
});

const ReceivedNotificationSettingsModel = models.NotificationSettingsModel || model('ReceivedNotificationSettingsModel', receivedNotificationsSettingsSchema);

export default ReceivedNotificationSettingsModel;