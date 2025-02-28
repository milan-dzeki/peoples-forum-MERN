import { Schema, models, model } from 'mongoose';

const blockedUserSettingsSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  blockedByMe: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  blockedMe: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true
});

blockedUserSettingsSchema.virtual('metadata').get(function() {
  return {
    displayName: 'List of users you blocked',
    description: 'You will not see these users on the platform and they will not see you. So you will not be able to view chats with them, their posts and messages.'
  };
});

const BlockedUsersSettings = models.BlockedUsersSettings || model('BlockedUsersSettings', blockedUserSettingsSchema);

export default BlockedUsersSettings;