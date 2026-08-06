import { SNSClient } from '@aws-sdk/client-sns';
export declare const snsClient: SNSClient;
export declare const SNS_TOPIC_ARN: string;
interface PublishNotificationParams {
    subject: string;
    message: string;
    topicArn?: string;
    attributes?: Record<string, {
        DataType: string;
        StringValue: string;
    }>;
}
export declare function publishNotification({ subject, message, topicArn, attributes, }: PublishNotificationParams): Promise<void>;
export {};
//# sourceMappingURL=sns.d.ts.map