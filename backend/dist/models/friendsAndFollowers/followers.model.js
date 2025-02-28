"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const followersSchema = new mongoose_1.Schema({
    myFollowers: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    peopleIFollow: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
});
const Followers = mongoose_1.models.Followers || (0, mongoose_1.model)('Followers', followersSchema);
exports.default = Followers;
