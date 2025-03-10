"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const appError_1 = __importDefault(require("utils/appError"));
const communityService_1 = __importDefault(require("services/communityService"));
class CommunityUserManagerBuilder {
    constructor(community, userId, operatorId, userExistsInLists) {
        this.community = community;
        this.userId = userId;
        this.operatorId = operatorId;
        this.userExistsInLists = userExistsInLists;
    }
    throwErrorIfNotInAnyList(errorMsg) {
        const existInAnyList = Object.keys(this.userExistsInLists)
            .some((list) => this.userExistsInLists[list].exists);
        if (!existInAnyList) {
            throw new appError_1.default(400, errorMsg);
        }
        return this;
    }
    throwErrorIfInAnyListExcept(exceptListNames, errorMsg) {
        const isInOtherLists = Object.keys(this.userExistsInLists)
            .find((list) => this.userExistsInLists[list].exists && !exceptListNames.includes(list));
        if (isInOtherLists) {
            throw new appError_1.default(400, `Action failed. Account registered in ${this.userExistsInLists[isInOtherLists].alias}. ${errorMsg || ''}`);
        }
        return this;
    }
    throwErrorIfUserNotInList(listName, errorMsg) {
        if (!this.userExistsInLists[listName].exists) {
            throw new appError_1.default(400, errorMsg);
        }
        return this;
    }
    throwErrorIfCreatorActionTriedByNonCreator(throwCondition, errorMsg) {
        if (throwCondition) {
            throw new appError_1.default(400, errorMsg);
        }
        return this;
    }
    removeUserFromLists(listNames) {
        communityService_1.default.removeUserFromLists(this.community, listNames, this.userId.toString());
        return this;
    }
    addUserToList(list, additionalData) {
        this.community[list].push(Object.assign({ user: this.userId }, additionalData));
        return this;
    }
    saveCommunity() {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.community.save();
            return this;
        });
    }
}
exports.default = CommunityUserManagerBuilder;
