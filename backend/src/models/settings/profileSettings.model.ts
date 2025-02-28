import { Schema, models, model } from 'mongoose';

const profileSettingsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  whoCanSeeMyProfileInfo: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  },
  whoCanSeeMyPosts: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  },
  whoCanSeeMyComments: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  },
  whoCanSeeMyUpvotes: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  },
  whoCanSeeMyDownvotes: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  },
  whoCanSeeMySavedPosts: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  },
  whoCanSeeMySavedComments: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  },
  whoCanSeeMyFriends: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  },
  whoCanSeeMyFollowers: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  },
  whoCanSeePeopleIFollow: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  },
  whoCanSeeMyCommunities: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  },
  whoCanSeeCommunitiesIJoined: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  },
  whoCanSeeMyActivityStats: {
    type: [{
      type: String,
      enum: ['everyone', 'followers', 'people_I_follow', 'friends', 'friends_of_friends', 'no_one'],
      default: ['everyone']
    }]
  }
}, {
  timestamps: true
});

profileSettingsSchema.virtual('whoCanSeeMyProfileInfo.metadata').get(function() {
  return {
    displayName: 'Who can see my profile info',
    description: 'This setting decides who can see your basic info upon your profile visit'
  };
});

profileSettingsSchema.virtual('whoCanSeeMyPosts.metadata').get(function() {
  return {
    displayName: 'Who can see my posts',
    description: 'This setting decides who can see your created posts upon your profile visit'
  };
});

profileSettingsSchema.virtual('whoCanSeeMyComments.metadata').get(function() {
  return {
    displayName: 'Who can see my comments',
    description: 'This setting decides who can see your created comments upon your profile visit'
  };
});

profileSettingsSchema.virtual('whoCanSeeMyUpvotes.metadata').get(function() {
  return {
    displayName: 'Who can see my upvotes',
    description: 'This setting decides who can see your upvotes on posts and comments upon your profile visit'
  };
});

profileSettingsSchema.virtual('whoCanSeeMyDownvotes.metadata').get(function() {
  return {
    displayName: 'Who can see my downvotes',
    description:  'This setting decides who can see your downvotes on posts and comments upon your profile visit'
  };
});

profileSettingsSchema.virtual('whoCanSeeMySavedPosts.metadata').get(function() {
  return {
    displayName: 'Who can see my saved posts',
    description: 'This setting decides who can see your saved posts upon your profile visit'
  };
});

profileSettingsSchema.virtual('whoCanSeeMySavedComments.metadata').get(function() {
  return {
    displayName: 'Who can see my saved comments',
    description: 'This setting decides who can see your saved comments upon your profile visit'
  };
});

profileSettingsSchema.virtual('whoCanSeeMyFriends.metadata').get(function() {
  return {
    displayName: 'Who can see my friends',
    description: 'This setting decides who can see your friends upon your profile visit'
  };
});

profileSettingsSchema.virtual('whoCanSeeMyFollowers.metadata').get(function() {
  return {
    displayName:  'Who can see my followers',
    description: 'This setting decides who can see your followers upon your profile visit'
  };
});

profileSettingsSchema.virtual('whoCanSeePeopleIFollow.metadata').get(function() {
  return {
    displayName: 'Who can see people I follow',
    description: 'This setting decides who can see people you follow upon your profile visit'
  };
});

profileSettingsSchema.virtual('whoCanSeeMyCommunities.metadata').get(function() {
  return {
    displayName: 'Who can see my communities',
    description: 'This setting decides who can see communities you created upon your profile visit'
  };
});

profileSettingsSchema.virtual('whoCanSeeCommunitiesIJoined.metadata').get(function() {
  return {
    displayName: 'Who can see communities I joined',
    description: 'This setting decides who can see communities you joined upon your profile visit'
  };
});

profileSettingsSchema.virtual('whoCanSeeMyActivityStats.metadata').get(function() {
  return {
    displayName: 'Who can see my activity stats',
    description: 'This setting decides who can see your activity (posts creation, upvotes and downvotes) upon your profile visit'
  };
});

const ProfileSettings = models.ProfileSettings || model('ProfileSettings', profileSettingsSchema);

export default ProfileSettings;