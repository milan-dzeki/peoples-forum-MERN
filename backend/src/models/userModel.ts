import { Schema, models, model, InferSchemaType, HydratedDocument } from 'mongoose';
import { isEmail } from 'validator';
import signupInputRules from 'configs/validators/auth/signupInputRules';

const userSchema = new Schema({
  firstName: {
    type: String,
    required: [
      true,
      signupInputRules.firstName.requiredErrorMessage
    ],
    minLength: [
      signupInputRules.firstName.minLength.value, 
      signupInputRules.firstName.minLength.errorMessage
    ],
    maxLength: [
      signupInputRules.firstName.maxLength.value, 
      signupInputRules.firstName.maxLength.errorMessage
    ]
  },
  lastName: {
    type: String,
    required: [
      true,
      signupInputRules.lastName.requiredErrorMessage
    ],
    minLength: [
      signupInputRules.lastName.minLength.value, 
      signupInputRules.lastName.minLength.errorMessage
    ],
    maxLength: [
      signupInputRules.lastName.maxLength.value, 
      signupInputRules.lastName.maxLength.errorMessage
    ]
  },
  fullName: String,
  email: {
    type: String,
    required: [true, signupInputRules.email.requiredErrorMessage],
    lowercase: true,
    unique: true,
    validate: [
      isEmail,
      signupInputRules.email.invalidEmailMesssage
    ]
  },
  password: {
    type: String,
    required: [true, signupInputRules.password.requiredErrorMessage],
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

export type UserSchemaType = HydratedDocument<InferSchemaType<typeof userSchema>>;

const User = models.User || model('User', userSchema);

export default User;