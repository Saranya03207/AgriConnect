import { SNSClient, PublishCommand } from '@aws-sdk/client-sns'

export const snsClient = new SNSClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
})

export const SNS_TOPIC_ARN = process.env.SNS_NOTIFICATIONS_TOPIC_ARN ?? ''

interface PublishNotificationParams {
  subject: string
  message: string
  topicArn?: string
  attributes?: Record<string, { DataType: string; StringValue: string }>
}

export async function publishNotification({
  subject,
  message,
  topicArn = SNS_TOPIC_ARN,
  attributes,
}: PublishNotificationParams): Promise<void> {
  await snsClient.send(
    new PublishCommand({
      TopicArn:          topicArn,
      Subject:           subject,
      Message:           message,
      MessageAttributes: attributes,
    }),
  )
}
