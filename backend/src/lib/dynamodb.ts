import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient } from '@aws-sdk/lib-dynamodb'

export const dynamo = new DynamoDBClient({})
export const docClient = DynamoDBDocumentClient.from(dynamo)

export const TABLE_MAIN = process.env.DYNAMODB_TABLE_MAIN!
export const TABLE_ANALYTICS = process.env.DYNAMODB_TABLE_ANALYTICS!
