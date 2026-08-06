import { DynamoDBClient } from '@aws-sdk/client-dynamodb'
import { DynamoDBDocumentClient, GetCommand, UpdateCommand, PutCommand } from '@aws-sdk/lib-dynamodb'
import { CognitoIdentityProviderClient, AdminGetUserCommand } from '@aws-sdk/client-cognito-identity-provider'
import { getPresignedUploadUrl } from '../../lib/s3'

const client = new DynamoDBClient({})
const docClient = DynamoDBDocumentClient.from(client)
const TABLE_MAIN = process.env.DYNAMODB_TABLE_MAIN

function jsonResponse(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': process.env.CORS_ORIGIN || '*',
      'Access-Control-Allow-Headers': 'Content-Type,Authorization',
      'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    },
    body: JSON.stringify(body),
  }
}

export const handler = async (event: any) => {
  const { routeKey, pathParameters, body, requestContext } = event

  if (requestContext?.http?.method === 'OPTIONS') {
    return jsonResponse(200, {})
  }

  try {
    if (routeKey === 'POST /users/profile-init') {
      const parsedBody = JSON.parse(body || '{}')
      const { email, role, displayName } = parsedBody

      if (!email || !role || !displayName) {
        return jsonResponse(400, { message: 'email, role, and displayName are required' })
      }

      // Fetch user from Cognito to get their sub (userId)
      const cognito = new CognitoIdentityProviderClient({})
      let userId = ''
      try {
        const result = await cognito.send(new AdminGetUserCommand({
          UserPoolId: process.env.COGNITO_USER_POOL_ID,
          Username: email
        }))
        // Find sub attribute
        const subAttr = result.UserAttributes?.find((attr: any) => attr.Name === 'sub')
        if (subAttr && subAttr.Value) {
          userId = subAttr.Value
        } else {
          userId = result.Username || ''
        }
      } catch (err: any) {
        console.error('Error fetching user from Cognito:', err)
        return jsonResponse(400, { message: 'User not found in Cognito' })
      }

      const now = new Date().toISOString()
      
      // Initialize profile in DynamoDB
      await docClient.send(new PutCommand({
        TableName: TABLE_MAIN,
        Item: {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
          entityType: 'userProfile',
          userId,
          email,
          role,
          displayName,
          isVerified: true,
          isActive: true,
          createdAt: now,
          updatedAt: now
        }
      }))

      return jsonResponse(201, { message: 'Profile initialized successfully', userId })
    }

    if (routeKey === 'GET /users/me') {
      const claims = requestContext?.authorizer?.jwt?.claims || requestContext?.authorizer?.claims;
      const userId = claims?.sub
      if (!userId) return jsonResponse(401, { message: 'Unauthorized' })

      const result = await docClient.send(new GetCommand({
        TableName: TABLE_MAIN,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE'
        }
      }))

      if (!result.Item) {
        // Auto-create profile if it doesn't exist
        const email = claims.email || ''
        const role = claims['custom:role'] || 'farmer'
        const displayName = claims['custom:display_name'] || email || ''
        const now = new Date().toISOString()

        const newProfile = {
          PK: `USER#${userId}`,
          SK: 'PROFILE',
          entityType: 'userProfile',
          userId,
          email,
          role,
          displayName,
          isVerified: true,
          isActive: true,
          createdAt: now,
          updatedAt: now
        }

        await docClient.send(new PutCommand({
          TableName: TABLE_MAIN,
          Item: newProfile
        }))

        return jsonResponse(200, newProfile)
      }

      return jsonResponse(200, result.Item)
    }

    if (routeKey === 'PUT /users/me') {
      const claims = requestContext?.authorizer?.jwt?.claims || requestContext?.authorizer?.claims;
      const userId = claims?.sub
      if (!userId) return jsonResponse(401, { message: 'Unauthorized' })

      const parsedBody = JSON.parse(body || '{}')
      const allowedFields = ['displayName', 'phone', 'bio', 'location', 'profileImage']
      
      const updateExpressions: string[] = []
      const expressionAttributeNames: Record<string, string> = {}
      const expressionAttributeValues: Record<string, any> = {}
      
      allowedFields.forEach(field => {
        if (parsedBody[field] !== undefined) {
          updateExpressions.push(`#${field} = :${field}`)
          expressionAttributeNames[`#${field}`] = field
          expressionAttributeValues[`:${field}`] = parsedBody[field]
        }
      })
      
      if (updateExpressions.length === 0) {
        return jsonResponse(400, { message: 'No valid fields provided to update' })
      }
      
      updateExpressions.push('#updatedAt = :updatedAt')
      expressionAttributeNames['#updatedAt'] = 'updatedAt'
      expressionAttributeValues[':updatedAt'] = new Date().toISOString()
      
      const updateResult = await docClient.send(new UpdateCommand({
        TableName: TABLE_MAIN,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE'
        },
        UpdateExpression: `SET ${updateExpressions.join(', ')}`,
        ExpressionAttributeNames: expressionAttributeNames,
        ExpressionAttributeValues: expressionAttributeValues,
        ReturnValues: 'ALL_NEW'
      }))

      return jsonResponse(200, updateResult.Attributes)
    }

    if (routeKey === 'POST /users/upload-avatar') {
      const claims = requestContext?.authorizer?.jwt?.claims || requestContext?.authorizer?.claims;
      const userId = claims?.sub
      if (!userId) return jsonResponse(401, { message: 'Unauthorized' })

      const parsedBody = JSON.parse(body || '{}')
      const { contentType, extension } = parsedBody

      if (!contentType || !extension) {
        return jsonResponse(400, { message: 'contentType and extension are required' })
      }

      const key = `avatars/${userId}-${Date.now()}.${extension}`
      const uploadUrl = await getPresignedUploadUrl(key, contentType)

      return jsonResponse(200, {
        uploadUrl,
        key,
        publicUrl: `https://${process.env.S3_BUCKET}.s3.${process.env.S3_REGION}.amazonaws.com/${key}`
      })
    }

    if (routeKey === 'GET /users/{userId}') {
      const userId = pathParameters?.userId
      if (!userId) return jsonResponse(400, { message: 'Missing userId parameter' })

      const result = await docClient.send(new GetCommand({
        TableName: TABLE_MAIN,
        Key: {
          PK: `USER#${userId}`,
          SK: 'PROFILE'
        }
      }))

      if (!result.Item) {
        return jsonResponse(404, { message: 'User not found' })
      }

      // Filter sensitive fields for public profile
      const { email, phone, ...publicProfile } = result.Item
      return jsonResponse(200, publicProfile)
    }

    return jsonResponse(404, { message: 'Route not found' })
  } catch (error) {
    console.error('Error in users handler:', error)
    return jsonResponse(500, { message: 'Internal server error' })
  }
}
