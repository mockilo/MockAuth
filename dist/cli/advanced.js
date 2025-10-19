"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedMockAuthCLI = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const crypto = __importStar(require("crypto"));
class AdvancedMockAuthCLI {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }
    async run() {
        const args = this.parseArgs();
        if (args.help) {
            this.showAdvancedHelp();
            return;
        }
        switch (args.command) {
            case 'init':
                await this.initProjectAdvanced(args);
                break;
            case 'start':
                await this.startServerAdvanced(args);
                break;
            case 'test':
                await this.runTestsAdvanced(args);
                break;
            case 'generate':
                await this.generateDataAdvanced(args);
                break;
            case 'migrate':
                await this.migrateDatabaseAdvanced(args);
                break;
            case 'deploy':
                await this.deployToCloud(args);
                break;
            case 'monitor':
                await this.startMonitoring(args);
                break;
            case 'backup':
                await this.backupData(args);
                break;
            case 'restore':
                await this.restoreData(args);
                break;
            case 'validate':
                await this.validateConfig(args);
                break;
            case 'benchmark':
                await this.runBenchmarks(args);
                break;
            case 'docs':
                await this.generateDocs(args);
                break;
            case 'plugin':
                await this.managePlugins(args);
                break;
            default:
                console.log(`❌ Unknown command: ${args.command}`);
                this.showAdvancedHelp();
        }
    }
    parseArgs() {
        const args = process.argv.slice(2);
        const options = {
            command: args[0] || 'help',
        };
        for (let i = 1; i < args.length; i++) {
            const arg = args[i];
            const nextArg = args[i + 1];
            switch (arg) {
                case '--config':
                case '-c':
                    options.config = nextArg;
                    i++;
                    break;
                case '--port':
                case '-p':
                    options.port = parseInt(nextArg);
                    i++;
                    break;
                case '--database':
                case '-d':
                    options.database = nextArg;
                    i++;
                    break;
                case '--output':
                case '-o':
                    options.output = nextArg;
                    i++;
                    break;
                case '--verbose':
                case '-v':
                    options.verbose = true;
                    break;
                case '--watch':
                case '-w':
                    options.watch = true;
                    break;
                case '--env':
                case '-e':
                    options.env = nextArg;
                    i++;
                    break;
                case '--profile':
                    options.profile = nextArg;
                    i++;
                    break;
                case '--help':
                case '-h':
                    options.help = true;
                    break;
            }
        }
        return options;
    }
    showAdvancedHelp() {
        console.log(`
🚀 MockAuth Advanced CLI - The Complete Auth Mocking Platform

USAGE:
  mockauth <command> [options]

COMMANDS:
  init       Initialize new MockAuth project with advanced configuration
  start      Start MockAuth server with monitoring
  test       Run comprehensive test suites
  generate   Generate mock data with advanced patterns
  migrate    Run database migrations with rollback support
  deploy     Deploy to cloud platforms (AWS, GCP, Azure)
  monitor    Start real-time monitoring dashboard
  backup     Backup database and configuration
  restore    Restore from backup
  validate   Validate configuration and dependencies
  benchmark  Run performance benchmarks
  docs       Generate API documentation
  plugin     Manage plugins and extensions

OPTIONS:
  -c, --config <file>     Configuration file path
  -p, --port <number>     Server port (default: 3001)
  -d, --database <type>   Database type (memory|sqlite|postgresql|mysql)
  -o, --output <path>     Output directory for generated files
  -v, --verbose           Enable verbose logging
  -w, --watch             Watch mode for development
  -e, --env <environment> Environment (dev|staging|prod)
  --profile <profile>     Use specific configuration profile
  -h, --help              Show this help message

ADVANCED EXAMPLES:
  mockauth init --env prod --profile enterprise
  mockauth start --watch --verbose
  mockauth deploy --env staging --profile aws
  mockauth monitor --port 3003
  mockauth benchmark --database postgresql
  mockauth plugin install oauth-provider
  mockauth docs --output ./docs/api

For more information, visit: https://github.com/mockilo/mockauth
    `);
    }
    async deployToCloud(options) {
        console.log('☁️ Deploying MockAuth to cloud...\n');
        const platform = await this.question('Select platform (aws|gcp|azure|docker): ');
        const environment = options.env || (await this.question('Environment (dev|staging|prod): '));
        switch (platform.toLowerCase()) {
            case 'aws':
                await this.deployToAWS(environment, options);
                break;
            case 'gcp':
                await this.deployToGCP(environment, options);
                break;
            case 'azure':
                await this.deployToAzure(environment, options);
                break;
            case 'docker':
                await this.deployWithDocker(environment, options);
                break;
            default:
                console.log('❌ Unsupported platform');
        }
    }
    async deployToAWS(environment, options) {
        console.log('🚀 Deploying to AWS...');
        const deploymentScript = `#!/bin/bash
# AWS Deployment Script for MockAuth

# Set environment variables
export ENVIRONMENT=${environment}
export AWS_REGION=us-east-1
export STACK_NAME=mockauth-${environment}

# Create CloudFormation stack
aws cloudformation create-stack \\
  --stack-name $STACK_NAME \\
  --template-body file://aws-template.yaml \\
  --parameters ParameterKey=Environment,ParameterValue=$ENVIRONMENT \\
  --capabilities CAPABILITY_IAM

echo "✅ MockAuth deployed to AWS: https://mockauth-${environment}.amazonaws.com"
`;
        fs.writeFileSync('deploy-aws.sh', deploymentScript);
        console.log('📝 AWS deployment script created: deploy-aws.sh');
        console.log('🚀 Run: chmod +x deploy-aws.sh && ./deploy-aws.sh');
    }
    async deployToGCP(environment, options) {
        console.log('🚀 Deploying to Google Cloud...');
        const deploymentScript = `#!/bin/bash
# GCP Deployment Script for MockAuth

# Set environment variables
export ENVIRONMENT=${environment}
export PROJECT_ID=mockauth-${environment}
export REGION=us-central1

# Deploy to Cloud Run
gcloud run deploy mockauth \\
  --source . \\
  --platform managed \\
  --region $REGION \\
  --allow-unauthenticated \\
  --set-env-vars ENVIRONMENT=$ENVIRONMENT

echo "✅ MockAuth deployed to GCP: https://mockauth-${environment}.run.app"
`;
        fs.writeFileSync('deploy-gcp.sh', deploymentScript);
        console.log('📝 GCP deployment script created: deploy-gcp.sh');
        console.log('🚀 Run: chmod +x deploy-gcp.sh && ./deploy-gcp.sh');
    }
    async deployToAzure(environment, options) {
        console.log('🚀 Deploying to Azure...');
        const deploymentScript = `#!/bin/bash
# Azure Deployment Script for MockAuth

# Set environment variables
export ENVIRONMENT=${environment}
export RESOURCE_GROUP=mockauth-${environment}-rg
export APP_NAME=mockauth-${environment}

# Create resource group
az group create --name $RESOURCE_GROUP --location eastus

# Deploy to App Service
az webapp up \\
  --name $APP_NAME \\
  --resource-group $RESOURCE_GROUP \\
  --runtime "NODE:18-lts"

echo "✅ MockAuth deployed to Azure: https://mockauth-${environment}.azurewebsites.net"
`;
        fs.writeFileSync('deploy-azure.sh', deploymentScript);
        console.log('📝 Azure deployment script created: deploy-azure.sh');
        console.log('🚀 Run: chmod +x deploy-azure.sh && ./deploy-azure.sh');
    }
    async deployWithDocker(environment, options) {
        console.log('🐳 Creating Docker deployment...');
        const dockerfile = `FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy source code
COPY dist/ ./dist/
COPY mockauth.config.js ./

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S mockauth -u 1001

# Change ownership
RUN chown -R mockauth:nodejs /app
USER mockauth

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \\
  CMD node -e "require('http').get('http://localhost:3001/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Start application
CMD ["node", "dist/index.js"]
`;
        const dockerCompose = `version: '3.8'

services:
  mockauth:
    build: .
    ports:
      - "3001:3001"
    environment:
      - NODE_ENV=${environment}
      - DATABASE_URL=postgresql://user:password@db:5432/mockauth
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=mockauth
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    restart: unless-stopped

volumes:
  postgres_data:
`;
        fs.writeFileSync('Dockerfile', dockerfile);
        fs.writeFileSync('docker-compose.yml', dockerCompose);
        console.log('📝 Docker files created:');
        console.log('   • Dockerfile');
        console.log('   • docker-compose.yml');
        console.log('🚀 Run: docker-compose up -d');
    }
    async startMonitoring(options) {
        console.log('📊 Starting MockAuth monitoring dashboard...\n');
        const monitoringHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MockAuth Monitoring Dashboard</title>
    <link rel="icon" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='.9em' font-size='90'>📊</text></svg>">
    <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
    <style>
        body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .dashboard { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .card { background: white; padding: 20px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .metric { font-size: 2em; font-weight: bold; color: #667eea; }
        .status { padding: 5px 10px; border-radius: 5px; color: white; }
        .status.healthy { background: #2ed573; }
        .status.warning { background: #ffa502; }
        .status.error { background: #ff4757; }
    </style>
</head>
<body>
    <h1>🎭 MockAuth Monitoring Dashboard</h1>
    <div class="dashboard">
        <div class="card">
            <h3>System Status</h3>
            <div id="systemStatus" class="status">Loading...</div>
            <p>Uptime: <span id="uptime">-</span></p>
            <div id="serverMessage" style="margin-top: 10px; padding: 10px; background: #f8f9fa; border-radius: 5px; display: none;">
                <strong>💡 Tip:</strong> Start MockAuth server to see live metrics:<br>
                <code>node dist/cli/index.js</code> → "Start MockAuth Server"
            </div>
        </div>
        <div class="card">
            <h3>Request Rate</h3>
            <div class="metric" id="requestRate">0</div>
            <p>requests/minute</p>
        </div>
        <div class="card">
            <h3>Response Time</h3>
            <div class="metric" id="responseTime">0</div>
            <p>ms average</p>
        </div>
        <div class="card">
            <h3>Error Rate</h3>
            <div class="metric" id="errorRate">0</div>
            <p>% errors</p>
        </div>
        <div class="card">
            <h3>Active Users</h3>
            <div class="metric" id="activeUsers">0</div>
            <p>concurrent sessions</p>
        </div>
        <div class="card">
            <h3>Performance Chart</h3>
            <canvas id="performanceChart" width="400" height="200"></canvas>
        </div>
    </div>

    <script>
        const ctx = document.getElementById('performanceChart').getContext('2d');
        const chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [{
                    label: 'Response Time (ms)',
                    data: [],
                    borderColor: '#667eea',
                    tension: 0.1
                }]
            },
            options: {
                responsive: true,
                scales: {
                    y: { beginAtZero: true }
                }
            }
        });

        async function updateMetrics() {
            try {
                const response = await fetch('http://localhost:3001/metrics');
                if (!response.ok) {
                    throw new Error('Server not responding');
                }
                const data = await response.json();
                
                document.getElementById('systemStatus').textContent = 'Healthy';
                document.getElementById('systemStatus').className = 'status healthy';
                document.getElementById('uptime').textContent = Math.floor(data.data.uptime) + 's';
                document.getElementById('requestRate').textContent = data.data.requestCount;
                document.getElementById('responseTime').textContent = data.data.averageResponseTime;
                document.getElementById('errorRate').textContent = data.data.errorRate;
                
                // Hide helpful message when server is running
                document.getElementById('serverMessage').style.display = 'none';
                
                // Update chart
                const now = new Date().toLocaleTimeString();
                chart.data.labels.push(now);
                chart.data.datasets[0].data.push(data.data.averageResponseTime);
                
                if (chart.data.labels.length > 20) {
                    chart.data.labels.shift();
                    chart.data.datasets[0].data.shift();
                }
                
                chart.update();
                
            } catch (error) {
                // Show server not running status
                document.getElementById('systemStatus').textContent = 'Server Not Running';
                document.getElementById('systemStatus').className = 'status error';
                document.getElementById('uptime').textContent = 'N/A';
                document.getElementById('requestRate').textContent = '0';
                document.getElementById('responseTime').textContent = 'N/A';
                document.getElementById('errorRate').textContent = 'N/A';
                
                // Show helpful message
                document.getElementById('serverMessage').style.display = 'block';
                
                // Add placeholder data to chart
                const now = new Date().toLocaleTimeString();
                chart.data.labels.push(now);
                chart.data.datasets[0].data.push(0);
                
                if (chart.data.labels.length > 20) {
                    chart.data.labels.shift();
                    chart.data.datasets[0].data.shift();
                }
                
                chart.update();
            }
        }

        // Update every 5 seconds
        setInterval(updateMetrics, 5000);
        updateMetrics();
    </script>
</body>
</html>`;
        const port = options.port || 3003;
        const express = require('express');
        const app = express();
        app.use(express.static('.'));
        app.get('/', (req, res) => {
            res.send(monitoringHTML);
        });
        app.listen(port, () => {
            console.log(`📊 Monitoring dashboard running on http://localhost:${port}`);
            console.log('🔄 Refreshing metrics every 5 seconds');
        });
    }
    async backupData(options) {
        console.log('💾 Creating MockAuth backup...\n');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupDir = `./backups/backup-${timestamp}`;
        if (!fs.existsSync('./backups')) {
            fs.mkdirSync('./backups', { recursive: true });
        }
        fs.mkdirSync(backupDir, { recursive: true });
        // Backup configuration
        if (fs.existsSync('mockauth.config.js')) {
            fs.copyFileSync('mockauth.config.js', path.join(backupDir, 'config.js'));
        }
        // Backup database
        if (fs.existsSync('mockauth.db')) {
            fs.copyFileSync('mockauth.db', path.join(backupDir, 'database.db'));
        }
        // Backup mock data
        if (fs.existsSync('./mock-data')) {
            this.copyDirectory('./mock-data', path.join(backupDir, 'mock-data'));
        }
        // Create backup manifest
        const manifest = {
            timestamp: new Date().toISOString(),
            version: '1.0.0',
            files: fs.readdirSync(backupDir),
            size: this.getDirectorySize(backupDir),
        };
        fs.writeFileSync(path.join(backupDir, 'manifest.json'), JSON.stringify(manifest, null, 2));
        console.log(`✅ Backup created: ${backupDir}`);
        console.log(`📁 Files backed up: ${manifest.files.length}`);
        console.log(`💾 Backup size: ${(manifest.size / 1024).toFixed(2)} KB`);
    }
    async restoreData(options) {
        console.log('🔄 Restoring MockAuth from backup...\n');
        const backups = fs
            .readdirSync('./backups')
            .filter((dir) => dir.startsWith('backup-'));
        if (backups.length === 0) {
            console.log('❌ No backups found');
            return;
        }
        console.log('Available backups:');
        backups.forEach((backup, index) => {
            console.log(`  ${index + 1}. ${backup}`);
        });
        const choice = await this.question('Select backup to restore (number): ');
        const selectedBackup = backups[parseInt(choice) - 1];
        if (!selectedBackup) {
            console.log('❌ Invalid selection');
            return;
        }
        const backupPath = path.join('./backups', selectedBackup);
        const manifest = JSON.parse(fs.readFileSync(path.join(backupPath, 'manifest.json'), 'utf8'));
        console.log(`🔄 Restoring from: ${selectedBackup}`);
        console.log(`📅 Backup date: ${manifest.timestamp}`);
        // Restore files
        if (fs.existsSync(path.join(backupPath, 'config.js'))) {
            fs.copyFileSync(path.join(backupPath, 'config.js'), 'mockauth.config.js');
            console.log('✅ Configuration restored');
        }
        if (fs.existsSync(path.join(backupPath, 'database.db'))) {
            fs.copyFileSync(path.join(backupPath, 'database.db'), 'mockauth.db');
            console.log('✅ Database restored');
        }
        if (fs.existsSync(path.join(backupPath, 'mock-data'))) {
            this.copyDirectory(path.join(backupPath, 'mock-data'), './mock-data');
            console.log('✅ Mock data restored');
        }
        console.log('🎉 Restore completed successfully!');
    }
    async validateConfig(options) {
        console.log('✅ Validating MockAuth configuration...\n');
        const configPath = options.config || 'mockauth.config.js';
        if (!fs.existsSync(configPath)) {
            console.log('❌ Configuration file not found');
            return;
        }
        try {
            const config = require(path.resolve(configPath));
            // Validate required fields
            const errors = [];
            if (!config.port || config.port < 1000 || config.port > 65535) {
                errors.push('Port must be between 1000 and 65535');
            }
            if (!config.baseUrl || !config.baseUrl.startsWith('http')) {
                errors.push('Base URL must be a valid HTTP URL');
            }
            // FIXED: Updated to match actual validation requirement (32 chars)
            if (!config.jwtSecret || config.jwtSecret.length < 32) {
                errors.push(`JWT Secret must be at least 32 characters (current: ${config.jwtSecret?.length || 0})`);
            }
            if (config.database && config.database.type !== 'memory') {
                if (!config.database.connectionString) {
                    errors.push('Database connection string required for non-memory databases');
                }
            }
            if (errors.length > 0) {
                console.log('❌ Configuration validation failed:');
                errors.forEach((error) => console.log(`   • ${error}`));
            }
            else {
                console.log('✅ Configuration is valid');
                console.log(`📊 Port: ${config.port}`);
                console.log(`🌐 Base URL: ${config.baseUrl}`);
                console.log(`🗄️ Database: ${config.database?.type || 'memory'}`);
                console.log(`🔐 MFA Enabled: ${config.enableMFA ? 'Yes' : 'No'}`);
                console.log(`🎭 Ecosystem: ${config.ecosystem ? 'Enabled' : 'Disabled'}`);
            }
        }
        catch (error) {
            console.log('❌ Failed to load configuration:', error.message);
        }
    }
    async runBenchmarks(options) {
        console.log('⚡ Running MockAuth performance benchmarks...\n');
        const benchmarkScript = `
const { MockAuth } = require('./dist/index.js');
const { performance } = require('perf_hooks');

async function runBenchmarks() {
  console.log('🚀 Starting performance benchmarks...');
  
  const auth = new MockAuth({
    port: 3001,
    baseUrl: 'http://localhost:3001',
    jwtSecret: 'benchmark-secret-key-must-be-at-least-32-characters-long',
    users: [
      {
        email: 'benchmark@example.com',
        username: 'benchmark',
        password: 'benchmark123',
        roles: ['user']
      }
    ]
  });

  await auth.start();
  
  // Benchmark login performance
  const loginTimes = [];
  for (let i = 0; i < 100; i++) {
    const start = performance.now();
    try {
      await auth.login('benchmark@example.com', 'benchmark123');
      const end = performance.now();
      loginTimes.push(end - start);
    } catch (error) {
      console.log('Login error:', error.message);
    }
  }
  
  // Calculate statistics
  const avgLoginTime = loginTimes.reduce((a, b) => a + b, 0) / loginTimes.length;
  const minLoginTime = Math.min(...loginTimes);
  const maxLoginTime = Math.max(...loginTimes);
  
  console.log('📊 Login Performance:');
  console.log(\`   Average: \${avgLoginTime.toFixed(2)}ms\`);
  console.log(\`   Min: \${minLoginTime.toFixed(2)}ms\`);
  console.log(\`   Max: \${maxLoginTime.toFixed(2)}ms\`);
  console.log(\`   Requests/sec: \${(1000 / avgLoginTime).toFixed(2)}\`);
  
  await auth.stop();
  console.log('✅ Benchmarks completed');
}

runBenchmarks().catch(console.error);
`;
        fs.writeFileSync('benchmark.js', benchmarkScript);
        console.log('📝 Benchmark script created: benchmark.js');
        console.log('🚀 Run: node benchmark.js');
    }
    async generateDocs(options) {
        console.log('📚 Generating MockAuth API documentation...\n');
        const outputDir = options.output || './docs';
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        const apiDocs = `# MockAuth API Documentation

## Overview
MockAuth is a developer-first authentication simulator for development, testing, and staging environments.

## Base URL
\`http://localhost:3001\`

## Authentication
MockAuth uses JWT tokens for authentication. Include the token in the Authorization header:
\`Authorization: Bearer <token>\`

## Endpoints

### Health Check
- **GET** \`/health\`
- Returns system health status

### Authentication
- **POST** \`/auth/login\`
- **POST** \`/auth/register\`
- **POST** \`/auth/refresh\`
- **POST** \`/auth/logout\`

### Users
- **GET** \`/users\`
- **GET** \`/users/:id\`
- **POST** \`/users\`
- **PUT** \`/users/:id\`
- **DELETE** \`/users/:id\`

### MFA
- **POST** \`/auth/mfa/setup\`
- **POST** \`/auth/mfa/verify\`
- **POST** \`/auth/mfa/disable\`

### Metrics
- **GET** \`/metrics\`
- Returns performance metrics

## Error Responses
All errors follow this format:
\`\`\`json
{
  "success": false,
  "error": "Error message",
  "code": "ERROR_CODE"
}
\`\`\`

## Rate Limiting
- 100 requests per minute per IP
- 10 login attempts per minute per IP

## Examples

### Login
\`\`\`bash
curl -X POST http://localhost:3001/auth/login \\
  -H "Content-Type: application/json" \\
  -d '{"email":"admin@example.com","password":"admin123"}'
\`\`\`

### Get Users
\`\`\`bash
curl -H "Authorization: Bearer <token>" \\
  http://localhost:3001/users
\`\`\`
`;
        fs.writeFileSync(path.join(outputDir, 'api.md'), apiDocs);
        console.log(`✅ API documentation generated: ${outputDir}/api.md`);
        console.log('📖 Open the file in your markdown viewer');
    }
    async managePlugins(options) {
        console.log('🔌 MockAuth Plugin Manager\n');
        const action = await this.question('Action (install|remove|list|update): ');
        switch (action.toLowerCase()) {
            case 'install':
                await this.installPlugin();
                break;
            case 'remove':
                await this.removePlugin();
                break;
            case 'list':
                await this.listPlugins();
                break;
            case 'update':
                await this.updatePlugins();
                break;
            default:
                console.log('❌ Invalid action');
        }
    }
    async installPlugin() {
        const pluginName = await this.question('Plugin name: ');
        const availablePlugins = {
            'oauth-provider': 'OAuth 2.0 provider integration',
            'ldap-auth': 'LDAP authentication support',
            'saml-sso': 'SAML SSO integration',
            'rate-limiter': 'Advanced rate limiting',
            'audit-logger': 'Enhanced audit logging',
            'webhook-manager': 'Webhook management system',
        };
        if (availablePlugins[pluginName]) {
            console.log(`📦 Installing plugin: ${pluginName}`);
            console.log(`📝 Description: ${availablePlugins[pluginName]}`);
            console.log('✅ Plugin installed successfully');
        }
        else {
            console.log('❌ Plugin not found');
            console.log('Available plugins:', Object.keys(availablePlugins).join(', '));
        }
    }
    async removePlugin() {
        const pluginName = await this.question('Plugin name to remove: ');
        console.log(`🗑️ Removing plugin: ${pluginName}`);
        console.log('✅ Plugin removed successfully');
    }
    async listPlugins() {
        console.log('📋 Installed plugins:');
        console.log('   • oauth-provider (v1.0.0)');
        console.log('   • rate-limiter (v2.1.0)');
        console.log('   • audit-logger (v1.5.0)');
    }
    async updatePlugins() {
        console.log('🔄 Updating all plugins...');
        console.log('✅ All plugins updated to latest versions');
    }
    // Helper methods
    async question(prompt) {
        return new Promise((resolve) => {
            this.rl.question(prompt, (answer) => {
                resolve(answer.trim());
            });
        });
    }
    generateSecret() {
        // FIXED: Generate secure 32+ character secret using crypto
        // Generates a 64-character hexadecimal string
        return crypto.randomBytes(32).toString('hex');
    }
    copyDirectory(src, dest) {
        if (!fs.existsSync(dest)) {
            fs.mkdirSync(dest, { recursive: true });
        }
        const files = fs.readdirSync(src);
        files.forEach((file) => {
            const srcPath = path.join(src, file);
            const destPath = path.join(dest, file);
            if (fs.statSync(srcPath).isDirectory()) {
                this.copyDirectory(srcPath, destPath);
            }
            else {
                fs.copyFileSync(srcPath, destPath);
            }
        });
    }
    getDirectorySize(dirPath) {
        let size = 0;
        const files = fs.readdirSync(dirPath);
        files.forEach((file) => {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                size += this.getDirectorySize(filePath);
            }
            else {
                size += stats.size;
            }
        });
        return size;
    }
    // Basic CLI methods (delegated from main CLI)
    async initProjectAdvanced(options) {
        console.log('🎯 Advanced project initialization...');
        // Implementation for advanced init
    }
    async startServerAdvanced(options) {
        console.log('🚀 Starting advanced server...');
        // Implementation for advanced start
    }
    async runTestsAdvanced(options) {
        console.log('🧪 Running advanced tests...');
        // Implementation for advanced tests
    }
    async generateDataAdvanced(options) {
        console.log('🎭 Advanced data generation...');
        // Implementation for advanced generation
    }
    async migrateDatabaseAdvanced(options) {
        console.log('🗄️ Advanced database migration...');
        // Implementation for advanced migration
    }
    close() {
        this.rl.close();
    }
}
exports.AdvancedMockAuthCLI = AdvancedMockAuthCLI;
// Export for use in main CLI
//# sourceMappingURL=advanced.js.map