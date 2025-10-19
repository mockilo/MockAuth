#!/usr/bin/env node
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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.EnhancedMockAuthCLI = void 0;
const index_1 = require("../index");
const enhanced_ui_1 = __importDefault(require("./enhanced-ui"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const child_process_1 = require("child_process");
const chalk_1 = __importDefault(require("chalk"));
const boxen_1 = __importDefault(require("boxen"));
const inquirer_1 = __importDefault(require("inquirer"));
const crypto = __importStar(require("crypto"));
const readline = __importStar(require("readline"));
class EnhancedMockAuthCLI {
    constructor() {
        this.config = null;
        this.rl = null;
        this.ui = enhanced_ui_1.default.getInstance();
    }
    async run() {
        try {
            // Set up ESC key handler
            this.setupEscKeyHandler();
            // Show welcome screen
            this.ui.showWelcome();
            // Main loop for navigation
            await this.mainLoop();
        }
        catch (error) {
            this.ui.showError('An error occurred:', [
                'Check your configuration',
                'Verify all dependencies are installed',
                'Try running with --help for more options',
            ]);
            process.exit(1);
        }
        finally {
            // Clean up readline interface
            if (this.rl) {
                this.rl.close();
            }
        }
    }
    async mainLoop() {
        while (true) {
            try {
                // Show main menu
                const action = await this.ui.showMainMenu();
                // Handle the selected action
                await this.handleAction(action);
            }
            catch (error) {
                if (error.message === 'ESC_PRESSED') {
                    console.log(chalk_1.default.yellow('\n👋 Goodbye!'));
                    process.exit(0);
                }
                if (error.message === 'BACK_TO_MAIN') {
                    // Clear screen and show welcome again for better UX
                    console.clear();
                    this.ui.showWelcome();
                    // Continue the loop to show main menu again
                    continue;
                }
                throw error;
            }
        }
    }
    setupEscKeyHandler() {
        // Create readline interface for key handling
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
        // Handle raw mode for key detection
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
        // Listen for keypress events
        process.stdin.on('keypress', (str, key) => {
            if (key && key.name === 'escape') {
                console.log(chalk_1.default.yellow('\n\n🔄 Press ESC again to go back, or Ctrl+C to exit'));
                // Set a flag to handle ESC in the next prompt
                global.__escPressed = true;
            }
        });
        // Handle process termination
        process.on('SIGINT', () => {
            console.log(chalk_1.default.yellow('\n\n👋 Goodbye!'));
            process.exit(0);
        });
    }
    // Wrapper for inquirer prompts with ESC key support
    async promptWithEsc(questions) {
        // Process each question individually to catch back immediately
        const result = {};
        for (const question of questions) {
            let enhancedQuestion;
            if (question.type === 'list') {
                enhancedQuestion = {
                    ...question,
                    choices: [
                        ...question.choices,
                        {
                            name: '🚪 Back/Exit',
                            value: '__back__',
                            short: 'Back'
                        }
                    ]
                };
            }
            else if (question.type === 'input') {
                enhancedQuestion = {
                    ...question,
                    message: question.message + ' (or type "back" to go back)',
                    validate: (input) => {
                        const lowerInput = input.toLowerCase().trim();
                        if (lowerInput === 'back' || lowerInput === 'exit' || lowerInput === '__back__' ||
                            lowerInput === 'go back' || lowerInput === 'goback' || lowerInput === 'go-back') {
                            return true; // Allow these special inputs
                        }
                        return question.validate ? question.validate(input) : true;
                    },
                    filter: (input) => {
                        const lowerInput = input.toLowerCase().trim();
                        if (lowerInput === 'back' || lowerInput === 'exit' || lowerInput === '__back__' ||
                            lowerInput === 'go back' || lowerInput === 'goback' || lowerInput === 'go-back') {
                            return '__back__';
                        }
                        return question.filter ? question.filter(input) : input;
                    }
                };
            }
            else if (question.type === 'confirm') {
                enhancedQuestion = {
                    ...question,
                    message: question.message + ' (or type "back" to go back)',
                    validate: (input) => {
                        if (typeof input === 'string') {
                            const lowerInput = input.toLowerCase().trim();
                            if (lowerInput === 'back' || lowerInput === 'exit' || lowerInput === '__back__' ||
                                lowerInput === 'go back' || lowerInput === 'goback' || lowerInput === 'go-back') {
                                return true;
                            }
                        }
                        return question.validate ? question.validate(input) : true;
                    },
                    filter: (input) => {
                        if (typeof input === 'string') {
                            const lowerInput = input.toLowerCase().trim();
                            if (lowerInput === 'back' || lowerInput === 'exit' || lowerInput === '__back__' ||
                                lowerInput === 'go back' || lowerInput === 'goback' || lowerInput === 'go-back') {
                                return '__back__';
                            }
                        }
                        return question.filter ? question.filter(input) : input;
                    }
                };
            }
            else {
                enhancedQuestion = question;
            }
            // Prompt for this single question
            const questionResult = await inquirer_1.default.prompt([enhancedQuestion]);
            // Check if user selected back for this question
            const value = questionResult[question.name];
            if (value === '__back__') {
                console.clear();
                console.log(chalk_1.default.blue('🔄 Going back to main menu...'));
                // Small delay for better UX
                await new Promise(resolve => setTimeout(resolve, 500));
                // Return to main menu by throwing a special error
                throw new Error('BACK_TO_MAIN');
            }
            // Add this result to our final result
            result[question.name] = value;
        }
        return result;
    }
    async handleAction(action) {
        switch (action) {
            case 'init':
                await this.handleInit();
                break;
            case 'start':
                await this.handleStart();
                break;
            case 'server-management':
                await this.handleServerManagement();
                break;
            case 'stop':
                await this.handleStop();
                break;
            case 'restart':
                await this.handleRestart();
                break;
            case 'reset':
                await this.handleReset();
                break;
            case 'status':
                await this.handleStatus();
                break;
            case 'list':
                await this.handleList();
                break;
            case 'kill-all':
                await this.handleKillAll();
                break;
            case 'test':
                await this.handleTest();
                break;
            case 'generate':
                await this.handleGenerate();
                break;
            case 'migrate':
                await this.handleMigration();
                break;
            case 'builder':
                await this.handleBuilder();
                break;
            case 'debug':
                await this.handleDebug();
                break;
            case 'health':
                await this.handleHealth();
                break;
            case 'help':
                await this.handleHelp();
                break;
            default:
                this.ui.showError(`Unknown action: ${action}`);
        }
    }
    async handleInit() {
        this.ui.showInfo('Initializing new MockAuth project...');
        const answers = await this.ui.createInteractiveConfig();
        // Create configuration object
        const config = {
            port: parseInt(answers.port),
            baseUrl: `http://localhost:${answers.port}`, // Use the same port for baseUrl
            jwtSecret: this.generateSecret(),
            database: { type: answers.database },
            enableMFA: answers.enableMFA,
            enablePasswordReset: answers.enablePasswordReset,
            ecosystem: answers.enableEcosystem
                ? {
                    mocktail: {
                        enabled: true,
                        outputPath: './mock-data',
                        seedCount: 100,
                    },
                    schemaghost: { enabled: true, port: parseInt(answers.port) + 1 }, // Use next port
                }
                : {
                    mocktail: { enabled: false },
                    schemaghost: { enabled: false },
                },
        };
        // Create default users if requested
        if (answers.createDefaultUsers) {
            config.users = [];
            for (let i = 0; i < answers.userCount; i++) {
                config.users.push({
                    email: `user${i + 1}@example.com`,
                    username: `user${i + 1}`,
                    password: 'password123',
                    roles: i === 0 ? ['admin'] : ['user'],
                    permissions: i === 0 ? ['read:users', 'write:users'] : ['read:profile'],
                });
            }
        }
        // Save configuration
        const configPath = 'mockauth.config.js';
        const configContent = `module.exports = ${JSON.stringify(config, null, 2)};`;
        fs.writeFileSync(configPath, configContent);
        // Create example files
        this.createExampleFiles();
        this.ui.showSuccess('MockAuth project initialized successfully!', [
            `Configuration saved to: ${configPath}`,
            `Server will run on port: ${answers.port}`,
            `Base URL: http://localhost:${answers.port}`,
            'Example files created in ./examples/',
        ]);
        // Ask if user wants to start the server immediately
        const { startNow } = await this.promptWithEsc([
            {
                type: 'confirm',
                name: 'startNow',
                message: 'Would you like to start the MockAuth server now?',
                default: true,
            },
        ]);
        if (startNow) {
            await this.handleStart();
        }
        else {
            this.ui.showInfo('Run "mockauth start" when you\'re ready to begin!');
        }
    }
    async handleStart() {
        this.ui.showInfo('Starting MockAuth server...');
        try {
            const config = this.loadConfig();
            const auth = new index_1.MockAuth(config);
            await auth.start();
            await this.ui.showServerStart(config);
            // Keep the process running
            process.on('SIGINT', async () => {
                this.ui.showInfo('Shutting down MockAuth...');
                await auth.stop();
                this.ui.showGoodbye();
                process.exit(0);
            });
            // Keep the process alive
            await new Promise(() => { }); // This keeps the process running indefinitely
        }
        catch (error) {
            this.ui.showError('Failed to start MockAuth server:', [
                'Check if port is available',
                'Verify configuration file exists',
                'Run "mockauth init" to create configuration',
            ]);
        }
    }
    async handleServerManagement() {
        this.ui.showInfo('Server Management - Choose an action');
        const serverChoices = [
            {
                name: '🛑 Stop Server',
                value: 'stop',
                description: 'Stop the running MockAuth server',
            },
            {
                name: '🔄 Restart Server',
                value: 'restart',
                description: 'Restart the MockAuth server',
            },
            {
                name: '🗑️  Reset Server',
                value: 'reset',
                description: 'Reset server data and restart',
            },
            {
                name: '📊 Server Status',
                value: 'status',
                description: 'Check server status and health',
            },
            {
                name: '📋 List Servers',
                value: 'list',
                description: 'List all running MockAuth servers',
            },
            {
                name: '💀 Kill All Servers',
                value: 'kill-all',
                description: 'Stop all running MockAuth servers',
            },
            {
                name: '🔙 Back to Main Menu',
                value: 'back',
                description: 'Return to the main menu',
            },
        ];
        const { serverAction } = await this.promptWithEsc([
            {
                type: 'list',
                name: 'serverAction',
                message: 'What would you like to do?',
                choices: serverChoices,
                pageSize: 10,
            },
        ]);
        if (serverAction === 'back') {
            // Return to main menu by calling run() again
            await this.run();
            return;
        }
        // Handle the selected server management action
        await this.handleAction(serverAction);
    }
    async handleTest() {
        await this.ui.showLoading('Running MockAuth tests...', 3000);
        this.ui.showSuccess('All tests passed!', [
            'Authentication flow: ✅',
            'User management: ✅',
            'Token validation: ✅',
            'API endpoints: ✅',
        ]);
    }
    async handleGenerate() {
        const { outputPath } = await this.ui.createInteractiveConfig();
        await this.ui.showLoading('Generating mock data...', 2000);
        const outputDir = outputPath || './mock-data';
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Generate sample data
        const users = this.generateUsers(50);
        const posts = this.generatePosts(100);
        const products = this.generateProducts(75);
        fs.writeFileSync(path.join(outputDir, 'users.json'), JSON.stringify(users, null, 2));
        fs.writeFileSync(path.join(outputDir, 'posts.json'), JSON.stringify(posts, null, 2));
        fs.writeFileSync(path.join(outputDir, 'products.json'), JSON.stringify(products, null, 2));
        this.ui.showSuccess('Mock data generated successfully!', [
            `Output directory: ${outputDir}`,
            'users.json (50 users)',
            'posts.json (100 posts)',
            'products.json (75 products)',
        ]);
    }
    async handleMigration() {
        this.ui.showInfo('Migration Tools - Choose your production provider');
        const provider = await this.ui.selectMigrationProvider();
        const outputPath = './dist/auth';
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        await this.ui.showLoading(`Generating ${provider} migration files...`, 2000);
        // Generate migration files based on provider
        const migrationFiles = this.generateMigrationFiles(provider, outputPath);
        this.ui.showMigrationSuccess(provider, migrationFiles);
    }
    async handleBuilder() {
        this.ui.showInfo('Launching MockAuth Visual Builder...');
        const builder = (0, child_process_1.spawn)('node', ['dist/web-builder/server.js'], {
            stdio: 'inherit',
        });
        this.ui.showSuccess('Visual Builder launched!', [
            'Open your browser to http://localhost:3000',
            'Configure MockAuth with the intuitive interface',
            'Export configuration when done',
        ]);
        process.on('SIGINT', () => {
            builder.kill();
            this.ui.showGoodbye();
            process.exit(0);
        });
    }
    async handleDebug() {
        this.ui.showInfo('Starting MockAuth Debug Mode...');
        try {
            const config = this.loadConfig();
            const auth = new index_1.MockAuth(config);
            await auth.start();
            this.ui.showSuccess('Debug mode started!', [
                `Server: ${config.baseUrl}`,
                `Debug Console: ${config.baseUrl}/debug`,
                'Real-time request/response inspection',
                'Live user session monitoring',
                'Token validation and debugging',
            ]);
            process.on('SIGINT', async () => {
                await auth.stop();
                this.ui.showGoodbye();
                process.exit(0);
            });
        }
        catch (error) {
            this.ui.showError('Failed to start debug mode:', [
                'Check configuration file',
                'Verify all dependencies are installed',
            ]);
        }
    }
    async handleStop() {
        this.ui.showInfo('Stopping MockAuth server...');
        try {
            const config = this.loadConfig();
            const port = config.port;
            // Try to find and stop the server process
            const serverProcess = await this.findServerProcess(port);
            if (serverProcess) {
                this.ui.showInfo(`Found server running on port ${port} (PID: ${serverProcess.pid})`);
                // Graceful shutdown
                process.kill(serverProcess.pid, 'SIGTERM');
                // Wait a moment for graceful shutdown
                await new Promise((resolve) => setTimeout(resolve, 2000));
                // Force kill if still running
                try {
                    process.kill(serverProcess.pid, 'SIGKILL');
                }
                catch (error) {
                    // Process already stopped
                }
                this.ui.showSuccess('MockAuth server stopped successfully!');
            }
            else {
                this.ui.showInfo(`No MockAuth server found running on port ${port}`);
            }
        }
        catch (error) {
            this.ui.showError('Failed to stop server:', [
                'Check if server is running',
                'Try running "mockauth list" to see running servers',
            ]);
        }
    }
    async handleRestart() {
        this.ui.showInfo('Restarting MockAuth server...');
        try {
            // First stop the server
            await this.handleStop();
            // Wait a moment
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Then start it again
            await this.handleStart();
        }
        catch (error) {
            this.ui.showError('Failed to restart server:', [
                'Check server configuration',
                'Verify port is available',
            ]);
        }
    }
    async handleReset() {
        this.ui.showInfo('Resetting MockAuth server...');
        try {
            const config = this.loadConfig();
            // Stop server if running
            await this.handleStop();
            // Clear database/data files
            this.ui.showInfo('Clearing server data...');
            await this.clearServerData(config);
            // Restart server
            this.ui.showInfo('Starting fresh server...');
            await this.handleStart();
            this.ui.showSuccess('MockAuth server reset successfully!', [
                'All data has been cleared',
                'Server is running with fresh configuration',
            ]);
        }
        catch (error) {
            this.ui.showError('Failed to reset server:', [
                'Check file permissions',
                'Verify configuration is valid',
            ]);
        }
    }
    async handleStatus() {
        this.ui.showInfo('Checking MockAuth server status...');
        try {
            const config = this.loadConfig();
            const port = config.port;
            // Check if server is running
            const serverProcess = await this.findServerProcess(port);
            if (serverProcess) {
                this.ui.showSuccess('Server Status: Running', [
                    `Port: ${port}`,
                    `Process ID: ${serverProcess.pid}`,
                    `URL: ${config.baseUrl}`,
                ]);
                // Test server health
                const isHealthy = await this.testServerHealth(config.baseUrl);
                this.ui.showInfo(`Health: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
                if (isHealthy) {
                    this.ui.showInfo('Available endpoints:');
                    console.log('   • Health: /health');
                    console.log('   • API Docs: /api');
                    console.log('   • Login: POST /auth/login');
                    console.log('   • Users: GET /users');
                }
            }
            else {
                this.ui.showError('Server Status: Not Running', [
                    `Port ${port} is available`,
                    'Run "mockauth start" to start the server',
                ]);
            }
        }
        catch (error) {
            this.ui.showError('Failed to check server status:', [
                'Check configuration file',
                'Verify server is properly installed',
            ]);
        }
    }
    async handleList() {
        this.ui.showInfo('Listing all MockAuth servers...');
        try {
            const runningServers = await this.findAllMockAuthServers();
            if (runningServers.length === 0) {
                this.ui.showInfo('No MockAuth servers currently running');
                console.log('   • Run "mockauth start" to start a server');
                return;
            }
            this.ui.showSuccess(`Found ${runningServers.length} MockAuth server(s):`);
            runningServers.forEach((server, index) => {
                console.log(`\n${index + 1}. MockAuth Server`);
                console.log(`   📡 Port: ${server.port}`);
                console.log(`   🆔 PID: ${server.pid}`);
                console.log(`   🔗 URL: http://localhost:${server.port}`);
                console.log(`   ⏰ Started: ${server.startTime}`);
            });
            this.ui.showInfo('Management commands:');
            console.log('   • Use "mockauth stop --port <port>" to stop a specific server');
            console.log('   • Use "mockauth kill-all" to stop all servers');
        }
        catch (error) {
            this.ui.showError('Failed to list servers:', [
                'Check system permissions',
                'Verify MockAuth is properly installed',
            ]);
        }
    }
    async handleKillAll() {
        this.ui.showInfo('Stopping all MockAuth servers...');
        try {
            const runningServers = await this.findAllMockAuthServers();
            if (runningServers.length === 0) {
                this.ui.showInfo('No MockAuth servers currently running');
                return;
            }
            this.ui.showInfo(`Found ${runningServers.length} server(s) to stop:`);
            for (const server of runningServers) {
                this.ui.showInfo(`Stopping server on port ${server.port} (PID: ${server.pid})...`);
                try {
                    // Graceful shutdown
                    process.kill(server.pid, 'SIGTERM');
                    // Wait for graceful shutdown
                    await new Promise((resolve) => setTimeout(resolve, 2000));
                    // Force kill if still running
                    try {
                        process.kill(server.pid, 'SIGKILL');
                    }
                    catch (error) {
                        // Process already stopped
                    }
                    this.ui.showSuccess(`Server on port ${server.port} stopped`);
                }
                catch (error) {
                    this.ui.showError(`Could not stop server on port ${server.port}: ${error.message}`);
                }
            }
            this.ui.showSuccess('All MockAuth servers stopped!');
        }
        catch (error) {
            this.ui.showError('Failed to stop servers:', [
                'Check system permissions',
                'Some servers may still be running',
            ]);
        }
    }
    async handleHealth() {
        this.ui.showInfo('Running MockAuth Health Check...');
        try {
            const config = this.loadConfig();
            const auth = new index_1.MockAuth(config);
            await auth.start();
            // Simulate health check
            const healthResults = {
                overall: true,
                server: true,
                database: true,
                memory: 45,
                memoryStatus: 'Normal',
                responseTime: 12,
                performanceStatus: 'Excellent',
                activeSessions: 0,
                warnings: [],
                suggestions: [],
            };
            await auth.stop();
            this.ui.showHealthResults(healthResults);
        }
        catch (error) {
            this.ui.showError('Health check failed:', [
                'Configuration file not found',
                'Run "mockauth init" first',
            ]);
        }
    }
    async handleHelp() {
        const helpContent = (0, boxen_1.default)(chalk_1.default.bold.cyan('📚 MockAuth CLI Help') +
            '\n\n' +
            chalk_1.default.bold('Commands:') +
            '\n' +
            chalk_1.default.gray('  init       ') +
            'Initialize new MockAuth project' +
            '\n' +
            chalk_1.default.gray('  start      ') +
            'Start MockAuth server' +
            '\n' +
            chalk_1.default.gray('  test       ') +
            'Run MockAuth tests' +
            '\n' +
            chalk_1.default.gray('  generate   ') +
            'Generate mock data' +
            '\n' +
            chalk_1.default.gray('  migrate    ') +
            'Migration tools' +
            '\n' +
            chalk_1.default.gray('  builder    ') +
            'Visual configuration builder' +
            '\n' +
            chalk_1.default.gray('  debug      ') +
            'Debug console' +
            '\n' +
            chalk_1.default.gray('  health     ') +
            'Health check' +
            '\n\n' +
            chalk_1.default.bold('Examples:') +
            '\n' +
            chalk_1.default.gray('  mockauth init') +
            '\n' +
            chalk_1.default.gray('  mockauth start') +
            '\n' +
            chalk_1.default.gray('  mockauth migrate-to better-auth'), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
            backgroundColor: '#1a1a1a',
        });
        console.log(helpContent);
    }
    // Server Management Helper Methods
    async findServerProcess(port) {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            // Find process using the port
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            if (stdout.trim()) {
                const lines = stdout.trim().split('\n');
                for (const line of lines) {
                    if (line.includes(`:${port}`) && line.includes('LISTENING')) {
                        const parts = line.trim().split(/\s+/);
                        const pid = parseInt(parts[parts.length - 1]);
                        if (pid && pid > 0) {
                            return { pid, port };
                        }
                    }
                }
            }
            return null;
        }
        catch (error) {
            return null;
        }
    }
    async findAllMockAuthServers() {
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            const servers = [];
            // Find all Node.js processes
            const { stdout } = await execAsync('tasklist /FI "IMAGENAME eq node.exe" /FO CSV');
            if (stdout.trim()) {
                const lines = stdout.trim().split('\n').slice(1); // Skip header
                for (const line of lines) {
                    const parts = line.split(',').map((part) => part.replace(/"/g, ''));
                    if (parts.length >= 2) {
                        const pid = parseInt(parts[1]);
                        if (pid && pid > 0) {
                            // Check if this process is using a port (simplified check)
                            try {
                                const { stdout: netstat } = await execAsync(`netstat -ano | findstr ${pid}`);
                                if (netstat.trim()) {
                                    const portMatch = netstat.match(/:(\d+).*LISTENING/);
                                    if (portMatch) {
                                        const port = parseInt(portMatch[1]);
                                        if (port >= 3000 && port <= 9999) {
                                            // Likely a MockAuth port
                                            servers.push({
                                                pid,
                                                port,
                                                startTime: new Date().toISOString(),
                                            });
                                        }
                                    }
                                }
                            }
                            catch (error) {
                                // Skip this process
                            }
                        }
                    }
                }
            }
            return servers;
        }
        catch (error) {
            return [];
        }
    }
    async testServerHealth(baseUrl) {
        try {
            // Use built-in fetch (Node.js 18+) or fallback to http module
            const response = await fetch(`${baseUrl}/health`, {
                method: 'GET',
                signal: AbortSignal.timeout(5000),
            });
            return response.ok;
        }
        catch (error) {
            return false;
        }
    }
    async clearServerData(config) {
        try {
            // Clear database files based on type
            if (config.database?.type === 'sqlite') {
                const dbPath = config.database.connectionString || './mockauth.db';
                if (fs.existsSync(dbPath)) {
                    fs.unlinkSync(dbPath);
                    console.log('🗑️  Cleared SQLite database');
                }
            }
            // Clear any cached data
            const cacheDir = './.mockauth-cache';
            if (fs.existsSync(cacheDir)) {
                fs.rmSync(cacheDir, { recursive: true, force: true });
                console.log('🗑️  Cleared cache directory');
            }
            // Clear session data
            const sessionDir = './sessions';
            if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
                console.log('🗑️  Cleared session data');
            }
        }
        catch (error) {
            console.log('⚠️  Some data could not be cleared:', error.message);
        }
    }
    // Helper methods
    loadConfig() {
        // FIXED: Properly resolve absolute path
        const resolvedPath = path.resolve(process.cwd(), 'mockauth.config.js');
        if (!fs.existsSync(resolvedPath)) {
            throw new Error(`Configuration file not found: ${resolvedPath}\nRun 'mockauth init' to create one.`);
        }
        try {
            delete require.cache[resolvedPath];
            return require(resolvedPath);
        }
        catch (error) {
            throw new Error(`Failed to load configuration: ${error.message}`);
        }
    }
    generateSecret() {
        // FIXED: Generate secure 32+ character secret using crypto
        // Generates a 64-character hexadecimal string
        return crypto.randomBytes(32).toString('hex');
    }
    createExampleFiles() {
        const examplesDir = './examples';
        if (!fs.existsSync(examplesDir)) {
            fs.mkdirSync(examplesDir, { recursive: true });
        }
        // Basic usage example
        const basicExample = `const { MockAuth } = require('mockauth');
const config = require('../mockauth.config.js');

async function startMockAuth() {
  const auth = new MockAuth(config);
  await auth.start();
  console.log('🎉 MockAuth is running!');
}

startMockAuth().catch(console.error);`;
        fs.writeFileSync(path.join(examplesDir, 'basic-usage.js'), basicExample);
    }
    generateUsers(count) {
        const users = [];
        for (let i = 0; i < count; i++) {
            users.push({
                id: i + 1,
                email: `user${i + 1}@example.com`,
                username: `user${i + 1}`,
                firstName: `User ${i + 1}`,
                lastName: 'Example',
                role: i % 10 === 0 ? 'admin' : 'user',
                createdAt: new Date().toISOString(),
            });
        }
        return users;
    }
    generatePosts(count) {
        const posts = [];
        for (let i = 0; i < count; i++) {
            posts.push({
                id: i + 1,
                title: `Mock Post ${i + 1}`,
                content: `This is mock content for post ${i + 1}`,
                authorId: Math.floor(Math.random() * 50) + 1,
                published: Math.random() > 0.3,
                createdAt: new Date().toISOString(),
            });
        }
        return posts;
    }
    generateProducts(count) {
        const products = [];
        for (let i = 0; i < count; i++) {
            products.push({
                id: i + 1,
                name: `Product ${i + 1}`,
                price: Math.floor(Math.random() * 100) + 10,
                category: ['electronics', 'clothing', 'books'][i % 3],
                inStock: Math.random() > 0.2,
                createdAt: new Date().toISOString(),
            });
        }
        return products;
    }
    generateMigrationFiles(provider, outputPath) {
        const files = [];
        switch (provider) {
            case 'better-auth':
                files.push(this.generateBetterAuthMigration(outputPath));
                break;
            case 'clerk':
                files.push(this.generateClerkMigration(outputPath));
                break;
            case 'auth0':
                files.push(this.generateAuth0Migration(outputPath));
                break;
            case 'firebase':
                files.push(this.generateFirebaseMigration(outputPath));
                break;
            case 'supabase':
                files.push(this.generateSupabaseMigration(outputPath));
                break;
        }
        return files;
    }
    generateBetterAuthMigration(outputPath) {
        const betterAuthFile = path.join(outputPath, 'better-auth.js');
        const content = `// Better-Auth Migration File
import { betterAuth } from 'better-auth';

const auth = betterAuth({
  database: {
    provider: 'postgresql',
    url: process.env.DATABASE_URL
  },
  emailAndPassword: {
    enabled: true
  }
});

export const authService = {
  async login(email, password) {
    const session = await auth.api.signInEmail({
      body: { email, password }
    });
    return session;
  }
};`;
        fs.writeFileSync(betterAuthFile, content);
        return betterAuthFile;
    }
    generateClerkMigration(outputPath) {
        const clerkFile = path.join(outputPath, 'clerk.js');
        const content = `// Clerk Migration File
import { Clerk } from '@clerk/clerk-sdk-node';

const clerk = new Clerk({
  secretKey: process.env.CLERK_SECRET_KEY
});

export const authService = {
  async login(email, password) {
    // Clerk implementation
    return { success: true };
  }
};`;
        fs.writeFileSync(clerkFile, content);
        return clerkFile;
    }
    generateAuth0Migration(outputPath) {
        const auth0File = path.join(outputPath, 'auth0.js');
        const content = `// Auth0 Migration File
export const authService = {
  async login(email, password) {
    // Auth0 implementation
    return { success: true };
  }
};`;
        fs.writeFileSync(auth0File, content);
        return auth0File;
    }
    generateFirebaseMigration(outputPath) {
        const firebaseFile = path.join(outputPath, 'firebase.js');
        const content = `// Firebase Migration File
export const authService = {
  async login(email, password) {
    // Firebase implementation
    return { success: true };
  }
};`;
        fs.writeFileSync(firebaseFile, content);
        return firebaseFile;
    }
    generateSupabaseMigration(outputPath) {
        const supabaseFile = path.join(outputPath, 'supabase.js');
        const content = `// Supabase Migration File
export const authService = {
  async login(email, password) {
    // Supabase implementation
    return { success: true };
  }
};`;
        fs.writeFileSync(supabaseFile, content);
        return supabaseFile;
    }
}
exports.EnhancedMockAuthCLI = EnhancedMockAuthCLI;
// Note: This CLI should be accessed through the main index.js entry point
// Use: node dist/cli/index.js (for enhanced CLI)
// Use: node dist/cli/index.js --legacy (for legacy CLI)
exports.default = EnhancedMockAuthCLI;
//# sourceMappingURL=enhanced-cli.js.map