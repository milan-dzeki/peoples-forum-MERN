import { Schema, models, model } from 'mongoose';

const followersSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  myFollowers: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ],
  peopleIFollow: [
    {
      type: Schema.Types.ObjectId,
      ref: 'User'
    }
  ]
});

const Followers = models.Followers || model('Followers', followersSchema);

export default Followers;