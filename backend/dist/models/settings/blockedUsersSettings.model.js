"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
const blockedUserSettingsSchema = new mongoose_1.Schema({
    list: [
        {
            type: mongoose_1.Schema.Types.ObjectId,
            ref: 'User'
        }
    ]
}, {
    timestamps: true
});
blockedUserSettingsSchema.virtual('metadata').get(function () {
    return {
        displayName: 'List of users you blocked',
        description: 'You will not see these users on the platform and they will not see you. So you will not be able to view chats with them, their posts and messages.'
    };
});
const BlockedUsersSettings = mongoose_1.models.BlockedUsersSettings || (0, mongoose_1.model)('BlockedUsersSettings', blockedUserSettingsSchema);
exports.default = BlockedUsersSettings;
