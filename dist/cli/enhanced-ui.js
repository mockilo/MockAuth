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
exports.EnhancedCLI = void 0;
// Enhanced CLI UI/UX Module
const chalk_1 = __importDefault(require("chalk"));
const ora_1 = __importDefault(require("ora"));
const inquirer_1 = __importDefault(require("inquirer"));
const boxen_1 = __importDefault(require("boxen"));
const gradient_string_1 = __importDefault(require("gradient-string"));
const figlet_1 = __importDefault(require("figlet"));
const cli_progress_1 = __importDefault(require("cli-progress"));
const readline = __importStar(require("readline"));
class EnhancedCLI {
    constructor() {
        this.rl = null;
    }
    static getInstance() {
        if (!EnhancedCLI.instance) {
            EnhancedCLI.instance = new EnhancedCLI();
        }
        return EnhancedCLI.instance;
    }
    // Set up ESC key handler
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
    // Clean up readline interface
    close() {
        if (this.rl) {
            this.rl.close();
        }
    }
    // 🎨 Welcome Screen
    showWelcome() {
        console.clear();
        // ASCII Art with gradient
        const title = figlet_1.default.textSync('MockAuth', {
            font: 'ANSI Shadow',
            horizontalLayout: 'fitted',
            verticalLayout: 'fitted',
        });
        console.log(gradient_string_1.default.rainbow.multiline(title));
        // Subtitle with box
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
    // 🎯 Main Menu
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
                name: '❓ Help & Documentation',
                value: 'help',
                description: 'View help and examples',
            },
        ];
        const { action } = await this.promptWithEsc([
            {
                type: 'list',
                name: 'action',
                message: chalk_1.default.bold.cyan('What would you like to do?'),
                choices,
                pageSize: 10,
            },
        ]);
        return action;
    }
    // 🎨 Migration Provider Selection
    async selectMigrationProvider() {
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
        return provider;
    }
    // 🎯 Interactive Configuration
    async createInteractiveConfig() {
        console.log(chalk_1.default.bold.cyan('\n📝 Project Configuration\n'));
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
        // Create users if requested
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
            const userAnswers = await this.promptWithEsc(userQuestions);
            answers.userCount = userAnswers.userCount;
        }
        return answers;
    }
    // 🎨 Progress Bar
    createProgressBar(label) {
        return new cli_progress_1.default.SingleBar({
            format: `${chalk_1.default.cyan('{bar}')} | {percentage}% | {value}/{total} | ${chalk_1.default.green('{label}')}`,
            barCompleteChar: '█',
            barIncompleteChar: '░',
            hideCursor: true,
        }, cli_progress_1.default.Presets.shades_classic);
    }
    // 🎯 Spinner with custom messages
    createSpinner(text) {
        return (0, ora_1.default)({
            text: chalk_1.default.cyan(text),
            spinner: 'dots',
            color: 'cyan',
        });
    }
    // 🎨 Success Message
    showSuccess(message, details) {
        console.log(chalk_1.default.green('✅'), chalk_1.default.bold.green(message));
        if (details) {
            details.forEach((detail) => {
                console.log(chalk_1.default.gray('   •'), detail);
            });
        }
    }
    // 🎨 Error Message
    showError(message, suggestions) {
        console.log(chalk_1.default.red('❌'), chalk_1.default.bold.red(message));
        if (suggestions) {
            console.log(chalk_1.default.yellow('\n💡 Suggestions:'));
            suggestions.forEach((suggestion) => {
                console.log(chalk_1.default.gray('   •'), suggestion);
            });
        }
    }
    // 🎨 Warning Message
    showWarning(message) {
        console.log(chalk_1.default.yellow('⚠️'), chalk_1.default.bold.yellow(message));
    }
    // 🎨 Info Message
    showInfo(message) {
        console.log(chalk_1.default.blue('ℹ️'), chalk_1.default.bold.blue(message));
    }
    // 🎨 Migration Success
    showMigrationSuccess(provider, files) {
        const title = (0, boxen_1.default)(chalk_1.default.bold.green('🎉 Migration Generated Successfully!') +
            '\n\n' +
            chalk_1.default.cyan(`Provider: ${provider}`) +
            '\n' +
            chalk_1.default.gray(`Files: ${files.length}`), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green',
            backgroundColor: '#1a1a1a',
        });
        console.log(title);
        console.log(chalk_1.default.bold.cyan('\n📁 Generated Files:'));
        files.forEach((file) => {
            console.log(chalk_1.default.gray('   •'), chalk_1.default.green(file));
        });
        console.log(chalk_1.default.bold.cyan('\n📚 Next Steps:'));
        console.log(chalk_1.default.gray('   1.'), 'Review the generated files');
        console.log(chalk_1.default.gray('   2.'), 'Install dependencies: npm install');
        console.log(chalk_1.default.gray('   3.'), 'Configure environment variables');
        console.log(chalk_1.default.gray('   4.'), 'Test the migration');
        console.log(chalk_1.default.gray('   5.'), 'Deploy to production');
    }
    // 🎨 Health Check Results
    showHealthResults(results) {
        const status = results.overall ? '✅ Healthy' : '❌ Issues Detected';
        const color = results.overall ? 'green' : 'red';
        const title = (0, boxen_1.default)(chalk_1.default.bold[color](`🏥 Health Check Results: ${status}`), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: color,
            backgroundColor: '#1a1a1a',
        });
        console.log(title);
        console.log(chalk_1.default.bold.cyan('\n📊 System Status:'));
        console.log(chalk_1.default.gray('   Server:'), results.server ? chalk_1.default.green('✅ Running') : chalk_1.default.red('❌ Failed'));
        console.log(chalk_1.default.gray('   Database:'), results.database ? chalk_1.default.green('✅ Connected') : chalk_1.default.red('❌ Failed'));
        console.log(chalk_1.default.gray('   Memory:'), chalk_1.default.yellow(`${results.memory}MB (${results.memoryStatus})`));
        console.log(chalk_1.default.gray('   Response Time:'), chalk_1.default.yellow(`${results.responseTime}ms (${results.performanceStatus})`));
        console.log(chalk_1.default.gray('   Active Sessions:'), chalk_1.default.cyan(results.activeSessions));
        if (results.warnings.length > 0) {
            console.log(chalk_1.default.bold.yellow('\n⚠️ Warnings:'));
            results.warnings.forEach((warning) => {
                console.log(chalk_1.default.gray('   •'), warning);
            });
        }
        if (results.suggestions.length > 0) {
            console.log(chalk_1.default.bold.cyan('\n💡 Suggestions:'));
            results.suggestions.forEach((suggestion) => {
                console.log(chalk_1.default.gray('   •'), suggestion);
            });
        }
    }
    // 🎨 Server Start Animation
    async showServerStart(config) {
        const spinner = this.createSpinner('Starting MockAuth server...');
        spinner.start();
        // Simulate server startup
        await new Promise((resolve) => setTimeout(resolve, 2000));
        spinner.succeed('MockAuth server started successfully!');
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
    }
    // 🎨 Goodbye Message
    showGoodbye() {
        const goodbye = (0, boxen_1.default)(chalk_1.default.bold.cyan('👋 Thanks for using MockAuth!') +
            '\n' +
            chalk_1.default.gray('Made with ❤️ for developers'), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
            backgroundColor: '#1a1a1a',
        });
        console.log(goodbye);
    }
    // 🎨 Loading Animation
    async showLoading(text, duration = 2000) {
        const spinner = this.createSpinner(text);
        spinner.start();
        await new Promise((resolve) => setTimeout(resolve, duration));
        spinner.succeed(text.replace('...', ' completed!'));
    }
    // 🎨 Table Display
    showTable(headers, rows) {
        const table = (0, boxen_1.default)(this.formatTable(headers, rows), {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'cyan',
            backgroundColor: '#1a1a1a',
        });
        console.log(table);
    }
    formatTable(headers, rows) {
        const maxWidths = headers.map((_, i) => Math.max(headers[i].length, ...rows.map((row) => row[i]?.length || 0)));
        const formatRow = (row) => row.map((cell, i) => cell.padEnd(maxWidths[i])).join(' | ');
        const separator = maxWidths.map((width) => '-'.repeat(width)).join('-|-');
        return [formatRow(headers), separator, ...rows.map(formatRow)].join('\n');
    }
}
exports.EnhancedCLI = EnhancedCLI;
exports.default = EnhancedCLI;
//# sourceMappingURL=enhanced-ui.js.map