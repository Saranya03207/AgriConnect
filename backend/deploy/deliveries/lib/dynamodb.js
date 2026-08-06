"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TABLE_ANALYTICS = exports.TABLE_MAIN = exports.docClient = exports.dynamo = void 0;
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
exports.dynamo = new client_dynamodb_1.DynamoDBClient({});
exports.docClient = lib_dynamodb_1.DynamoDBDocumentClient.from(exports.dynamo);
exports.TABLE_MAIN = process.env.DYNAMODB_TABLE_MAIN;
exports.TABLE_ANALYTICS = process.env.DYNAMODB_TABLE_ANALYTICS;
//# sourceMappingURL=dynamodb.js.map