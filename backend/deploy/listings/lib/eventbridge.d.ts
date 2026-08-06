import { EventBridgeClient } from '@aws-sdk/client-eventbridge';
export declare const ebClient: EventBridgeClient;
export declare const EVENT_BUS_NAME: string;
interface AgriConnectEvent<T = unknown> {
    source: string;
    detailType: string;
    detail: T;
}
export declare function publishEvent<T>({ source, detailType, detail, }: AgriConnectEvent<T>): Promise<void>;
export {};
//# sourceMappingURL=eventbridge.d.ts.map