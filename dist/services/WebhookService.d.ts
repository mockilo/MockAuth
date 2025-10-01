import { WebhookConfig } from '../types';
export declare function createWebhookService(config?: WebhookConfig): {
    send(eventName: string, data: any): Promise<void>;
} | null;
//# sourceMappingURL=WebhookService.d.ts.map