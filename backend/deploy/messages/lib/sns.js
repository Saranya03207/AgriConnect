"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SNS_TOPIC_ARN = exports.snsClient = void 0;
exports.publishNotification = publishNotification;
const client_sns_1 = require("@aws-sdk/client-sns");
exports.snsClient = new client_sns_1.SNSClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
});
exports.SNS_TOPIC_ARN = process.env.SNS_NOTIFICATIONS_TOPIC_ARN ?? '';
async function publishNotification({ subject, message, topicArn = exports.SNS_TOPIC_ARN, attributes, }) {
    await exports.snsClient.send(new client_sns_1.PublishCommand({
        TopicArn: topicArn,
        Subject: subject,
        Message: message,
        MessageAttributes: attributes,
    }));
}
//# sourceMappingURL=sns.js.map