"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const validator_1 = require("validator");
const profileSchema = new mongoose_1.Schema({
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
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
                    validator_1.isURL,
                    'URL is invalid'
                ]
            }
        }
    ]
}, {
    timestamps: true
});
const Profile = mongoose_1.models.Profile || (0, mongoose_1.model)('Profile', profileSchema);
exports.default = Profile;
