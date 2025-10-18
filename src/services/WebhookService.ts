import { WebhookConfig, WebhookEvent, WebhookService } from '../types';

export function createWebhookService(
  config?: WebhookConfig
): WebhookService | null {
  if (!config) {
    return null;
  }

  return {
    async send(eventName: string, data: any): Promise<void> {
      try {
        const payload = {
          event: eventName,
          timestamp: new Date().toISOString(),
          data,
        };

        // In a real implementation, you would send HTTP requests to the webhook URL
        console.log(`Webhook ${eventName} sent:`, payload);

        // Simulate webhook sending
        // await fetch(config.url, {
        //   method: 'POST',
        //   headers: {
        //     'Content-Type': 'application/json',
        //     'X-Webhook-Secret': config.secret,
        //   },
        //   body: JSON.stringify(payload),
        // });
      } catch (error) {
        console.error(`Failed to send webhook ${eventName}:`, error);
      }
    },
  };
}
