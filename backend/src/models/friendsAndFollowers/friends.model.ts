import { Schema, models, model } from 'mongoose';

const friendsSchema = new Schema({
  receivedPendingRequests: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  sentPendingRequests: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  friends: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
}, {
  timestamps: true
});

const Friends = models.Friends || model('Friends', friendsSchema);

export default Friends;