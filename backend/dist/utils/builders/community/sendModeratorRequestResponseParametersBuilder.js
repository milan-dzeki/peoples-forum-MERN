"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
class SendModeratorRequestResponseParametersBuilder {
    constructor() {
        this.parameters = {
            commons: {
                communityId: '',
                moderator: ''
            },
            moderatorRequestData: {
                requestType: '',
                communityCreator: '',
                requestText: '',
                updateValues: {}
            },
            communityActivityLogData: {
                logType: '',
                text: '',
                photoUrl: undefined,
            },
            resJson: {
                res: {},
                message: '',
            },
        };
    }
    setCommons(commons) {
        this.parameters.commons = commons;
        return this;
    }
    setCommunityActivityLogData(communityActivityLogData) {
        this.parameters.communityActivityLogData = communityActivityLogData;
        return this;
    }
    setModeratorRequestData(moderatorRequestData) {
        this.parameters.moderatorRequestData = moderatorRequestData;
        return this;
    }
    setResJson(resJson) {
        this.parameters.resJson = resJson;
        return this;
    }
    build() {
        return this.parameters;
    }
}
exports.default = SendModeratorRequestResponseParametersBuilder;
