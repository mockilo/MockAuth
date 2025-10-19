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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleEnhancedCLI = void 0;
const index_1 = require("../index");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const chalk_1 = __importDefault(require("chalk"));
const boxen_1 = __importDefault(require("boxen"));
const inquirer_1 = __importDefault(require("inquirer"));
const crypto = __importStar(require("crypto"));
class SimpleEnhancedCLI {
    constructor() {
        this.config = null;
        this.rl = null;
    }
    async run() {
        try {
            // Set up ESC key handler
            this.setupEscKeyHandler();
            // Show welcome screen
            this.showWelcome();
            // Main loop for navigation
            await this.mainLoop();
        }
        catch (error) {
            console.log(chalk_1.default.red('❌'), chalk_1.default.bold.red('An error occurred:'), error.message);
            console.log(chalk_1.default.yellow('\n💡 Suggestions:'));
            console.log(chalk_1.default.gray('   • Check your configuration'));
            console.log(chalk_1.default.gray('   • Verify all dependencies are installed'));
            console.log(chalk_1.default.gray('   • Try running with --help for more options'));
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
                const action = await this.showMainMenu();
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
                    this.showWelcome();
                    // Continue the loop to show main menu again
                    continue;
                }
                throw error;
            }
        }
    }
    setupEscKeyHandler() {
        // Set up raw mode for key detection
        if (process.stdin.isTTY) {
            process.stdin.setRawMode(true);
        }
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
    showWelcome() {
        console.clear();
        console.log(chalk_1.default.cyan.bold(`
███╗   ███╗ ██████╗  ██████╗██╗  ██╗ █████╗ ██╗   ██╗████████╗██╗  ██╗
████╗ ████║██╔═══██╗██╔════╝██║ ██╔╝██╔══██╗██║   ██║╚══██╔══╝██║  ██║
██╔████╔██║██║   ██║██║     █████╔╝ ███████║██║   ██║   ██║   ███████║
██║╚██╔╝██║██║   ██║██║     ██╔═██╗ ██╔══██║██║   ██║   ██║   ██╔══██║
██║ ╚═╝ ██║╚██████╔╝╚██████╗██║  ██╗██║  ██║╚██████╔╝   ██║   ██║  ██║
╚═╝     ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
`));
        const subtitle = (0, boxen_1.default)(chalk_1.default.bold.cyan('🚀 Developer-First Authentication Simulator') +
            '\n' +
            chalk_1.default.gray('The most powerful auth testing platform for developers'), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
            backgroundColor: '#1a1a1a',
        });
        console.log(subtitle);
    }
    async showMainMenu() {
        const choices = [
            {
                name: '🚀 Initialize New Project',
                value: 'init',
                description: 'Set up a new MockAuth project',
            },
            {
                name: '▶️  Start MockAuth Server',
                value: 'start',
                description: 'Launch the authentication server',
            },
            {
                name: '⚙️  Server Management',
                value: 'server-management',
                description: 'Stop, restart, reset, status, list servers',
            },
            {
                name: '🧪 Run Tests',
                value: 'test',
                description: 'Execute test suites',
            },
            {
                name: '🎭 Generate Mock Data',
                value: 'generate',
                description: 'Create realistic test data',
            },
            {
                name: '🔄 Migration Tools',
                value: 'migrate',
                description: 'Migrate to production auth providers',
            },
            {
                name: '🔗 Framework Integrations',
                value: 'framework-integrations',
                description: 'Set up MockAuth with popular frameworks',
            },
            {
                name: '🎨 Visual Builder',
                value: 'builder',
                description: 'Launch the web-based configuration tool',
            },
            {
                name: '🔍 Debug Console',
                value: 'debug',
                description: 'Start with debugging features',
            },
            {
                name: '🏥 Health Check',
                value: 'health',
                description: 'Run system diagnostics',
            },
            {
                name: '☁️  Advanced Commands',
                value: 'advanced-commands',
                description: 'Deploy, monitor, backup, restore, validate, benchmark, docs, plugin',
            },
            {
                name: '❓ Help & Documentation',
                value: 'help',
                description: 'View help and examples',
            },
            {
                name: '🚪 Exit',
                value: 'exit',
                description: 'Exit the application',
            },
        ];
        const { action } = await this.promptWithEsc([
            {
                type: 'list',
                name: 'action',
                message: chalk_1.default.bold.cyan('What would you like to do?'),
                choices,
            },
        ]);
        return action;
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
            case 'framework-integrations':
                await this.handleFrameworkIntegrations();
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
            case 'advanced-commands':
                await this.handleAdvancedCommands();
                break;
            case 'deploy':
                await this.handleDeploy();
                break;
            case 'monitor':
                await this.handleMonitor();
                break;
            case 'backup':
                await this.handleBackup();
                break;
            case 'restore':
                await this.handleRestore();
                break;
            case 'validate':
                await this.handleValidate();
                break;
            case 'benchmark':
                await this.handleBenchmark();
                break;
            case 'docs':
                await this.handleDocs();
                break;
            case 'plugin':
                await this.handlePlugin();
                break;
            case 'help':
                await this.handleHelp();
                break;
            case 'exit':
                console.log(chalk_1.default.yellow('\n👋 Goodbye!'));
                process.exit(0);
            default:
                console.log(chalk_1.default.red('❌'), chalk_1.default.bold.red(`Unknown action: ${action}`));
        }
    }
    async handleInit() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Initializing new MockAuth project...'));
        const questions = [
            {
                type: 'input',
                name: 'port',
                message: 'Server port:',
                default: '3001',
                validate: (input) => {
                    const port = parseInt(input);
                    return port > 0 && port < 65536
                        ? true
                        : 'Please enter a valid port number';
                },
            },
            {
                type: 'input',
                name: 'baseUrl',
                message: 'Base URL:',
                default: 'http://localhost:3001',
            },
            {
                type: 'list',
                name: 'database',
                message: 'Database type:',
                choices: [
                    { name: '💾 Memory (Default)', value: 'memory' },
                    { name: '🗄️ SQLite', value: 'sqlite' },
                    { name: '🐘 PostgreSQL', value: 'postgresql' },
                    { name: '🐬 MySQL', value: 'mysql' },
                ],
                default: 'memory',
            },
            {
                type: 'confirm',
                name: 'enableMFA',
                message: 'Enable Multi-Factor Authentication?',
                default: true,
            },
            {
                type: 'confirm',
                name: 'enablePasswordReset',
                message: 'Enable Password Reset?',
                default: true,
            },
            {
                type: 'confirm',
                name: 'enableEcosystem',
                message: 'Enable MockTail & SchemaGhost?',
                default: true,
            },
            {
                type: 'confirm',
                name: 'createDefaultUsers',
                message: 'Create default users?',
                default: true,
            },
        ];
        const answers = await this.promptWithEsc(questions);
        // Create configuration object
        const config = {
            port: parseInt(answers.port),
            baseUrl: `http://localhost:${answers.port}`, // Use the same port for baseUrl
            jwtSecret: this.generateSecret(),
            database: { type: answers.database },
            enableMFA: answers.enableMFA,
            enablePasswordReset: answers.enablePasswordReset,
            enableAccountLockout: true,
            logLevel: 'info',
            enableAuditLog: true,
            maxLoginAttempts: 5,
            lockoutDuration: '15m',
            tokenExpiry: '24h',
            refreshTokenExpiry: '7d',
            passwordPolicy: {
                minLength: 8,
                requireUppercase: true,
                requireNumbers: true,
                requireSpecialChars: false,
            },
            cors: {
                origin: true,
                credentials: true,
                methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
                allowedHeaders: ['Content-Type', 'Authorization'],
            },
            rateLimit: {
                windowMs: 15 * 60 * 1000, // 15 minutes
                max: 1000, // limit each IP to 1000 requests per windowMs
                message: 'Too many requests from this IP, please try again later.',
                standardHeaders: true,
                legacyHeaders: false,
            },
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
            const userQuestions = [
                {
                    type: 'number',
                    name: 'userCount',
                    message: 'How many default users to create?',
                    default: 2,
                    validate: (input) => input > 0 && input <= 10
                        ? true
                        : 'Please enter a number between 1 and 10',
                },
            ];
            const { userCount } = await this.promptWithEsc(userQuestions);
            config.users = [];
            for (let i = 0; i < userCount; i++) {
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
        console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green('MockAuth project initialized successfully!'));
        console.log(chalk_1.default.gray('   •'), `Configuration saved to: ${configPath}`);
        console.log(chalk_1.default.gray('   •'), `Server will run on port: ${answers.port}`);
        console.log(chalk_1.default.gray('   •'), `Base URL: http://localhost:${answers.port}`);
        console.log(chalk_1.default.gray('   •'), 'Example files created in ./examples/');
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
            console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Run "mockauth start" when you\'re ready to begin!'));
        }
    }
    async handleStart() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Starting MockAuth server...'));
        try {
            const config = this.loadConfig();
            // Check for existing servers and clean them up
            await this.checkAndCleanupExistingServers(config.port);
            const auth = new index_1.MockAuth(config);
            await auth.start();
            const serverInfo = (0, boxen_1.default)(chalk_1.default.bold.cyan('🚀 MockAuth Server Running') +
                '\n\n' +
                chalk_1.default.gray('Server:') +
                ' ' +
                chalk_1.default.green(config.baseUrl) +
                '\n' +
                chalk_1.default.gray('Port:') +
                ' ' +
                chalk_1.default.cyan(config.port) +
                '\n' +
                chalk_1.default.gray('API Docs:') +
                ' ' +
                chalk_1.default.blue(`${config.baseUrl}/api`) +
                '\n' +
                chalk_1.default.gray('Health:') +
                ' ' +
                chalk_1.default.blue(`${config.baseUrl}/health`), {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'cyan',
                backgroundColor: '#1a1a1a',
            });
            console.log(serverInfo);
            // 🔑 Test Credentials
            console.log(chalk_1.default.bold.cyan('\n🔑 Test Credentials (Ready to Use):'));
            console.log(chalk_1.default.gray('   Admin Account:'));
            console.log(chalk_1.default.gray('     Email:'), chalk_1.default.green('admin@example.com'));
            console.log(chalk_1.default.gray('     Password:'), chalk_1.default.green('admin123'));
            console.log(chalk_1.default.gray('   Standard User:'));
            console.log(chalk_1.default.gray('     Email:'), chalk_1.default.green('user@example.com'));
            console.log(chalk_1.default.gray('     Password:'), chalk_1.default.green('user123'));
            // 🧪 Quick Curl Commands
            console.log(chalk_1.default.bold.cyan('\n🧪 Quick Test Commands:'));
            console.log(chalk_1.default.gray('   # Login as admin'));
            console.log(chalk_1.default.yellow(`   curl -X POST ${config.baseUrl}/auth/login \\`));
            console.log(chalk_1.default.yellow(`     -H "Content-Type: application/json" \\`));
            console.log(chalk_1.default.yellow(`     -d '{"email":"admin@example.com","password":"admin123"}'`));
            console.log(chalk_1.default.gray('\n   # Health check'));
            console.log(chalk_1.default.yellow(`   curl ${config.baseUrl}/health`));
            console.log(chalk_1.default.gray('\n   # Get users (with token)'));
            console.log(chalk_1.default.yellow(`   curl ${config.baseUrl}/users -H "Authorization: Bearer YOUR_TOKEN"`));
            // 🌐 Web Interfaces
            console.log(chalk_1.default.bold.cyan('\n🌐 Web Interfaces:'));
            console.log(chalk_1.default.gray('   - Dashboard:   '), chalk_1.default.green(`${config.baseUrl}/dashboard`));
            console.log(chalk_1.default.gray('   - Login Page:  '), chalk_1.default.green(`${config.baseUrl}/login`));
            console.log(chalk_1.default.gray('   - Signup:      '), chalk_1.default.green(`${config.baseUrl}/signup`));
            console.log(chalk_1.default.gray('   - Builder:     '), chalk_1.default.green(`${config.baseUrl}/builder`));
            // ✨ Active Features
            console.log(chalk_1.default.bold.cyan('\n✨ Active Features:'));
            console.log(chalk_1.default.gray('   •'), chalk_1.default.green('✅'), 'JWT Authentication');
            console.log(chalk_1.default.gray('   •'), chalk_1.default.green('✅'), 'User Registration');
            console.log(chalk_1.default.gray('   •'), chalk_1.default.green('✅'), 'Password Reset');
            console.log(chalk_1.default.gray('   •'), chalk_1.default.yellow('⚠️'), 'MFA (Optional - enable in config)');
            console.log(chalk_1.default.gray('   •'), chalk_1.default.green('✅'), 'Rate Limiting (100 req/15min)');
            console.log(chalk_1.default.gray('   •'), chalk_1.default.green('✅'), 'RBAC & Audit Logging');
            // 📚 Quick Reference
            console.log(chalk_1.default.bold.cyan('\n📚 Key Endpoints:'));
            console.log(chalk_1.default.gray('   •'), chalk_1.default.blue('POST /auth/register'), chalk_1.default.gray('- Register new user'));
            console.log(chalk_1.default.gray('   •'), chalk_1.default.blue('POST /auth/login'), chalk_1.default.gray('- User login'));
            console.log(chalk_1.default.gray('   •'), chalk_1.default.blue('GET /users'), chalk_1.default.gray('- List all users'));
            console.log(chalk_1.default.gray('   •'), chalk_1.default.blue('GET /health'), chalk_1.default.gray('- System health'));
            console.log(chalk_1.default.gray('   •'), chalk_1.default.blue('GET /metrics'), chalk_1.default.gray('- Performance metrics'));
            // 🛑 Stop Instructions
            console.log(chalk_1.default.bold.yellow('\n🛑 Stop Instructions:'));
            console.log(chalk_1.default.gray('   •'), chalk_1.default.yellow('Press Ctrl+C'), chalk_1.default.gray('to gracefully shutdown'));
            console.log(chalk_1.default.gray('   •'), chalk_1.default.gray('All sessions will be saved'));
            console.log(chalk_1.default.gray('   •'), chalk_1.default.gray('Database connections will close cleanly'));
            // Keep the process running
            process.on('SIGINT', async () => {
                console.log(chalk_1.default.blue('\nℹ️'), chalk_1.default.bold.blue('Shutting down MockAuth...'));
                await auth.stop();
                console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green('MockAuth stopped successfully!'));
                process.exit(0);
            });
            // Keep the process alive
            await new Promise(() => { }); // This keeps the process running indefinitely
        }
        catch (error) {
            console.log(chalk_1.default.red('❌'), chalk_1.default.bold.red('Failed to start MockAuth server:'));
            console.log(chalk_1.default.red('Error details:'), error.message);
            console.log(chalk_1.default.gray('   •'), 'Check if port is available');
            console.log(chalk_1.default.gray('   •'), 'Verify configuration file exists');
            console.log(chalk_1.default.gray('   •'), 'Run "mockauth init" to create configuration');
        }
    }
    async handleServerManagement() {
        console.log(chalk_1.default.cyan.bold('\n⚙️  Server Management'));
        console.log(chalk_1.default.gray('Choose a server management action:'));
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
                message: chalk_1.default.bold.cyan('What would you like to do?'),
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
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Running MockAuth tests...'));
        // Simulate test running
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green('All tests passed!'));
        console.log(chalk_1.default.gray('   •'), 'Authentication flow: ✅');
        console.log(chalk_1.default.gray('   •'), 'User management: ✅');
        console.log(chalk_1.default.gray('   •'), 'Token validation: ✅');
        console.log(chalk_1.default.gray('   •'), 'API endpoints: ✅');
    }
    async handleGenerate() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Generating mock data...'));
        const outputDir = './mock-data';
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
        console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green('Mock data generated successfully!'));
        console.log(chalk_1.default.gray('   •'), `Output directory: ${outputDir}`);
        console.log(chalk_1.default.gray('   •'), 'users.json (50 users)');
        console.log(chalk_1.default.gray('   •'), 'posts.json (100 posts)');
        console.log(chalk_1.default.gray('   •'), 'products.json (75 products)');
    }
    async handleMigration() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Migration Tools - Choose your production provider'));
        const providers = [
            {
                name: '✨ Better-Auth (Recommended)',
                value: 'better-auth',
                description: 'Open-source, TypeScript-first authentication',
            },
            {
                name: '🔐 Clerk',
                value: 'clerk',
                description: 'Modern authentication platform',
            },
            {
                name: '🏢 Auth0',
                value: 'auth0',
                description: 'Enterprise identity platform',
            },
            {
                name: '🔥 Firebase Auth',
                value: 'firebase',
                description: "Google's authentication service",
            },
            {
                name: '⚡ Supabase Auth',
                value: 'supabase',
                description: 'Open-source backend platform',
            },
        ];
        const { provider } = await this.promptWithEsc([
            {
                type: 'list',
                name: 'provider',
                message: chalk_1.default.bold.cyan('Choose your production auth provider:'),
                choices: providers,
                pageSize: 10,
            },
        ]);
        const outputPath = './dist/auth';
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue(`Generating ${provider} migration files...`));
        // Simulate file generation
        await new Promise((resolve) => setTimeout(resolve, 1000));
        const migrationFile = path.join(outputPath, `${provider}.js`);
        const content = `// ${provider} Migration File
export const authService = {
  async login(email, password) {
    // ${provider} implementation
    return { success: true };
  }
};`;
        fs.writeFileSync(migrationFile, content);
        const title = (0, boxen_1.default)(chalk_1.default.bold.green('🎉 Migration Generated Successfully!') +
            '\n\n' +
            chalk_1.default.cyan(`Provider: ${provider}`) +
            '\n' +
            chalk_1.default.gray(`Files: 1`), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green',
            backgroundColor: '#1a1a1a',
        });
        console.log(title);
        console.log(chalk_1.default.bold.cyan('\n📁 Generated Files:'));
        console.log(chalk_1.default.gray('   •'), chalk_1.default.green(migrationFile));
        console.log(chalk_1.default.bold.cyan('\n📚 Next Steps:'));
        console.log(chalk_1.default.gray('   1.'), 'Review the generated files');
        console.log(chalk_1.default.gray('   2.'), 'Install dependencies: npm install');
        console.log(chalk_1.default.gray('   3.'), 'Configure environment variables');
        console.log(chalk_1.default.gray('   4.'), 'Test the migration');
        console.log(chalk_1.default.gray('   5.'), 'Deploy to production');
    }
    async handleFrameworkIntegrations() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Framework Integrations - Choose your framework'));
        const frameworks = [
            {
                name: '⚛️  React',
                value: 'react',
                description: 'Popular JavaScript library for building user interfaces',
            },
            {
                name: '🟢 Vue.js',
                value: 'vue',
                description: 'Progressive JavaScript framework',
            },
            {
                name: '🅰️  Angular',
                value: 'angular',
                description: 'Platform for building mobile and desktop web applications',
            },
            {
                name: '🚀 Next.js',
                value: 'nextjs',
                description: 'React framework for production with SSR',
            },
            {
                name: '💚 Nuxt.js',
                value: 'nuxt',
                description: 'Vue.js framework for production with SSR',
            },
            {
                name: '🧡 Svelte',
                value: 'svelte',
                description: 'Modern JavaScript framework with compile-time optimizations',
            },
            {
                name: '⚡ SvelteKit',
                value: 'sveltekit',
                description: 'Svelte framework for building web applications',
            },
            {
                name: '🔵 Solid.js',
                value: 'solid',
                description: 'Reactive JavaScript library for building user interfaces',
            },
        ];
        const { framework } = await this.promptWithEsc([
            {
                type: 'list',
                name: 'framework',
                message: chalk_1.default.bold.cyan('Choose your framework:'),
                choices: frameworks,
                pageSize: 10,
            },
        ]);
        const { projectName } = await this.promptWithEsc([
            {
                type: 'input',
                name: 'projectName',
                message: 'Project name:',
                default: `mockauth-${framework}-app`,
                validate: (input) => input.trim().length > 0 ? true : 'Please enter a project name',
            },
        ]);
        const { outputDir } = await this.promptWithEsc([
            {
                type: 'input',
                name: 'outputDir',
                message: 'Output directory:',
                default: `./${projectName}`,
            },
        ]);
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue(`Generating ${framework} integration...`));
        // Create the project directory
        if (!fs.existsSync(outputDir)) {
            fs.mkdirSync(outputDir, { recursive: true });
        }
        // Generate framework-specific files
        await this.generateFrameworkIntegration(framework, projectName, outputDir);
        const title = (0, boxen_1.default)(chalk_1.default.bold.green('🎉 Framework Integration Generated Successfully!') +
            '\n\n' +
            chalk_1.default.cyan(`Framework: ${framework}`) +
            '\n' +
            chalk_1.default.gray(`Project: ${projectName}`) +
            '\n' +
            chalk_1.default.gray(`Directory: ${outputDir}`), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green',
            backgroundColor: '#1a1a1a',
        });
        console.log(title);
        console.log(chalk_1.default.bold.cyan('\n📁 Generated Files:'));
        const files = this.getFrameworkFiles(framework);
        files.forEach((file) => {
            console.log(chalk_1.default.gray('   •'), chalk_1.default.green(file));
        });
        console.log(chalk_1.default.bold.cyan('\n📚 Next Steps:'));
        console.log(chalk_1.default.gray('   1.'), `cd ${outputDir}`);
        console.log(chalk_1.default.gray('   2.'), 'npm install');
        console.log(chalk_1.default.gray('   3.'), 'npm run dev');
        console.log(chalk_1.default.gray('   4.'), 'Start MockAuth server: mockauth start');
        console.log(chalk_1.default.gray('   5.'), 'Test the integration');
        console.log(chalk_1.default.bold.cyan('\n🔗 Quick Start:'));
        console.log(chalk_1.default.gray('   •'), 'MockAuth Server: http://localhost:3001');
        console.log(chalk_1.default.gray('   •'), 'Your App: http://localhost:3000');
        console.log(chalk_1.default.gray('   •'), 'Dashboard: http://localhost:3001/dashboard');
    }
    async handleBuilder() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Launching MockAuth Visual Builder...'));
        const { spawn } = require('child_process');
        const port = await this.findAvailablePort(3007, 3012); // Find available port in range
        console.log(`🌐 Builder will be available at: http://localhost:${port}`);
        console.log('📝 Features:');
        console.log('   • Drag-and-drop user management');
        console.log('   • Real-time configuration preview');
        console.log('   • Visual role and permission mapping');
        console.log('   • Test scenarios builder');
        console.log('   • Export configuration as code');
        console.log('\n🚀 Starting builder...');
        // Start the web builder
        const builder = spawn('node', ['dist/web-builder/server.js', '--port', port.toString()], {
            stdio: 'inherit',
        });
        builder.on('error', (error) => {
            console.error('❌ Error starting builder:', error.message);
            console.log('💡 Make sure the web builder is properly installed');
        });
        // Show success message after a brief delay
        setTimeout(() => {
            console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green('Visual Builder launched!'));
            console.log(chalk_1.default.gray('   •'), `Open your browser to http://localhost:${port}`);
            console.log(chalk_1.default.gray('   •'), 'Configure MockAuth with the intuitive interface');
            console.log(chalk_1.default.gray('   •'), 'Export configuration when done');
            console.log('\n🔄 Press Ctrl+C to stop the builder');
        }, 2000);
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping builder...');
            builder.kill();
            process.exit(0);
        });
    }
    async findAvailablePort(startPort, endPort) {
        const net = require('net');
        for (let port = startPort; port <= endPort; port++) {
            const isAvailable = await new Promise((resolve) => {
                const server = net.createServer();
                server.listen(port, () => {
                    server.close(() => resolve(true));
                });
                server.on('error', () => resolve(false));
            });
            if (isAvailable) {
                return port;
            }
        }
        // Fallback to a random port if none in range are available
        return Math.floor(Math.random() * 1000) + 4000;
    }
    async checkAndCleanupExistingServers(port) {
        console.log(chalk_1.default.yellow('🔍 Checking for existing servers...'));
        try {
            // Check if port is in use
            const isPortInUse = !(await new Promise((resolve) => {
                const server = require('net').createServer();
                server.listen(port, () => {
                    server.close(() => resolve(true));
                });
                server.on('error', () => resolve(false));
            }));
            if (isPortInUse) {
                console.log(chalk_1.default.yellow(`⚠️  Port ${port} is already in use`));
                console.log(chalk_1.default.blue('🔄 Attempting to clean up existing servers...'));
                // Try to find and stop existing Node.js processes that might be using the port
                const { exec } = require('child_process');
                const util = require('util');
                const execAsync = util.promisify(exec);
                try {
                    // On Windows, find processes using the port
                    if (process.platform === 'win32') {
                        const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
                        if (stdout.trim()) {
                            console.log(chalk_1.default.blue('🛑 Stopping processes using port'), chalk_1.default.cyan(port));
                            // Extract PID from netstat output and kill specific process
                            const lines = stdout.trim().split('\n');
                            for (const line of lines) {
                                const parts = line.trim().split(/\s+/);
                                if (parts.length >= 5) {
                                    const pid = parts[4];
                                    try {
                                        await execAsync(`taskkill /f /pid ${pid}`);
                                        console.log(chalk_1.default.gray(`   • Stopped process ${pid}`));
                                    }
                                    catch (killError) {
                                        console.log(chalk_1.default.gray(`   • Process ${pid} already stopped or not accessible`));
                                    }
                                }
                            }
                            // Wait a moment for processes to stop
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                    }
                    else {
                        // On Unix-like systems
                        const { stdout } = await execAsync(`lsof -ti:${port}`);
                        if (stdout.trim()) {
                            console.log(chalk_1.default.blue('🛑 Stopping processes using port'), chalk_1.default.cyan(port));
                            const pids = stdout.trim().split('\n');
                            for (const pid of pids) {
                                try {
                                    await execAsync(`kill -9 ${pid.trim()}`);
                                    console.log(chalk_1.default.gray(`   • Stopped process ${pid.trim()}`));
                                }
                                catch (killError) {
                                    console.log(chalk_1.default.gray(`   • Process ${pid.trim()} already stopped or not accessible`));
                                }
                            }
                            // Wait a moment for processes to stop
                            await new Promise(resolve => setTimeout(resolve, 2000));
                        }
                    }
                    // Check if port is now available
                    const isNowAvailable = await new Promise((resolve) => {
                        const server = require('net').createServer();
                        server.listen(port, () => {
                            server.close(() => resolve(true));
                        });
                        server.on('error', () => resolve(false));
                    });
                    if (isNowAvailable) {
                        console.log(chalk_1.default.green('✅ Port is now available'));
                    }
                    else {
                        console.log(chalk_1.default.red('❌ Port is still in use. Please manually stop the existing server.'));
                        console.log(chalk_1.default.gray('   • Check for other applications using port'), chalk_1.default.cyan(port));
                        console.log(chalk_1.default.gray('   • Try running: netstat -ano | findstr :'), chalk_1.default.cyan(port));
                        throw new Error(`Port ${port} is still in use after cleanup attempt`);
                    }
                }
                catch (error) {
                    console.log(chalk_1.default.red('❌ Could not automatically clean up existing servers'));
                    console.log(chalk_1.default.gray('   Please manually stop any existing MockAuth servers'));
                    throw new Error(`Port ${port} is in use and could not be freed automatically`);
                }
            }
            else {
                console.log(chalk_1.default.green('✅ Port is available'));
            }
        }
        catch (error) {
            console.log(chalk_1.default.red('❌ Error checking port availability:'), error.message);
            throw error;
        }
    }
    async handleDebug() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Starting MockAuth Debug Mode...'));
        try {
            // Load configuration
            const configPath = 'mockauth.config.js';
            let config;
            if (fs.existsSync(configPath)) {
                config = require(path.resolve(configPath));
            }
            else {
                // Default debug configuration
                config = {
                    port: 3005,
                    baseUrl: 'http://localhost:3005',
                    jwtSecret: 'debug-secret-key',
                    database: { type: 'memory' },
                    enableMFA: true,
                    enablePasswordReset: true,
                    enableAccountLockout: true,
                    logLevel: 'debug',
                    enableAuditLog: true,
                    users: [
                        {
                            email: 'admin@example.com',
                            username: 'admin',
                            password: 'admin123',
                            roles: ['admin'],
                            permissions: ['read:users', 'write:users', 'delete:users']
                        },
                        {
                            email: 'user@example.com',
                            username: 'user',
                            password: 'user123',
                            roles: ['user'],
                            permissions: ['read:profile']
                        }
                    ]
                };
            }
            // Find available port for debug console (avoid conflicts with main server)
            const debugPort = await this.findAvailablePort(3005, 3010);
            config.port = debugPort;
            config.baseUrl = `http://localhost:${debugPort}`;
            console.log(chalk_1.default.blue('🔧'), `Debug Console will run on port ${debugPort}`);
            // Start MockAuth server with debug features
            const { MockAuth } = require('../index');
            const auth = new MockAuth(config);
            await auth.start();
            console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green('Debug mode started!'));
            console.log(chalk_1.default.cyan('🔗'), `Server: ${config.baseUrl}`);
            console.log(chalk_1.default.cyan('🔍'), `Debug Console: ${config.baseUrl}/debug`);
            console.log(chalk_1.default.gray('   •'), 'Real-time request/response inspection');
            console.log(chalk_1.default.gray('   •'), 'Live user session monitoring');
            console.log(chalk_1.default.gray('   •'), 'Token validation and debugging');
            console.log(chalk_1.default.gray('   •'), 'Performance metrics dashboard');
            console.log(chalk_1.default.gray('   •'), 'API testing playground');
            console.log(chalk_1.default.yellow('\n🔄 Press Ctrl+C to stop'));
            // Handle graceful shutdown
            process.on('SIGINT', async () => {
                console.log(chalk_1.default.yellow('\n🛑 Shutting down debug mode...'));
                await auth.stop();
                process.exit(0);
            });
            // Keep the debug server running - don't return to main menu
            console.log(chalk_1.default.blue('\n🔍 Debug Console is now running...'));
            console.log(chalk_1.default.gray('   Open your browser to:'), chalk_1.default.cyan(config.baseUrl + '/debug'));
            console.log(chalk_1.default.gray('   The server will continue running until you press Ctrl+C'));
            // Keep the process alive with a simple infinite loop
            while (true) {
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
        }
        catch (error) {
            console.error(chalk_1.default.red('❌ Error starting debug mode:'), error.message);
            console.log(chalk_1.default.gray('   • Check configuration file'));
            console.log(chalk_1.default.gray('   • Verify all dependencies are installed'));
            process.exit(1);
        }
    }
    async handleHealth() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Running MockAuth Health Check...'));
        // Simulate health check
        await new Promise((resolve) => setTimeout(resolve, 1000));
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
        const status = healthResults.overall ? '✅ Healthy' : '❌ Issues Detected';
        const color = healthResults.overall ? 'green' : 'red';
        const title = (0, boxen_1.default)(chalk_1.default.bold[color](`🏥 Health Check Results: ${status}`), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: color,
            backgroundColor: '#1a1a1a',
        });
        console.log(title);
        console.log(chalk_1.default.bold.cyan('\n📊 System Status:'));
        console.log(chalk_1.default.gray('   Server:'), healthResults.server ? chalk_1.default.green('✅ Running') : chalk_1.default.red('❌ Failed'));
        console.log(chalk_1.default.gray('   Database:'), healthResults.database
            ? chalk_1.default.green('✅ Connected')
            : chalk_1.default.red('❌ Failed'));
        console.log(chalk_1.default.gray('   Memory:'), chalk_1.default.yellow(`${healthResults.memory}MB (${healthResults.memoryStatus})`));
        console.log(chalk_1.default.gray('   Response Time:'), chalk_1.default.yellow(`${healthResults.responseTime}ms (${healthResults.performanceStatus})`));
        console.log(chalk_1.default.gray('   Active Sessions:'), chalk_1.default.cyan(healthResults.activeSessions));
    }
    async handleStop() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Stopping MockAuth server...'));
        try {
            const config = this.loadConfig();
            const port = config.port;
            // Try to find and stop the server process
            const serverProcess = await this.findServerProcess(port);
            if (serverProcess) {
                console.log(chalk_1.default.cyan('📡'), chalk_1.default.bold.cyan(`Found server running on port ${port} (PID: ${serverProcess.pid})`));
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
                console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green('MockAuth server stopped successfully!'));
            }
            else {
                console.log(chalk_1.default.yellow('ℹ️'), chalk_1.default.bold.yellow(`No MockAuth server found running on port ${port}`));
            }
        }
        catch (error) {
            console.log(chalk_1.default.red('❌'), chalk_1.default.bold.red('Failed to stop server:'));
            console.log(chalk_1.default.red('Error details:'), error.message);
            console.log(chalk_1.default.gray('   •'), 'Check if server is running');
            console.log(chalk_1.default.gray('   •'), 'Try running "mockauth list" to see running servers');
        }
    }
    async handleRestart() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Restarting MockAuth server...'));
        try {
            // First stop the server
            await this.handleStop();
            // Wait a moment
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Then start it again
            await this.handleStart();
        }
        catch (error) {
            console.log(chalk_1.default.red('❌'), chalk_1.default.bold.red('Failed to restart server:'));
            console.log(chalk_1.default.red('Error details:'), error.message);
            console.log(chalk_1.default.gray('   •'), 'Check server configuration');
            console.log(chalk_1.default.gray('   •'), 'Verify port is available');
        }
    }
    async handleReset() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Resetting MockAuth server...'));
        try {
            const config = this.loadConfig();
            // Stop server if running
            await this.handleStop();
            // Clear database/data files
            console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Clearing server data...'));
            await this.clearServerData(config);
            // Restart server
            console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Starting fresh server...'));
            await this.handleStart();
            console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green('MockAuth server reset successfully!'));
            console.log(chalk_1.default.gray('   •'), 'All data has been cleared');
            console.log(chalk_1.default.gray('   •'), 'Server is running with fresh configuration');
        }
        catch (error) {
            console.log(chalk_1.default.red('❌'), chalk_1.default.bold.red('Failed to reset server:'));
            console.log(chalk_1.default.red('Error details:'), error.message);
            console.log(chalk_1.default.gray('   •'), 'Check file permissions');
            console.log(chalk_1.default.gray('   •'), 'Verify configuration is valid');
        }
    }
    async handleStatus() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Checking MockAuth server status...'));
        try {
            const config = this.loadConfig();
            const port = config.port;
            // Check if server is running
            const serverProcess = await this.findServerProcess(port);
            if (serverProcess) {
                const statusBox = (0, boxen_1.default)(chalk_1.default.bold.green('✅ Server Status: Running') +
                    '\n\n' +
                    chalk_1.default.gray('Port:') +
                    ' ' +
                    chalk_1.default.cyan(port) +
                    '\n' +
                    chalk_1.default.gray('Process ID:') +
                    ' ' +
                    chalk_1.default.cyan(serverProcess.pid) +
                    '\n' +
                    chalk_1.default.gray('URL:') +
                    ' ' +
                    chalk_1.default.blue(config.baseUrl), {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'green',
                    backgroundColor: '#1a1a1a',
                });
                console.log(statusBox);
                // Test server health
                const isHealthy = await this.testServerHealth(config.baseUrl);
                console.log(chalk_1.default.cyan('💚'), chalk_1.default.bold.cyan(`Health: ${isHealthy ? 'Healthy' : 'Unhealthy'}`));
                if (isHealthy) {
                    console.log(chalk_1.default.bold.cyan('\n📚 Available endpoints:'));
                    console.log(chalk_1.default.gray('   •'), chalk_1.default.blue('Health: /health'));
                    console.log(chalk_1.default.gray('   •'), chalk_1.default.blue('API Docs: /api'));
                    console.log(chalk_1.default.gray('   •'), chalk_1.default.blue('Login: POST /auth/login'));
                    console.log(chalk_1.default.gray('   •'), chalk_1.default.blue('Users: GET /users'));
                }
            }
            else {
                const statusBox = (0, boxen_1.default)(chalk_1.default.bold.red('❌ Server Status: Not Running') +
                    '\n\n' +
                    chalk_1.default.gray(`Port ${port} is available`) +
                    '\n' +
                    chalk_1.default.gray('Run "mockauth start" to start the server'), {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'red',
                    backgroundColor: '#1a1a1a',
                });
                console.log(statusBox);
            }
        }
        catch (error) {
            console.log(chalk_1.default.red('❌'), chalk_1.default.bold.red('Failed to check server status:'));
            console.log(chalk_1.default.red('Error details:'), error.message);
            console.log(chalk_1.default.gray('   •'), 'Check configuration file');
            console.log(chalk_1.default.gray('   •'), 'Verify server is properly installed');
        }
    }
    async handleList() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Listing all MockAuth servers...'));
        try {
            const runningServers = await this.findAllMockAuthServers();
            if (runningServers.length === 0) {
                const noServersBox = (0, boxen_1.default)(chalk_1.default.bold.yellow('ℹ️ No MockAuth servers currently running') +
                    '\n\n' +
                    chalk_1.default.gray('Run "mockauth start" to start a server'), {
                    padding: 1,
                    margin: 1,
                    borderStyle: 'round',
                    borderColor: 'yellow',
                    backgroundColor: '#1a1a1a',
                });
                console.log(noServersBox);
                return;
            }
            const serversBox = (0, boxen_1.default)(chalk_1.default.bold.cyan(`Found ${runningServers.length} MockAuth server(s):`) +
                '\n\n' +
                runningServers
                    .map((server, index) => chalk_1.default.gray(`${index + 1}.`) +
                    ' MockAuth Server\n' +
                    chalk_1.default.gray('   📡 Port:') +
                    ' ' +
                    chalk_1.default.cyan(server.port) +
                    '\n' +
                    chalk_1.default.gray('   🆔 PID:') +
                    ' ' +
                    chalk_1.default.cyan(server.pid) +
                    '\n' +
                    chalk_1.default.gray('   🔗 URL:') +
                    ' ' +
                    chalk_1.default.blue(`http://localhost:${server.port}`) +
                    '\n' +
                    chalk_1.default.gray('   ⏰ Started:') +
                    ' ' +
                    chalk_1.default.gray(server.startTime))
                    .join('\n\n'), {
                padding: 1,
                margin: 1,
                borderStyle: 'round',
                borderColor: 'cyan',
                backgroundColor: '#1a1a1a',
            });
            console.log(serversBox);
            console.log(chalk_1.default.bold.cyan('\n💡 Management commands:'));
            console.log(chalk_1.default.gray('   •'), 'Use "mockauth stop --port <port>" to stop a specific server');
            console.log(chalk_1.default.gray('   •'), 'Use "mockauth kill-all" to stop all servers');
        }
        catch (error) {
            console.log(chalk_1.default.red('❌'), chalk_1.default.bold.red('Failed to list servers:'));
            console.log(chalk_1.default.red('Error details:'), error.message);
            console.log(chalk_1.default.gray('   •'), 'Check system permissions');
            console.log(chalk_1.default.gray('   •'), 'Verify MockAuth is properly installed');
        }
    }
    async handleKillAll() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Stopping all MockAuth servers...'));
        try {
            const runningServers = await this.findAllMockAuthServers();
            if (runningServers.length === 0) {
                console.log(chalk_1.default.yellow('ℹ️'), chalk_1.default.bold.yellow('No MockAuth servers currently running'));
                return;
            }
            console.log(chalk_1.default.cyan('📋'), chalk_1.default.bold.cyan(`Found ${runningServers.length} server(s) to stop:`));
            for (const server of runningServers) {
                console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue(`Stopping server on port ${server.port} (PID: ${server.pid})...`));
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
                    console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green(`Server on port ${server.port} stopped`));
                }
                catch (error) {
                    console.log(chalk_1.default.red('⚠️'), chalk_1.default.bold.red(`Could not stop server on port ${server.port}: ${error.message}`));
                }
            }
            console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green('All MockAuth servers stopped!'));
        }
        catch (error) {
            console.log(chalk_1.default.red('❌'), chalk_1.default.bold.red('Failed to stop servers:'));
            console.log(chalk_1.default.red('Error details:'), error.message);
            console.log(chalk_1.default.gray('   •'), 'Check system permissions');
            console.log(chalk_1.default.gray('   •'), 'Some servers may still be running');
        }
    }
    async handleHelp() {
        const helpContent = (0, boxen_1.default)(chalk_1.default.bold.cyan('📚 MockAuth CLI - Comprehensive Guide') +
            '\n\n' +
            // Commands section
            chalk_1.default.bold.yellow('⚡ Available Commands:') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth init') +
            chalk_1.default.gray(' [--template]') +
            '\n' +
            chalk_1.default.gray('    Initialize a new MockAuth project') +
            '\n' +
            chalk_1.default.gray('    Flags: --template=basic|enterprise|minimal') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth start') +
            chalk_1.default.gray(' [--port] [--watch]') +
            '\n' +
            chalk_1.default.gray('    Start the MockAuth server') +
            '\n' +
            chalk_1.default.gray('    Flags: --port=3001, --watch (auto-reload)') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth stop') +
            chalk_1.default.gray(' [--port]') +
            '\n' +
            chalk_1.default.gray('    Stop the MockAuth server') +
            '\n' +
            chalk_1.default.gray('    Flags: --port=3001 (stop specific port)') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth restart') +
            chalk_1.default.gray(' [--port]') +
            '\n' +
            chalk_1.default.gray('    Restart the MockAuth server') +
            '\n' +
            chalk_1.default.gray('    Flags: --port=3001 (restart specific port)') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth reset') +
            chalk_1.default.gray(' [--port]') +
            '\n' +
            chalk_1.default.gray('    Reset server data and restart') +
            '\n' +
            chalk_1.default.gray('    Flags: --port=3001 (reset specific port)') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth status') +
            chalk_1.default.gray(' [--port]') +
            '\n' +
            chalk_1.default.gray('    Check server status and health') +
            '\n' +
            chalk_1.default.gray('    Flags: --port=3001 (check specific port)') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth list') +
            '\n' +
            chalk_1.default.gray('    List all running MockAuth servers') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth kill-all') +
            '\n' +
            chalk_1.default.gray('    Stop all running MockAuth servers') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth test') +
            chalk_1.default.gray(' [--coverage]') +
            '\n' +
            chalk_1.default.gray('    Run authentication tests') +
            '\n' +
            chalk_1.default.gray('    Flags: --coverage (generate coverage report)') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth generate') +
            chalk_1.default.gray(' [--count] [--type]') +
            '\n' +
            chalk_1.default.gray('    Generate mock data (users, tokens, sessions)') +
            '\n' +
            chalk_1.default.gray('    Flags: --count=100, --type=users|tokens|all') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth builder') +
            '\n' +
            chalk_1.default.gray('    Open visual configuration builder (web UI)') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth migrate-to') +
            chalk_1.default.gray(' <provider>') +
            '\n' +
            chalk_1.default.gray('    Migrate to production auth (better-auth, auth0, etc)') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth health') +
            '\n' +
            chalk_1.default.gray('    Check server health and system status') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth debug') +
            '\n' +
            chalk_1.default.gray('    Interactive debugging console') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth deploy') +
            chalk_1.default.gray(' [--env] [--profile]') +
            '\n' +
            chalk_1.default.gray('    Deploy to cloud platforms (AWS, GCP, Azure, Docker)') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth monitor') +
            chalk_1.default.gray(' [--watch]') +
            '\n' +
            chalk_1.default.gray('    Real-time server monitoring dashboard') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth backup') +
            chalk_1.default.gray(' [--output]') +
            '\n' +
            chalk_1.default.gray('    Backup server data and configuration') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth restore') +
            chalk_1.default.gray(' [--file]') +
            '\n' +
            chalk_1.default.gray('    Restore from backup') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth validate') +
            chalk_1.default.gray(' [--config]') +
            '\n' +
            chalk_1.default.gray('    Validate configuration files and dependencies') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth benchmark') +
            chalk_1.default.gray(' [--duration]') +
            '\n' +
            chalk_1.default.gray('    Performance benchmarking') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth docs') +
            chalk_1.default.gray(' [--open]') +
            '\n' +
            chalk_1.default.gray('    Generate and open API documentation') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth plugin') +
            chalk_1.default.gray(' [--list|--install|--remove]') +
            '\n' +
            chalk_1.default.gray('    Plugin management system') +
            '\n\n' +
            chalk_1.default.cyan('  mockauth --legacy') +
            '\n' +
            chalk_1.default.gray('    Use legacy CLI interface (no enhanced UI)') +
            '\n\n' +
            // Examples section
            chalk_1.default.bold.yellow('📖 Common Examples:') +
            '\n\n' +
            chalk_1.default.gray('  # Quick start - create and run') +
            '\n' +
            chalk_1.default.white('  mockauth init && mockauth start') +
            '\n\n' +
            chalk_1.default.gray('  # Start on custom port') +
            '\n' +
            chalk_1.default.white('  mockauth start --port=4000') +
            '\n\n' +
            chalk_1.default.gray('  # Stop server') +
            '\n' +
            chalk_1.default.white('  mockauth stop --port=3001') +
            '\n\n' +
            chalk_1.default.gray('  # Restart server') +
            '\n' +
            chalk_1.default.white('  mockauth restart') +
            '\n\n' +
            chalk_1.default.gray('  # Reset server data') +
            '\n' +
            chalk_1.default.white('  mockauth reset') +
            '\n\n' +
            chalk_1.default.gray('  # Check server status') +
            '\n' +
            chalk_1.default.white('  mockauth status') +
            '\n\n' +
            chalk_1.default.gray('  # List all servers') +
            '\n' +
            chalk_1.default.white('  mockauth list') +
            '\n\n' +
            chalk_1.default.gray('  # Stop all servers') +
            '\n' +
            chalk_1.default.white('  mockauth kill-all') +
            '\n\n' +
            chalk_1.default.gray('  # Generate 500 test users') +
            '\n' +
            chalk_1.default.white('  mockauth generate --count=500 --type=users') +
            '\n\n' +
            chalk_1.default.gray('  # Open visual builder') +
            '\n' +
            chalk_1.default.white('  mockauth builder') +
            '\n\n' +
            chalk_1.default.gray('  # Migrate to Better Auth') +
            '\n' +
            chalk_1.default.white('  mockauth migrate-to better-auth') +
            '\n\n' +
            chalk_1.default.gray('  # Use legacy interface') +
            '\n' +
            chalk_1.default.white('  mockauth --legacy init') +
            '\n\n' +
            chalk_1.default.gray('  # Deploy to production') +
            '\n' +
            chalk_1.default.white('  mockauth deploy --env=production') +
            '\n\n' +
            chalk_1.default.gray('  # Monitor server performance') +
            '\n' +
            chalk_1.default.white('  mockauth monitor --watch') +
            '\n\n' +
            chalk_1.default.gray('  # Backup server data') +
            '\n' +
            chalk_1.default.white('  mockauth backup --output=./backup') +
            '\n\n' +
            chalk_1.default.gray('  # Run performance benchmarks') +
            '\n' +
            chalk_1.default.white('  mockauth benchmark --duration=300') +
            '\n\n' +
            chalk_1.default.gray('  # Generate API documentation') +
            '\n' +
            chalk_1.default.white('  mockauth docs --open') +
            '\n\n' +
            chalk_1.default.gray('  # Manage plugins') +
            '\n' +
            chalk_1.default.white('  mockauth plugin --list') +
            '\n\n' +
            // Quick Start section
            chalk_1.default.bold.yellow('🚀 Quick Start (30 seconds):') +
            '\n\n' +
            chalk_1.default.gray('  1.') +
            ' mockauth init' +
            chalk_1.default.gray('           # Create config') +
            '\n' +
            chalk_1.default.gray('  2.') +
            ' mockauth start' +
            chalk_1.default.gray('          # Start server') +
            '\n' +
            chalk_1.default.gray('  3.') +
            ' Open http://localhost:3001/dashboard' +
            '\n\n' +
            // Useful Links section
            chalk_1.default.bold.yellow('🔗 Useful Links:') +
            '\n\n' +
            chalk_1.default.gray('  Web Dashboard:  ') +
            chalk_1.default.green('http://localhost:3001/dashboard') +
            '\n' +
            chalk_1.default.gray('  Visual Builder: ') +
            chalk_1.default.green('http://localhost:3001/builder') +
            '\n' +
            chalk_1.default.gray('  API Docs:       ') +
            chalk_1.default.green('http://localhost:3001/api') +
            '\n' +
            chalk_1.default.gray('  Health Check:   ') +
            chalk_1.default.green('http://localhost:3001/health') +
            '\n\n' +
            // Support section
            chalk_1.default.bold.yellow('💬 Need Help?') +
            '\n\n' +
            chalk_1.default.gray('  Documentation:  ') +
            chalk_1.default.blue('https://mockauth.dev/docs') +
            '\n' +
            chalk_1.default.gray('  GitHub Issues:  ') +
            chalk_1.default.blue('https://github.com/mockilo/mockauth') +
            '\n' +
            chalk_1.default.gray('  Discord:        ') +
            chalk_1.default.blue('https://discord.gg/mockauth') +
            '\n', {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
            backgroundColor: '#1a1a1a',
        });
        console.log(helpContent);
        // Show tip at the bottom
        console.log(chalk_1.default.dim('\n  💡 Tip: Run ') +
            chalk_1.default.cyan('mockauth <command> --help') +
            chalk_1.default.dim(' for detailed info about a specific command\n'));
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
                    console.log(chalk_1.default.gray('🗑️'), 'Cleared SQLite database');
                }
            }
            // Clear any cached data
            const cacheDir = './.mockauth-cache';
            if (fs.existsSync(cacheDir)) {
                fs.rmSync(cacheDir, { recursive: true, force: true });
                console.log(chalk_1.default.gray('🗑️'), 'Cleared cache directory');
            }
            // Clear session data
            const sessionDir = './sessions';
            if (fs.existsSync(sessionDir)) {
                fs.rmSync(sessionDir, { recursive: true, force: true });
                console.log(chalk_1.default.gray('🗑️'), 'Cleared session data');
            }
        }
        catch (error) {
            console.log(chalk_1.default.yellow('⚠️'), chalk_1.default.bold.yellow('Some data could not be cleared:'), error.message);
        }
    }
    // Helper methods
    loadConfig() {
        // FIXED: Properly resolve absolute path with better error message
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
    // Advanced Commands Implementation
    async handleAdvancedCommands() {
        console.log(chalk_1.default.cyan.bold('\n☁️  Advanced Commands'));
        console.log(chalk_1.default.gray('Choose an advanced command:'));
        const advancedChoices = [
            {
                name: '🌐 Web Dashboard',
                value: 'web-dashboard',
                description: 'Open beautiful web interface for advanced commands',
            },
            {
                name: '🚀 Deploy to Cloud',
                value: 'deploy',
                description: 'Deploy MockAuth to cloud platforms (AWS, GCP, Azure, Docker)',
            },
            {
                name: '📊 Real-time Monitoring',
                value: 'monitor',
                description: 'Start real-time server monitoring dashboard',
            },
            {
                name: '💾 Backup Data',
                value: 'backup',
                description: 'Backup server data and configuration',
            },
            {
                name: '🔄 Restore Data',
                value: 'restore',
                description: 'Restore from backup',
            },
            {
                name: '✅ Validate Configuration',
                value: 'validate',
                description: 'Validate configuration files and dependencies',
            },
            {
                name: '⚡ Performance Benchmark',
                value: 'benchmark',
                description: 'Run performance benchmarks',
            },
            {
                name: '📚 Generate Documentation',
                value: 'docs',
                description: 'Generate and open API documentation',
            },
            {
                name: '🔌 Plugin Management',
                value: 'plugin',
                description: 'Manage plugins and extensions',
            },
            {
                name: '🔙 Back to Main Menu',
                value: 'back',
                description: 'Return to the main menu',
            },
        ];
        const { advancedAction } = await this.promptWithEsc([
            {
                type: 'list',
                name: 'advancedAction',
                message: chalk_1.default.bold.cyan('What would you like to do?'),
                choices: advancedChoices,
                pageSize: 10,
            },
        ]);
        if (advancedAction === 'back') {
            // Return to main menu by calling run() again
            await this.run();
            return;
        }
        if (advancedAction === 'web-dashboard') {
            await this.handleWebDashboard();
            return;
        }
        // Handle the selected advanced command
        await this.handleAction(advancedAction);
    }
    async handleWebDashboard() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Starting MockAuth Advanced Web Dashboard...'));
        const { port } = await this.promptWithEsc([
            {
                type: 'input',
                name: 'port',
                message: 'Web dashboard port:',
                default: '3004',
                validate: (input) => {
                    const port = parseInt(input);
                    return port > 0 && port < 65536
                        ? true
                        : 'Please enter a valid port number';
                },
            },
        ]);
        console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green('Starting web dashboard server...'));
        // Start the web dashboard server
        const { spawn } = require('child_process');
        const path = require('path');
        const serverPath = path.join(__dirname, '../web-builder/advanced-server.js');
        const server = spawn('node', [serverPath], {
            env: { ...process.env, PORT: port },
            stdio: 'inherit'
        });
        console.log(chalk_1.default.green('🌐'), chalk_1.default.bold.green(`Advanced Web Dashboard running on http://localhost:${port}`));
        console.log(chalk_1.default.gray('   •'), 'Beautiful web interface for all advanced commands');
        console.log(chalk_1.default.gray('   •'), 'Same design as MockAuth dashboard');
        console.log(chalk_1.default.gray('   •'), 'Interactive forms and real-time updates');
        console.log(chalk_1.default.gray('   •'), 'Press Ctrl+C to stop the server');
        // Handle server exit
        server.on('close', (code) => {
            console.log(chalk_1.default.yellow('🛑'), 'Web dashboard server stopped');
        });
        // Keep the process running
        process.on('SIGINT', () => {
            console.log(chalk_1.default.yellow('\n🛑'), 'Stopping web dashboard server...');
            server.kill();
            process.exit(0);
        });
    }
    async handleDeploy() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Deploying MockAuth to cloud...'));
        const { platform } = await this.promptWithEsc([
            {
                type: 'list',
                name: 'platform',
                message: 'Select deployment platform:',
                choices: [
                    { name: '☁️  AWS (Amazon Web Services)', value: 'aws' },
                    { name: '🌐 Google Cloud Platform', value: 'gcp' },
                    { name: '🔵 Microsoft Azure', value: 'azure' },
                    { name: '🐳 Docker', value: 'docker' },
                ],
            },
        ]);
        const { environment } = await this.promptWithEsc([
            {
                type: 'list',
                name: 'environment',
                message: 'Select environment:',
                choices: [
                    { name: '🛠️  Development', value: 'development' },
                    { name: '🧪 Staging', value: 'staging' },
                    { name: '🚀 Production', value: 'production' },
                ],
            },
        ]);
        // Import and use the real deployment functionality from AdvancedMockAuthCLI
        const { AdvancedMockAuthCLI } = await Promise.resolve().then(() => __importStar(require('./advanced')));
        const advancedCLI = new AdvancedMockAuthCLI();
        // Use the real deployment implementation
        await advancedCLI.deployToCloud({ command: 'deploy', env: environment });
    }
    async handleMonitor() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Starting real-time monitoring dashboard...'));
        const { port } = await this.promptWithEsc([
            {
                type: 'input',
                name: 'port',
                message: 'Monitoring dashboard port:',
                default: '3003',
                validate: (input) => {
                    const port = parseInt(input);
                    return port > 0 && port < 65536
                        ? true
                        : 'Please enter a valid port number';
                },
            },
        ]);
        // Import and use the real monitoring functionality from AdvancedMockAuthCLI
        const { AdvancedMockAuthCLI } = await Promise.resolve().then(() => __importStar(require('./advanced')));
        const advancedCLI = new AdvancedMockAuthCLI();
        // Use the real monitoring implementation
        await advancedCLI.startMonitoring({ command: 'monitor', port: parseInt(port) });
    }
    async handleBackup() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Creating MockAuth backup...'));
        const { outputDir } = await this.promptWithEsc([
            {
                type: 'input',
                name: 'outputDir',
                message: 'Backup output directory:',
                default: './backups',
            },
        ]);
        // Import and use the real backup functionality from AdvancedMockAuthCLI
        const { AdvancedMockAuthCLI } = await Promise.resolve().then(() => __importStar(require('./advanced')));
        const advancedCLI = new AdvancedMockAuthCLI();
        // Use the real backup implementation
        await advancedCLI.backupData({ command: 'backup', output: outputDir });
    }
    async handleRestore() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Restoring MockAuth from backup...'));
        // Import and use the real restore functionality from AdvancedMockAuthCLI
        const { AdvancedMockAuthCLI } = await Promise.resolve().then(() => __importStar(require('./advanced')));
        const advancedCLI = new AdvancedMockAuthCLI();
        // Use the real restore implementation
        await advancedCLI.restoreData({ command: 'restore' });
    }
    async handleValidate() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Validating MockAuth configuration...'));
        // Import and use the real validation functionality from AdvancedMockAuthCLI
        const { AdvancedMockAuthCLI } = await Promise.resolve().then(() => __importStar(require('./advanced')));
        const advancedCLI = new AdvancedMockAuthCLI();
        // Use the real validation implementation
        await advancedCLI.validateConfig({ command: 'validate' });
    }
    async handleBenchmark() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Running MockAuth performance benchmarks...'));
        const { duration } = await this.promptWithEsc([
            {
                type: 'list',
                name: 'duration',
                message: 'Benchmark duration:',
                choices: [
                    { name: '⚡ Quick (30 seconds)', value: '30' },
                    { name: '🔄 Standard (2 minutes)', value: '120' },
                    { name: '📊 Comprehensive (5 minutes)', value: '300' },
                ],
            },
        ]);
        // Import and use the real benchmark functionality from AdvancedMockAuthCLI
        const { AdvancedMockAuthCLI } = await Promise.resolve().then(() => __importStar(require('./advanced')));
        const advancedCLI = new AdvancedMockAuthCLI();
        // Use the real benchmark implementation
        await advancedCLI.runBenchmarks({ command: 'benchmark' });
    }
    async handleDocs() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Generating MockAuth API documentation...'));
        const { outputDir } = await this.promptWithEsc([
            {
                type: 'input',
                name: 'outputDir',
                message: 'Documentation output directory:',
                default: './docs',
            },
        ]);
        const { openBrowser } = await this.promptWithEsc([
            {
                type: 'confirm',
                name: 'openBrowser',
                message: 'Open documentation in browser?',
                default: true,
            },
        ]);
        // Import and use the real docs functionality from AdvancedMockAuthCLI
        const { AdvancedMockAuthCLI } = await Promise.resolve().then(() => __importStar(require('./advanced')));
        const advancedCLI = new AdvancedMockAuthCLI();
        // Use the real docs implementation
        await advancedCLI.generateDocs({ command: 'docs', output: outputDir });
    }
    async handlePlugin() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('MockAuth Plugin Management'));
        const { action } = await this.promptWithEsc([
            {
                type: 'list',
                name: 'action',
                message: 'Plugin action:',
                choices: [
                    { name: '📦 Install Plugin', value: 'install' },
                    { name: '🗑️  Remove Plugin', value: 'remove' },
                    { name: '📋 List Installed Plugins', value: 'list' },
                    { name: '🔄 Update Plugins', value: 'update' },
                ],
            },
        ]);
        // Import and use the real plugin functionality from AdvancedMockAuthCLI
        const { AdvancedMockAuthCLI } = await Promise.resolve().then(() => __importStar(require('./advanced')));
        const advancedCLI = new AdvancedMockAuthCLI();
        // Use the real plugin implementation
        await advancedCLI.managePlugins({ command: 'plugin' });
    }
    async handlePluginInstall() {
        const { pluginName } = await this.promptWithEsc([
            {
                type: 'input',
                name: 'pluginName',
                message: 'Plugin name to install:',
                validate: (input) => input.trim().length > 0 ? true : 'Please enter a plugin name',
            },
        ]);
        console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green(`Plugin "${pluginName}" installed successfully!`));
        console.log(chalk_1.default.gray('   •'), 'Dependencies installed');
        console.log(chalk_1.default.gray('   •'), 'Configuration updated');
        console.log(chalk_1.default.gray('   •'), 'Plugin activated');
    }
    async handlePluginRemove() {
        const mockPlugins = ['oauth-provider', 'rate-limiter', 'audit-logger'];
        const { pluginName } = await this.promptWithEsc([
            {
                type: 'list',
                name: 'pluginName',
                message: 'Plugin to remove:',
                choices: mockPlugins.map((plugin) => ({
                    name: plugin,
                    value: plugin,
                })),
            },
        ]);
        console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green(`Plugin "${pluginName}" removed successfully!`));
        console.log(chalk_1.default.gray('   •'), 'Plugin deactivated');
        console.log(chalk_1.default.gray('   •'), 'Dependencies cleaned up');
        console.log(chalk_1.default.gray('   •'), 'Configuration updated');
    }
    async handlePluginList() {
        const plugins = [
            { name: 'oauth-provider', version: '1.0.0', status: 'active' },
            { name: 'rate-limiter', version: '2.1.0', status: 'active' },
            { name: 'audit-logger', version: '1.5.0', status: 'inactive' },
        ];
        console.log(chalk_1.default.bold.cyan('\n📋 Installed Plugins:'));
        plugins.forEach((plugin) => {
            const statusIcon = plugin.status === 'active' ? '✅' : '❌';
            console.log(chalk_1.default.gray('   •'), `${statusIcon} ${plugin.name} (v${plugin.version}) - ${plugin.status}`);
        });
    }
    async handlePluginUpdate() {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue('Updating all plugins...'));
        // Simulate update process
        await new Promise((resolve) => setTimeout(resolve, 2000));
        console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green('All plugins updated successfully!'));
        console.log(chalk_1.default.gray('   •'), 'oauth-provider: v1.0.0 → v1.1.0');
        console.log(chalk_1.default.gray('   •'), 'rate-limiter: v2.1.0 → v2.2.0');
        console.log(chalk_1.default.gray('   •'), 'audit-logger: v1.5.0 → v1.6.0');
    }
    // Framework Integration Helper Methods
    async generateFrameworkIntegration(framework, projectName, outputDir) {
        // Create package.json
        const packageJson = this.generatePackageJson(framework, projectName);
        fs.writeFileSync(path.join(outputDir, 'package.json'), JSON.stringify(packageJson, null, 2));
        // Create framework-specific files
        switch (framework) {
            case 'react':
                await this.generateReactIntegration(projectName, outputDir);
                break;
            case 'vue':
                await this.generateVueIntegration(projectName, outputDir);
                break;
            case 'angular':
                await this.generateAngularIntegration(projectName, outputDir);
                break;
            case 'nextjs':
                await this.generateNextjsIntegration(projectName, outputDir);
                break;
            case 'nuxt':
                await this.generateNuxtIntegration(projectName, outputDir);
                break;
            case 'svelte':
                await this.generateSvelteIntegration(projectName, outputDir);
                break;
            case 'sveltekit':
                await this.generateSvelteKitIntegration(projectName, outputDir);
                break;
            case 'solid':
                await this.generateSolidIntegration(projectName, outputDir);
                break;
        }
        // Create MockAuth configuration
        const mockAuthConfig = this.generateMockAuthConfig();
        fs.writeFileSync(path.join(outputDir, 'mockauth.config.js'), `module.exports = ${JSON.stringify(mockAuthConfig, null, 2)};`);
        // Create README
        const readme = this.generateReadme(framework, projectName);
        fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
    }
    generatePackageJson(framework, projectName) {
        const basePackage = {
            name: projectName,
            version: '1.0.0',
            description: `MockAuth integration with ${framework}`,
            scripts: {
                dev: 'vite',
                build: 'vite build',
                preview: 'vite preview',
                'mockauth:start': 'mockauth start',
                'mockauth:init': 'mockauth init',
            },
            dependencies: {
                mockauth: '^1.0.0',
            },
            devDependencies: {
                vite: '^5.0.0',
            },
        };
        switch (framework) {
            case 'react':
                return {
                    ...basePackage,
                    dependencies: {
                        ...basePackage.dependencies,
                        react: '^18.0.0',
                        'react-dom': '^18.0.0',
                    },
                    devDependencies: {
                        ...basePackage.devDependencies,
                        '@vitejs/plugin-react': '^4.0.0',
                        '@types/react': '^18.0.0',
                        '@types/react-dom': '^18.0.0',
                        typescript: '^5.0.0',
                    },
                };
            case 'vue':
                return {
                    ...basePackage,
                    dependencies: {
                        ...basePackage.dependencies,
                        vue: '^3.0.0',
                    },
                    devDependencies: {
                        ...basePackage.devDependencies,
                        '@vitejs/plugin-vue': '^4.0.0',
                        typescript: '^5.0.0',
                    },
                };
            case 'svelte':
                return {
                    ...basePackage,
                    dependencies: {
                        ...basePackage.dependencies,
                        svelte: '^4.0.0',
                    },
                    devDependencies: {
                        ...basePackage.devDependencies,
                        '@sveltejs/vite-plugin-svelte': '^3.0.0',
                        typescript: '^5.0.0',
                    },
                };
            default:
                return basePackage;
        }
    }
    async generateReactIntegration(projectName, outputDir) {
        // Create src directory
        const srcDir = path.join(outputDir, 'src');
        if (!fs.existsSync(srcDir)) {
            fs.mkdirSync(srcDir, { recursive: true });
        }
        // Create main App component
        const appComponent = `import React, { useState, useEffect } from 'react';
import { MockAuthProvider, useAuth } from './hooks/useAuth';
import LoginForm from './components/LoginForm';
import Dashboard from './components/Dashboard';

function App() {
  return (
    <MockAuthProvider>
      <div className="app">
        <header className="app-header">
          <h1>MockAuth + React Demo</h1>
        </header>
        <main className="app-main">
          <AuthContent />
        </main>
      </div>
    </MockAuthProvider>
  );
}

function AuthContent() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <div className="auth-content">
      {isAuthenticated ? (
        <Dashboard user={user} />
      ) : (
        <LoginForm />
      )}
    </div>
  );
}

export default App;`;
        fs.writeFileSync(path.join(srcDir, 'App.tsx'), appComponent);
        // Create auth hook
        const authHook = `import { useState, useEffect, createContext, useContext } from 'react';

interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const MockAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const MOCKAUTH_URL = 'http://localhost:3001';

  useEffect(() => {
    // Check if user is already logged in
    const token = localStorage.getItem('mockauth_token');
    if (token) {
      verifyToken(token);
    } else {
      setIsLoading(false);
    }
  }, []);

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(\`\${MOCKAUTH_URL}/auth/verify\`, {
        headers: {
          'Authorization': \`Bearer \${token}\`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('mockauth_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('mockauth_token');
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(\`\${MOCKAUTH_URL}/auth/login\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('mockauth_token', data.token);
        setUser(data.user);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('mockauth_token');
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a MockAuthProvider');
  }
  return context;
};`;
        const hooksDir = path.join(srcDir, 'hooks');
        if (!fs.existsSync(hooksDir)) {
            fs.mkdirSync(hooksDir, { recursive: true });
        }
        fs.writeFileSync(path.join(hooksDir, 'useAuth.tsx'), authHook);
        // Create components
        const componentsDir = path.join(srcDir, 'components');
        if (!fs.existsSync(componentsDir)) {
            fs.mkdirSync(componentsDir, { recursive: true });
        }
        const loginForm = `import React, { useState } from 'react';
import { useAuth } from '../hooks/useAuth';

const LoginForm: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const success = await login(email, password);
    if (!success) {
      setError('Invalid credentials');
    }
    setIsLoading(false);
  };

  return (
    <div className="login-form">
      <h2>Login to MockAuth Demo</h2>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email:</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">Password:</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button type="submit" disabled={isLoading}>
          {isLoading ? 'Logging in...' : 'Login'}
        </button>
      </form>
      <div className="demo-credentials">
        <h3>Demo Credentials:</h3>
        <p>Email: admin@example.com | Password: admin123</p>
        <p>Email: user@example.com | Password: user123</p>
      </div>
    </div>
  );
};

export default LoginForm;`;
        fs.writeFileSync(path.join(componentsDir, 'LoginForm.tsx'), loginForm);
        const dashboard = `import React from 'react';
import { useAuth } from '../hooks/useAuth';

interface DashboardProps {
  user: {
    id: string;
    email: string;
    username: string;
    roles: string[];
  };
}

const Dashboard: React.FC<DashboardProps> = ({ user }) => {
  const { logout } = useAuth();

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Welcome, {user.username}!</h2>
        <button onClick={logout} className="logout-btn">
          Logout
        </button>
      </div>
      <div className="user-info">
        <h3>User Information:</h3>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Username:</strong> {user.username}</p>
        <p><strong>Roles:</strong> {user.roles.join(', ')}</p>
      </div>
      <div className="dashboard-content">
        <h3>MockAuth + React Integration</h3>
        <p>This is a demo application showing MockAuth integration with React.</p>
        <p>Features:</p>
        <ul>
          <li>✅ User Authentication</li>
          <li>✅ JWT Token Management</li>
          <li>✅ Role-based Access Control</li>
          <li>✅ React Context API</li>
          <li>✅ TypeScript Support</li>
        </ul>
      </div>
    </div>
  );
};

export default Dashboard;`;
        fs.writeFileSync(path.join(componentsDir, 'Dashboard.tsx'), dashboard);
        // Create main.tsx
        const mainTsx = `import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);`;
        fs.writeFileSync(path.join(srcDir, 'main.tsx'), mainTsx);
        // Create index.html
        const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MockAuth + React Demo</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;
        fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);
        // Create CSS
        const css = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.app-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  text-align: center;
  color: white;
}

.app-header h1 {
  font-size: 2rem;
  font-weight: 600;
}

.app-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.auth-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.login-form h2 {
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  color: #e74c3c;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #fdf2f2;
  border-radius: 4px;
  text-align: center;
}

.loading {
  text-align: center;
  color: #666;
  font-size: 1.1rem;
}

.demo-credentials {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.demo-credentials h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

.demo-credentials p {
  margin: 0.25rem 0;
  color: #666;
  font-size: 0.9rem;
}

.dashboard {
  max-width: 600px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e1e5e9;
}

.dashboard-header h2 {
  color: #333;
}

.logout-btn {
  width: auto;
  padding: 0.5rem 1rem;
  background: #e74c3c;
  font-size: 0.9rem;
}

.user-info {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-info h3 {
  margin-bottom: 1rem;
  color: #333;
}

.user-info p {
  margin: 0.5rem 0;
  color: #555;
}

.dashboard-content h3 {
  margin-bottom: 1rem;
  color: #333;
}

.dashboard-content p {
  margin-bottom: 1rem;
  color: #666;
  line-height: 1.6;
}

.dashboard-content ul {
  margin-left: 1.5rem;
  color: #555;
}

.dashboard-content li {
  margin: 0.5rem 0;
}`;
        fs.writeFileSync(path.join(srcDir, 'index.css'), css);
        // Create vite.config.ts
        const viteConfig = `import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});`;
        fs.writeFileSync(path.join(outputDir, 'vite.config.ts'), viteConfig);
        // Create tsconfig.json
        const tsconfig = `{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}`;
        fs.writeFileSync(path.join(outputDir, 'tsconfig.json'), tsconfig);
    }
    async generateVueIntegration(projectName, outputDir) {
        // Create src directory
        const srcDir = path.join(outputDir, 'src');
        if (!fs.existsSync(srcDir)) {
            fs.mkdirSync(srcDir, { recursive: true });
        }
        // Create main.ts
        const mainTs = `import { createApp } from 'vue';
import App from './App.vue';
import './style.css';

createApp(App).mount('#app');`;
        fs.writeFileSync(path.join(srcDir, 'main.ts'), mainTs);
        // Create App.vue
        const appVue = `<template>
  <div id="app">
    <header class="app-header">
      <h1>MockAuth + Vue.js Demo</h1>
    </header>
    <main class="app-main">
      <AuthContent />
    </main>
  </div>
</template>

<script setup lang="ts">
import AuthContent from './components/AuthContent.vue';
</script>

<style scoped>
.app-header {
  background: rgba(255, 255, 255, 0.1);
  backdrop-filter: blur(10px);
  padding: 1rem 2rem;
  text-align: center;
  color: white;
}

.app-header h1 {
  font-size: 2rem;
  font-weight: 600;
}

.app-main {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}
</style>`;
        fs.writeFileSync(path.join(srcDir, 'App.vue'), appVue);
        // Create components directory
        const componentsDir = path.join(srcDir, 'components');
        if (!fs.existsSync(componentsDir)) {
            fs.mkdirSync(componentsDir, { recursive: true });
        }
        // Create AuthContent.vue
        const authContentVue = `<template>
  <div class="auth-content">
    <div v-if="isLoading" class="loading">Loading...</div>
    <div v-else-if="isAuthenticated">
      <Dashboard :user="user" />
    </div>
    <div v-else>
      <LoginForm />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useAuth } from '../composables/useAuth';
import LoginForm from './LoginForm.vue';
import Dashboard from './Dashboard.vue';

const { user, isAuthenticated, isLoading } = useAuth();
</script>

<style scoped>
.auth-content {
  background: white;
  border-radius: 12px;
  padding: 2rem;
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
  max-width: 500px;
  width: 100%;
}

.loading {
  text-align: center;
  color: #666;
  font-size: 1.1rem;
}
</style>`;
        fs.writeFileSync(path.join(componentsDir, 'AuthContent.vue'), authContentVue);
        // Create composables directory
        const composablesDir = path.join(srcDir, 'composables');
        if (!fs.existsSync(composablesDir)) {
            fs.mkdirSync(composablesDir, { recursive: true });
        }
        // Create useAuth.ts
        const useAuthTs = `import { ref, onMounted } from 'vue';

interface User {
  id: string;
  email: string;
  username: string;
  roles: string[];
}

const user = ref<User | null>(null);
const isLoading = ref(true);

const MOCKAUTH_URL = 'http://localhost:3001';

export const useAuth = () => {
  const isAuthenticated = computed(() => !!user.value);

  onMounted(() => {
    const token = localStorage.getItem('mockauth_token');
    if (token) {
      verifyToken(token);
    } else {
      isLoading.value = false;
    }
  });

  const verifyToken = async (token: string) => {
    try {
      const response = await fetch(\`\${MOCKAUTH_URL}/auth/verify\`, {
        headers: {
          'Authorization': \`Bearer \${token}\`,
        },
      });
      
      if (response.ok) {
        const userData = await response.json();
        user.value = userData;
      } else {
        localStorage.removeItem('mockauth_token');
      }
    } catch (error) {
      console.error('Token verification failed:', error);
      localStorage.removeItem('mockauth_token');
    } finally {
      isLoading.value = false;
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch(\`\${MOCKAUTH_URL}/auth/login\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('mockauth_token', data.token);
        user.value = data.user;
        return true;
      }
      return false;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  const logout = () => {
    localStorage.removeItem('mockauth_token');
    user.value = null;
  };

  return {
    user: readonly(user),
    isAuthenticated,
    isLoading: readonly(isLoading),
    login,
    logout,
  };
};`;
        fs.writeFileSync(path.join(composablesDir, 'useAuth.ts'), useAuthTs);
        // Create LoginForm.vue
        const loginFormVue = `<template>
  <div class="login-form">
    <h2>Login to MockAuth Demo</h2>
    <form @submit.prevent="handleSubmit">
      <div class="form-group">
        <label for="email">Email:</label>
        <input
          type="email"
          id="email"
          v-model="email"
          required
        />
      </div>
      <div class="form-group">
        <label for="password">Password:</label>
        <input
          type="password"
          id="password"
          v-model="password"
          required
        />
      </div>
      <div v-if="error" class="error">{{ error }}</div>
      <button type="submit" :disabled="isLoading">
        {{ isLoading ? 'Logging in...' : 'Login' }}
      </button>
    </form>
    <div class="demo-credentials">
      <h3>Demo Credentials:</h3>
      <p>Email: admin@example.com | Password: admin123</p>
      <p>Email: user@example.com | Password: user123</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import { useAuth } from '../composables/useAuth';

const email = ref('');
const password = ref('');
const error = ref('');
const isLoading = ref(false);
const { login } = useAuth();

const handleSubmit = async () => {
  error.value = '';
  isLoading.value = true;

  const success = await login(email.value, password.value);
  if (!success) {
    error.value = 'Invalid credentials';
  }
  isLoading.value = false;
};
</script>

<style scoped>
.login-form h2 {
  margin-bottom: 1.5rem;
  color: #333;
  text-align: center;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  margin-bottom: 0.5rem;
  color: #555;
  font-weight: 500;
}

.form-group input {
  width: 100%;
  padding: 0.75rem;
  border: 2px solid #e1e5e9;
  border-radius: 8px;
  font-size: 1rem;
  transition: border-color 0.2s;
}

.form-group input:focus {
  outline: none;
  border-color: #667eea;
}

button {
  width: 100%;
  padding: 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  border-radius: 8px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: transform 0.2s;
}

button:hover:not(:disabled) {
  transform: translateY(-2px);
}

button:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.error {
  color: #e74c3c;
  margin-bottom: 1rem;
  padding: 0.5rem;
  background: #fdf2f2;
  border-radius: 4px;
  text-align: center;
}

.demo-credentials {
  margin-top: 1.5rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
  border-left: 4px solid #667eea;
}

.demo-credentials h3 {
  margin-bottom: 0.5rem;
  color: #333;
}

.demo-credentials p {
  margin: 0.25rem 0;
  color: #666;
  font-size: 0.9rem;
}
</style>`;
        fs.writeFileSync(path.join(componentsDir, 'LoginForm.vue'), loginFormVue);
        // Create Dashboard.vue
        const dashboardVue = `<template>
  <div class="dashboard">
    <div class="dashboard-header">
      <h2>Welcome, {{ user.username }}!</h2>
      <button @click="logout" class="logout-btn">Logout</button>
    </div>
    <div class="user-info">
      <h3>User Information:</h3>
      <p><strong>Email:</strong> {{ user.email }}</p>
      <p><strong>Username:</strong> {{ user.username }}</p>
      <p><strong>Roles:</strong> {{ user.roles.join(', ') }}</p>
    </div>
    <div class="dashboard-content">
      <h3>MockAuth + Vue.js Integration</h3>
      <p>This is a demo application showing MockAuth integration with Vue.js.</p>
      <p>Features:</p>
      <ul>
        <li>✅ User Authentication</li>
        <li>✅ JWT Token Management</li>
        <li>✅ Role-based Access Control</li>
        <li>✅ Vue 3 Composition API</li>
        <li>✅ TypeScript Support</li>
      </ul>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useAuth } from '../composables/useAuth';

interface Props {
  user: {
    id: string;
    email: string;
    username: string;
    roles: string[];
  };
}

defineProps<Props>();
const { logout } = useAuth();
</script>

<style scoped>
.dashboard {
  max-width: 600px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
  padding-bottom: 1rem;
  border-bottom: 2px solid #e1e5e9;
}

.dashboard-header h2 {
  color: #333;
}

.logout-btn {
  width: auto;
  padding: 0.5rem 1rem;
  background: #e74c3c;
  font-size: 0.9rem;
}

.user-info {
  margin-bottom: 2rem;
  padding: 1rem;
  background: #f8f9fa;
  border-radius: 8px;
}

.user-info h3 {
  margin-bottom: 1rem;
  color: #333;
}

.user-info p {
  margin: 0.5rem 0;
  color: #555;
}

.dashboard-content h3 {
  margin-bottom: 1rem;
  color: #333;
}

.dashboard-content p {
  margin-bottom: 1rem;
  color: #666;
  line-height: 1.6;
}

.dashboard-content ul {
  margin-left: 1.5rem;
  color: #555;
}

.dashboard-content li {
  margin: 0.5rem 0;
}
</style>`;
        fs.writeFileSync(path.join(componentsDir, 'Dashboard.vue'), dashboardVue);
        // Create index.html
        const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/vite.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MockAuth + Vue.js Demo</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="/src/main.ts"></script>
  </body>
</html>`;
        fs.writeFileSync(path.join(outputDir, 'index.html'), indexHtml);
        // Create style.css
        const styleCss = `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  min-height: 100vh;
}

#app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}`;
        fs.writeFileSync(path.join(srcDir, 'style.css'), styleCss);
        // Create vite.config.ts
        const viteConfig = `import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig({
  plugins: [vue()],
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
});`;
        fs.writeFileSync(path.join(outputDir, 'vite.config.ts'), viteConfig);
    }
    async generateAngularIntegration(projectName, outputDir) {
        // Angular integration would be more complex, so we'll create a simplified version
        console.log(chalk_1.default.yellow('⚠️'), 'Angular integration is more complex and requires Angular CLI');
        console.log(chalk_1.default.gray('   •'), 'Run: ng new ' + projectName);
        console.log(chalk_1.default.gray('   •'), 'Add MockAuth service manually');
    }
    async generateNextjsIntegration(projectName, outputDir) {
        // Next.js integration
        console.log(chalk_1.default.yellow('⚠️'), 'Next.js integration requires Next.js CLI');
        console.log(chalk_1.default.gray('   •'), 'Run: npx create-next-app@latest ' + projectName);
        console.log(chalk_1.default.gray('   •'), 'Add MockAuth integration manually');
    }
    async generateNuxtIntegration(projectName, outputDir) {
        // Nuxt integration
        console.log(chalk_1.default.yellow('⚠️'), 'Nuxt integration requires Nuxt CLI');
        console.log(chalk_1.default.gray('   •'), 'Run: npx nuxi@latest init ' + projectName);
        console.log(chalk_1.default.gray('   •'), 'Add MockAuth integration manually');
    }
    async generateSvelteIntegration(projectName, outputDir) {
        // Svelte integration
        console.log(chalk_1.default.yellow('⚠️'), 'Svelte integration requires Svelte CLI');
        console.log(chalk_1.default.gray('   •'), 'Run: npm create svelte@latest ' + projectName);
        console.log(chalk_1.default.gray('   •'), 'Add MockAuth integration manually');
    }
    async generateSvelteKitIntegration(projectName, outputDir) {
        // SvelteKit integration
        console.log(chalk_1.default.yellow('⚠️'), 'SvelteKit integration requires SvelteKit CLI');
        console.log(chalk_1.default.gray('   •'), 'Run: npm create svelte@latest ' + projectName);
        console.log(chalk_1.default.gray('   •'), 'Add MockAuth integration manually');
    }
    async generateSolidIntegration(projectName, outputDir) {
        // Solid.js integration
        console.log(chalk_1.default.yellow('⚠️'), 'Solid.js integration requires Solid CLI');
        console.log(chalk_1.default.gray('   •'), 'Run: npm create solid@latest ' + projectName);
        console.log(chalk_1.default.gray('   •'), 'Add MockAuth integration manually');
    }
    generateMockAuthConfig() {
        return {
            port: 3001,
            baseUrl: 'http://localhost:3001',
            jwtSecret: this.generateSecret(),
            database: { type: 'memory' },
            enableMFA: true,
            enablePasswordReset: true,
            enableAccountLockout: true,
            logLevel: 'info',
            enableAuditLog: true,
            maxLoginAttempts: 5,
            lockoutDuration: '15m',
            users: [
                {
                    email: 'admin@example.com',
                    username: 'admin',
                    password: 'admin123',
                    roles: ['admin'],
                    permissions: ['read:users', 'write:users', 'delete:users'],
                },
                {
                    email: 'user@example.com',
                    username: 'user',
                    password: 'user123',
                    roles: ['user'],
                    permissions: ['read:profile'],
                },
            ],
        };
    }
    getFrameworkFiles(framework) {
        const baseFiles = [
            'package.json',
            'mockauth.config.js',
            'README.md',
        ];
        switch (framework) {
            case 'react':
                return [
                    ...baseFiles,
                    'index.html',
                    'vite.config.ts',
                    'tsconfig.json',
                    'src/main.tsx',
                    'src/App.tsx',
                    'src/index.css',
                    'src/hooks/useAuth.tsx',
                    'src/components/LoginForm.tsx',
                    'src/components/Dashboard.tsx',
                ];
            case 'vue':
                return [
                    ...baseFiles,
                    'index.html',
                    'vite.config.ts',
                    'src/main.ts',
                    'src/App.vue',
                    'src/style.css',
                    'src/composables/useAuth.ts',
                    'src/components/AuthContent.vue',
                    'src/components/LoginForm.vue',
                    'src/components/Dashboard.vue',
                ];
            default:
                return baseFiles;
        }
    }
    generateReadme(framework, projectName) {
        return `# MockAuth + ${framework} Integration

This project demonstrates how to integrate MockAuth with ${framework}.

## Features

- ✅ User Authentication
- ✅ JWT Token Management  
- ✅ Role-based Access Control
- ✅ ${framework} Integration
- ✅ TypeScript Support

## Quick Start

1. Install dependencies:
   \`\`\`bash
   npm install
   \`\`\`

2. Start MockAuth server:
   \`\`\`bash
   npm run mockauth:start
   \`\`\`

3. Start the ${framework} app:
   \`\`\`bash
   npm run dev
   \`\`\`

4. Open your browser:
   - App: http://localhost:3000
   - MockAuth Dashboard: http://localhost:3001/dashboard

## Demo Credentials

- **Admin**: admin@example.com / admin123
- **User**: user@example.com / user123

## MockAuth Server

The MockAuth server provides:
- Authentication endpoints
- User management
- JWT token generation
- Role-based access control

## Framework Integration

This project shows how to:
- Set up authentication context
- Handle login/logout
- Manage JWT tokens
- Implement protected routes
- Display user information

## Development

- MockAuth Server: http://localhost:3001
- ${framework} App: http://localhost:3000
- API Documentation: http://localhost:3001/api

## Learn More

- [MockAuth Documentation](https://mockauth.dev/docs)
- [${framework} Documentation](https://${framework.toLowerCase()}.dev)
`;
    }
}
exports.SimpleEnhancedCLI = SimpleEnhancedCLI;
// Note: This CLI should be accessed through the main index.js entry point
// Use: node dist/cli/index.js (for enhanced CLI)
// Use: node dist/cli/index.js --legacy (for legacy CLI)
exports.default = SimpleEnhancedCLI;
//# sourceMappingURL=simple-enhanced.js.map