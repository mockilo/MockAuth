"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createWebhookService = void 0;
function createWebhookService(config) {
    if (!config) {
        return null;
    }
    return {
        async send(eventName, data) {
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
            }
            catch (error) {
                console.error(`Failed to send webhook ${eventName}:`, error);
            }
        },
    };
}
exports.createWebhookService = createWebhookService;
//# sourceMappingURL=WebhookService.js.map