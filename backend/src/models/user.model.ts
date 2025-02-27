import { Schema, models, model } from 'mongoose';
import { isEmail } from 'validator';

const userSchema = new Schema({
  firstName: {
    type: String,
    required: [true, 'First Name is required'],
    minLength: [2, 'First Name must be at least 2 characters long'],
    maxLength: [10, 'First Name must not exceed 10 characters']
  },
  lastName: {
    type: String,
    required: [true, 'Last Name is required'],
    minLength: [2, 'Last Name must be at least 2 characters long'],
    maxLength: [10, 'Last Name must not exceed 10 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    unique: true,
    validate: [
      isEmail,
      'Email format is not valid'
    ]
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    select: false
  },
  role: {
    type: String,
    enum: {
      values: ['user', 'admin'],
      message: 'Role can only be "user" or "admin'
    },
    default: 'user'
  },
  profilePhotoUrl: String,
  // for cloudinary - to be able to use it for user deletions
  profilePhotoPublicId: {
    type: String,
    select: false
  },
  lastTimeSeen: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

const User = models.User || model('User', userSchema);

export default User;