import { Schema, models, model } from 'mongoose';

const messagingSettingsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
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
    }
  },
  requestMessaging: {
    checked: {
      type: Boolean,
      default: false
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
    }
  },
  addMeToJoinedCommunitiesChats: {
    checked: {
      type: Boolean,
      default: true
    }
  },
  usersThatCannotMessageMe: {
    users: [
      {
        type: Schema.Types.ObjectId,
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

messagingSettingsSchema.virtual('whoCanMessageMe.metadata').get(function() {
  return {
    displayName: 'Who can message me',
    description: 'This setting decides who can send you messages'
  };
});

messagingSettingsSchema.virtual('requestMessaging.metadata').get(function() {
  return {
    displayName: 'User must request before messaging me',
    description: 'This setting decides whether users can message you instantly or need to first send you message request'
  };
});

messagingSettingsSchema.virtual('whatMessageDataCanPeopleSendMe.metadata').get(function() {
  return {
    displayName: 'What type of messages people can send me',
    description: 'This setting decides whether users can send you text, audio, video or link messages'
  };
});

messagingSettingsSchema.virtual('addMeToJoinedCommunitiesChats.metadata').get(function() {
  return {
    displayName: 'Add me to joined communities chats',
    description: 'This setting decides whether you will receive request to be added to community chats (if it have them enabled or if automatic join is sent) upon joining. Keep in mind that if you disable this, and after a time enable it again, you will not be added to these chats. You will have to manually ask to join them on corresponding community page'
  };
});

messagingSettingsSchema.virtual('usersThatCannotMessageMe.metadata').get(function() {
  return {
    displayName: 'Users you disabled from messaging you',
    description: 'This setting stores users that you decided cannot message you but which you havent blocked'
  };
})

const MessagingSettings = models.MessagingSettings || model('InteractionSettings', messagingSettingsSchema);

export default MessagingSettings;

