"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EVENT_BUS_NAME = exports.ebClient = void 0;
exports.publishEvent = publishEvent;
const client_eventbridge_1 = require("@aws-sdk/client-eventbridge");
exports.ebClient = new client_eventbridge_1.EventBridgeClient({
    region: process.env.AWS_REGION ?? 'us-east-1',
});
exports.EVENT_BUS_NAME = process.env.EVENTBRIDGE_BUS_NAME ?? 'agriconnect-event-bus';
async function publishEvent({ source, detailType, detail, }) {
    await exports.ebClient.send(new client_eventbridge_1.PutEventsCommand({
        Entries: [
            {
                EventBusName: exports.EVENT_BUS_NAME,
                Source: source,
                DetailType: detailType,
                Detail: JSON.stringify(detail),
            },
        ],
    }));
}
//# sourceMappingURL=eventbridge.js.map