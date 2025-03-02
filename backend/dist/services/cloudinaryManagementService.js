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
const cloudinary_1 = __importDefault(require("configs/cloudinary"));
const appError_1 = __importDefault(require("utils/appError"));
class CloudinaryManagementService {
    static uploadSinglePhotoToCloudinary(photoFile) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!photoFile || !photoFile.path) {
                throw new appError_1.default(500, 'Invalid photo file provided. Couldnt upload');
            }
            try {
                const uploadedPhoto = yield cloudinary_1.default.uploader.upload(photoFile.path);
                if (!uploadedPhoto.secure_url || !uploadedPhoto.public_id) {
                    throw new appError_1.default(500, 'Unable to upload the photo. Maybe servers are down. Refresh the page and try again.');
                }
                return {
                    secure_url: uploadedPhoto.secure_url,
                    public_id: uploadedPhoto.public_id
                };
            }
            catch (error) {
                throw new appError_1.default(500, 'Unable to upload the photo. Maybe servers are down. Refresh the page and try again.');
            }
        });
    }
}
exports.default = CloudinaryManagementService;
