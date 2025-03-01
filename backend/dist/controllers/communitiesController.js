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
exports.createCommunity = void 0;
const catchAsync_1 = __importDefault(require("utils/catchAsync"));
exports.createCommunity = (0, catchAsync_1.default)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { pendingInvitedModerators, access, name, description, rules, pendingInvitedUsers, chatNames } = req.fields;
    console.log(pendingInvitedModerators, access, name, description, rules, pendingInvitedUsers, chatNames);
    const pendMods = JSON.parse(pendingInvitedModerators);
    // const error = await CommunityValidator.areUsersValid(pendMods);
    // // console.log(error);
    // const parsedRules = JSON.parse(rules!);
    // // console.log('pRules', parsedRules[0].title)
    // const ruleErr = CommunityValidator.areRulesValid(parsedRules);
    // console.log('rilERr', ruleErr);
    return res.send('cool');
}));
