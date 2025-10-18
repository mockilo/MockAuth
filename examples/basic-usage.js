const { MockAuth } = require('mockauth');
const config = require('../mockauth.config.js');

async function startMockAuth() {
  const auth = new MockAuth(config);
  await auth.start();
  console.log('🎉 MockAuth is running!');
}

startMockAuth().catch(console.error);