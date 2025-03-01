import { Schema, models, model } from 'mongoose';
import { isURL } from 'validator';

const profileSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  bannerImageUrl: String,
  // for cloudinary
  bannerImagePublicId: {
    type: String,
    select: false
  },
  description: {
    type: String,
    maxLength: 100
  },
  country: String,
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['male', 'female']
  },
  jobTitle: String,
  links: [
    {
      title: String,
      url: {
        type: String,
        validate: [
          isURL,
          'URL is invalid'
        ]
      }
    }
  ]
}, {
  timestamps: true
});

const Profile = models.Profile || model('Profile', profileSchema);

export default Profile;