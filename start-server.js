const { MockAuth } = require('./dist/index.js');
const config = require('./mockauth.config.js');

async function startServer() {
  try {
    const auth = new MockAuth(config);
    await auth.start();
    console.log('🎉 MockAuth server is running!');
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
