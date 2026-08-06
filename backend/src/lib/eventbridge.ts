import { EventBridgeClient, PutEventsCommand } from '@aws-sdk/client-eventbridge'

export const ebClient = new EventBridgeClient({
  region: process.env.AWS_REGION ?? 'us-east-1',
})

export const EVENT_BUS_NAME = process.env.EVENTBRIDGE_BUS_NAME ?? 'agriconnect-event-bus'

interface AgriConnectEvent<T = unknown> {
  source:     string
  detailType: string
  detail:     T
}

export async function publishEvent<T>({
  source,
  detailType,
  detail,
}: AgriConnectEvent<T>): Promise<void> {
  await ebClient.send(
    new PutEventsCommand({
      Entries: [
        {
          EventBusName: EVENT_BUS_NAME,
          Source:       source,
          DetailType:   detailType,
          Detail:       JSON.stringify(detail),
        },
      ],
    }),
  )
}
