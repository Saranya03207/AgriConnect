import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { PutCommand, DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)
const TABLE_MAIN = process.env.DYNAMODB_TABLE_MAIN

export const handler = async (event: any) => {
  try {
    const userAttributes = event.request?.userAttributes || {}
    const sub = userAttributes.sub
    
    if (!sub) {
      console.error('No sub provided in event')
      return event
    }

    const email = userAttributes.email
    const displayName = userAttributes['custom:display_name'] || 'User'
    const role = userAttributes['custom:role'] || 'FARMER'
    const phone = userAttributes.phone_number

    const now = new Date().toISOString()
    
    const userRecord: any = {
      PK: `USER#${sub}`,
      SK: 'PROFILE',
      entityType: 'USER',
      userId: sub,
      email,
      displayName,
      role,
      isVerified: false,
      isActive: true,
      GSI1PK: `ROLE#${role}`,
      GSI1SK: `USER#${sub}`,
      GSI2PK: `EMAIL#${email}`,
      GSI2SK: `USER#${sub}`,
      createdAt: now,
      updatedAt: now,
    }
    
    if (phone) {
      userRecord.phone = phone
    }

    await docClient.send(new PutCommand({
      TableName: TABLE_MAIN,
      Item: userRecord
    }))
    
    console.log(`Successfully created user record for ${sub}`)
  } catch (error) {
    console.error('Error in onUserRegistered:', error)
  }

  return event
}
