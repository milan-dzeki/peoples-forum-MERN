"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const friendsSchema = new mongoose_1.Schema({
    receivedPendingRequests: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    sentPendingRequests: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ],
    friends: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
}, {
    timestamps: true
});
const Friends = mongoose_1.models.Friends || (0, mongoose_1.model)('Friends', friendsSchema);
exports.default = Friends;
