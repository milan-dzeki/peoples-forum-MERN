import Notification from 'models/notificationModel';
import { Types } from 'mongoose';
import { NotificationType } from 'types/models/notificationModelTypes';

class NotificationService {
  static async createSingleNotification (
    receiverId: string,
    notificationType: NotificationType,
    text: string,
    sender?: string,
    communityId?: string
  ) {
    try {
      const newNotification = await Notification.create({
        receiver: new Types.ObjectId(receiverId),
        notificationType,
        text,
        sender: sender ? new Types.ObjectId(sender) : null,
        community: communityId ? new Types.ObjectId(communityId) : null
      }); 

      return newNotification;
    } catch (error: unknown) {
      throw error;
    }
  }
}

export default NotificationService;