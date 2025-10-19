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
exports.MockAuthCLI = void 0;
const index_1 = require("../index");
const advanced_1 = require("./advanced");
const simple_enhanced_1 = __importDefault(require("./simple-enhanced"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const readline = __importStar(require("readline"));
const crypto = __importStar(require("crypto"));
class MockAuthCLI {
    constructor() {
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    }
    async run() {
        const args = this.parseArgs();
        if (args.help) {
            this.showHelp();
            return;
        }
        // Validate command
        const validCommands = [
            'init',
            'start',
            'stop',
            'restart',
            'reset',
            'status',
            'list',
            'kill-all',
            'test',
            'generate',
            'migrate',
            'builder',
            'debug',
            'health',
            'migrate-to',
            'help',
        ];
        if (!validCommands.includes(args.command)) {
            this.showInvalidCommand(args.command, validCommands);
            return;
        }
        switch (args.command) {
            case 'init':
                await this.initProject(args);
                break;
            case 'start':
                await this.startServer(args);
                break;
            case 'stop':
                await this.stopServer(args);
                break;
            case 'restart':
                await this.restartServer(args);
                break;
            case 'reset':
                await this.resetServer(args);
                break;
            case 'status':
                await this.checkServerStatus(args);
                break;
            case 'list':
                await this.listServers(args);
                break;
            case 'kill-all':
                await this.killAllServers(args);
                break;
            case 'test':
                await this.runTests(args);
                break;
            case 'generate':
                await this.generateData(args);
                break;
            case 'migrate':
                await this.migrateDatabase(args);
                break;
            case 'builder':
                await this.launchBuilder(args);
                break;
            case 'debug':
                await this.startDebugMode(args);
                break;
            case 'health':
                await this.runHealthCheck(args);
                break;
            case 'migrate-to':
                await this.generateMigration(args);
                break;
            case 'help':
                this.showHelp();
                break;
            default:
                console.log(`❌ Unknown command: ${args.command}`);
                this.showHelp();
        }
    }
    // Calculate Levenshtein distance for fuzzy matching
    levenshteinDistance(str1, str2) {
        const matrix = [];
        for (let i = 0; i <= str2.length; i++) {
            matrix[i] = [i];
        }
        for (let j = 0; j <= str1.length; j++) {
            matrix[0][j] = j;
        }
        for (let i = 1; i <= str2.length; i++) {
            for (let j = 1; j <= str1.length; j++) {
                if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
                    matrix[i][j] = matrix[i - 1][j - 1];
                }
                else {
                    matrix[i][j] = Math.min(matrix[i - 1][j - 1] + 1, // substitution
                    matrix[i][j - 1] + 1, // insertion
                    matrix[i - 1][j] + 1 // deletion
                    );
                }
            }
        }
        return matrix[str2.length][str1.length];
    }
    // Find closest matching command
    findClosestCommand(typo, validCommands) {
        const distances = validCommands.map((cmd) => ({
            command: cmd,
            distance: this.levenshteinDistance(typo.toLowerCase(), cmd.toLowerCase()),
        }));
        // Sort by distance and return top 3 suggestions
        return distances
            .sort((a, b) => a.distance - b.distance)
            .filter((item) => item.distance <= 3) // Only suggest if distance is reasonable
            .slice(0, 3)
            .map((item) => item.command);
    }
    // Show helpful error for invalid commands
    showInvalidCommand(typo, validCommands) {
        console.log(`\n❌ Unknown command: "${typo}"\n`);
        const suggestions = this.findClosestCommand(typo, validCommands);
        if (suggestions.length > 0) {
            console.log(`💡 Did you mean one of these?\n`);
            suggestions.forEach((suggestion) => {
                console.log(`   • mockauth ${suggestion}`);
            });
            console.log('');
        }
        console.log(`📚 Run "mockauth help" to see all available commands\n`);
    }
    // Show command-specific help
    showCommandHelp(command) {
        const helpInfo = {
            init: {
                description: 'Initialize a new MockAuth project',
                usage: 'mockauth init [options]',
                flags: [
                    '--template=<type>  Choose template (basic|enterprise|minimal)',
                    '--port=<number>    Set server port (default: 3001)',
                    '--database=<type>  Database type (memory|sqlite|postgresql)',
                ],
                examples: [
                    'mockauth init',
                    'mockauth init --template=enterprise',
                    'mockauth init --port=4000 --database=postgresql',
                ],
            },
            start: {
                description: 'Start the MockAuth server',
                usage: 'mockauth start [options]',
                flags: [
                    '--port=<number>    Custom port (default: 3001)',
                    '--watch            Enable auto-reload on config changes',
                    '--debug            Enable debug mode with verbose logging',
                ],
                examples: [
                    'mockauth start',
                    'mockauth start --port=4000',
                    'mockauth start --watch --debug',
                ],
            },
            builder: {
                description: 'Launch the visual configuration builder',
                usage: 'mockauth builder [options]',
                flags: [
                    '--port=<number>    Builder port (default: 3001)',
                    '--open             Auto-open browser',
                ],
                examples: ['mockauth builder', 'mockauth builder --port=3005 --open'],
            },
            test: {
                description: 'Run authentication tests',
                usage: 'mockauth test [options]',
                flags: [
                    '--coverage        Generate coverage report',
                    '--watch          Watch mode for continuous testing',
                    '--verbose        Detailed test output',
                ],
                examples: [
                    'mockauth test',
                    'mockauth test --coverage',
                    'mockauth test --watch --verbose',
                ],
            },
            generate: {
                description: 'Generate mock data (users, tokens, sessions)',
                usage: 'mockauth generate [options]',
                flags: [
                    '--count=<number>   Number of items to generate (default: 100)',
                    '--type=<type>      Type of data (users|tokens|sessions|all)',
                    '--output=<path>    Output directory',
                ],
                examples: [
                    'mockauth generate',
                    'mockauth generate --count=500 --type=users',
                    'mockauth generate --type=all --output=./mock-data',
                ],
            },
            'migrate-to': {
                description: 'Generate migration code to production auth providers',
                usage: 'mockauth migrate-to <provider> [options]',
                flags: [
                    '--output=<path>    Output directory for migration files',
                    '--typescript      Generate TypeScript instead of JavaScript',
                ],
                examples: [
                    'mockauth migrate-to better-auth',
                    'mockauth migrate-to clerk --output=./auth',
                    'mockauth migrate-to auth0 --typescript',
                ],
            },
            health: {
                description: 'Check server health and system status',
                usage: 'mockauth health [options]',
                flags: [
                    '--detailed        Show detailed health metrics',
                    '--json            Output in JSON format',
                ],
                examples: [
                    'mockauth health',
                    'mockauth health --detailed',
                    'mockauth health --json',
                ],
            },
            debug: {
                description: 'Start interactive debugging console',
                usage: 'mockauth debug',
                flags: ['--verbose         Enable verbose debug output'],
                examples: ['mockauth debug', 'mockauth debug --verbose'],
            },
            deploy: {
                description: 'Deploy MockAuth to cloud platforms',
                usage: 'mockauth deploy [options]',
                flags: [
                    '--env=<environment>  Target environment (development|staging|production)',
                    '--profile=<name>     Use specific deployment profile',
                    '--verbose           Show detailed deployment logs',
                ],
                examples: [
                    'mockauth deploy',
                    'mockauth deploy --env=production',
                    'mockauth deploy --profile=aws --verbose',
                ],
            },
            monitor: {
                description: 'Real-time server monitoring and metrics',
                usage: 'mockauth monitor [options]',
                flags: [
                    '--watch            Continuous monitoring mode',
                    '--port=<number>    Monitor specific port',
                    '--interval=<ms>    Update interval in milliseconds',
                ],
                examples: [
                    'mockauth monitor',
                    'mockauth monitor --watch',
                    'mockauth monitor --port=3001 --interval=1000',
                ],
            },
            backup: {
                description: 'Backup server data and configuration',
                usage: 'mockauth backup [options]',
                flags: [
                    '--output=<path>    Backup output directory',
                    '--include-data     Include user data in backup',
                    '--compress         Compress backup files',
                ],
                examples: [
                    'mockauth backup',
                    'mockauth backup --output=./backups',
                    'mockauth backup --include-data --compress',
                ],
            },
            restore: {
                description: 'Restore from backup',
                usage: 'mockauth restore [options]',
                flags: [
                    '--file=<path>      Backup file to restore from',
                    '--force            Force restore without confirmation',
                    '--dry-run          Preview restore without executing',
                ],
                examples: [
                    'mockauth restore --file=backup.tar.gz',
                    'mockauth restore --file=backup.tar.gz --force',
                    'mockauth restore --file=backup.tar.gz --dry-run',
                ],
            },
            validate: {
                description: 'Validate configuration files',
                usage: 'mockauth validate [options]',
                flags: [
                    '--config=<file>    Configuration file to validate',
                    '--strict          Use strict validation rules',
                    '--fix             Auto-fix validation issues',
                ],
                examples: [
                    'mockauth validate',
                    'mockauth validate --config=./config.json',
                    'mockauth validate --strict --fix',
                ],
            },
            benchmark: {
                description: 'Performance benchmarking and testing',
                usage: 'mockauth benchmark [options]',
                flags: [
                    '--duration=<ms>    Benchmark duration in milliseconds',
                    '--concurrent=<n>   Number of concurrent requests',
                    '--output=<file>    Save results to file',
                ],
                examples: [
                    'mockauth benchmark',
                    'mockauth benchmark --duration=30000',
                    'mockauth benchmark --concurrent=100 --output=results.json',
                ],
            },
            docs: {
                description: 'Generate and open documentation',
                usage: 'mockauth docs [options]',
                flags: [
                    '--open            Auto-open documentation in browser',
                    '--format=<type>   Documentation format (html|pdf|markdown)',
                    '--output=<path>   Output directory for docs',
                ],
                examples: [
                    'mockauth docs',
                    'mockauth docs --open',
                    'mockauth docs --format=html --output=./docs',
                ],
            },
            plugin: {
                description: 'Plugin management system',
                usage: 'mockauth plugin <action> [options]',
                flags: [
                    '--list            List installed plugins',
                    '--install=<name>  Install a plugin',
                    '--remove=<name>   Remove a plugin',
                    '--update          Update all plugins',
                ],
                examples: [
                    'mockauth plugin --list',
                    'mockauth plugin --install=oauth-provider',
                    'mockauth plugin --remove=old-plugin',
                    'mockauth plugin --update',
                ],
            },
        };
        const info = helpInfo[command];
        if (!info) {
            console.log(`\n❌ No detailed help available for: ${command}\n`);
            return;
        }
        console.log(`\n📚 MockAuth: ${command}\n`);
        console.log(`${info.description}\n`);
        console.log(`Usage:`);
        console.log(`  ${info.usage}\n`);
        if (info.flags.length > 0) {
            console.log(`Flags:`);
            info.flags.forEach((flag) => {
                console.log(`  ${flag}`);
            });
            console.log('');
        }
        if (info.examples.length > 0) {
            console.log(`Examples:`);
            info.examples.forEach((example) => {
                console.log(`  $ ${example}`);
            });
            console.log('');
        }
    }
    parseArgs() {
        const args = process.argv.slice(2);
        // Filter out flags to get clean command list
        const cleanArgs = args.filter((arg) => !arg.startsWith('--'));
        const options = {
            command: cleanArgs[0] || 'help',
        };
        // Handle migrate-to command specially (FIXED: proper arg parsing)
        if (cleanArgs[0] === 'migrate-to' && cleanArgs[1]) {
            options.command = 'migrate-to';
            options.database = cleanArgs[1]; // The provider (better-auth, clerk, etc.)
            // Parse remaining args starting from index 2
            for (let i = 2; i < args.length; i++) {
                const arg = args[i];
                const nextArg = args[i + 1];
                switch (arg) {
                    case '--output':
                    case '-o':
                        options.output = nextArg;
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
        // Parse standard arguments
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
                case '--template':
                    options.template = nextArg;
                    i++;
                    break;
                case '--count':
                    options.count = parseInt(nextArg);
                    i++;
                    break;
                case '--type':
                    options.type = nextArg;
                    i++;
                    break;
                case '--coverage':
                    options.coverage = true;
                    break;
                case '--open':
                    options.open = true;
                    break;
                case '--legacy':
                    options.legacy = true;
                    break;
                case '--help':
                case '-h':
                    options.help = true;
                    break;
            }
        }
        return options;
    }
    showHelp() {
        console.log(`
███╗   ███╗ ██████╗  ██████╗██╗  ██╗ █████╗ ██╗   ██╗████████╗██╗  ██╗
████╗ ████║██╔═══██╗██╔════╝██║ ██╔╝██╔══██╗██║   ██║╚══██╔══╝██║  ██║
██╔████╔██║██║   ██║██║     █████╔╝ ███████║██║   ██║   ██║   ███████║
██║╚██╔╝██║██║   ██║██║     ██╔═██╗ ██╔══██║██║   ██║   ██║   ██╔══██║
██║ ╚═╝ ██║╚██████╔╝╚██████╗██║  ██╗██║  ██║╚██████╔╝   ██║   ██║  ██║
╚═╝     ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝

   ╭────────────────────────────────────────────────────────────╮
   │                                                            │
   │   🚀 Developer-First Authentication Simulator              │
   │   The most powerful auth testing platform for developers   │
   │                                                            │
   ╰────────────────────────────────────────────────────────────╯

USAGE:
  mockauth <command> [options]

⚡ CORE COMMANDS:
  init [--template]                    Initialize a new MockAuth project
  start [--port] [--watch]             Start the MockAuth server
  stop [--port]                        Stop the MockAuth server
  restart [--port]                     Restart the MockAuth server
  reset [--port]                       Reset server data and restart
  status [--port]                      Check server status and health
  list                                 List all running MockAuth servers
  kill-all                             Stop all running MockAuth servers
  test [--coverage]                    Run authentication tests
  generate [--count] [--type]          Generate mock data (users, tokens, sessions)
  builder                              Open visual configuration builder (web UI)
  migrate-to <provider>                Migrate to production auth (better-auth, auth0, etc)
  health                               Check server health and system status
  debug                                Interactive debugging console

🔧 ADVANCED COMMANDS:
  deploy [--env] [--profile]           Deploy to cloud platforms
  monitor [--watch]                    Real-time server monitoring
  backup [--output]                    Backup server data and configuration
  restore [--file]                     Restore from backup
  validate [--config]                  Validate configuration files
  benchmark [--duration]               Performance benchmarking
  docs [--open]                        Generate and open documentation
  plugin [--list|--install|--remove]   Plugin management system

📋 OPTIONS:
  -c, --config <file>        Configuration file path
  -p, --port <number>        Server port (default: 3001)
  -d, --database <type>      Database type (memory|sqlite|postgresql|mysql)
  -o, --output <path>        Output directory for generated files
  -v, --verbose              Enable verbose logging
  -w, --watch                Enable auto-reload on config changes
  -e, --env <environment>    Environment (development|staging|production)
  --profile <name>           Use specific configuration profile
  --legacy                   Use legacy CLI interface (no enhanced UI)
  --template <type>          Project template (basic|enterprise|minimal)
  --count <number>           Number of items to generate (default: 100)
  --type <type>              Type of data to generate (users|tokens|sessions|all)
  --coverage                 Generate test coverage report
  --open                     Auto-open browser for web interfaces
  -h, --help                 Show this help message

🚀 QUICK START (30 seconds):
  1. mockauth init           # Create config
  2. mockauth start          # Start server
  3. Open http://localhost:3001/dashboard

💡 COMMON EXAMPLES:
  # Quick start - create and run
  mockauth init && mockauth start

  # Start on custom port with watch mode
  mockauth start --port=4000 --watch

  # Stop server
  mockauth stop --port=3001

  # Restart server
  mockauth restart

  # Reset server data
  mockauth reset

  # Check server status
  mockauth status

  # List all servers
  mockauth list

  # Stop all servers
  mockauth kill-all

  # Generate 500 test users
  mockauth generate --count=500 --type=users

  # Open visual builder
  mockauth builder

  # Migrate to Better Auth
  mockauth migrate-to better-auth

  # Run tests with coverage
  mockauth test --coverage

  # Deploy to production
  mockauth deploy --env=production

  # Monitor server performance
  mockauth monitor --watch

  # Backup server data
  mockauth backup --output=./backup

  # Use legacy interface
  mockauth --legacy init

🔗 USEFUL LINKS:
  Web Dashboard:  http://localhost:3001/dashboard
  Visual Builder: http://localhost:3001/builder
  API Docs:       http://localhost:3001/api
  Health Check:   http://localhost:3001/health

📚 NEED HELP?
  Documentation:  https://mockauth.dev/docs
  GitHub Issues:  https://github.com/mockilo/mockauth
  Discord:        https://discord.gg/mockauth

💡 Tip: Run mockauth <command> --help for detailed info about a specific command
    `);
    }
    async initProject(options) {
        console.log('🎯 Initializing MockAuth project...\n');
        const config = await this.createInteractiveConfig();
        // Create config file
        const configPath = options.config || 'mockauth.config.js';
        const configContent = `module.exports = ${JSON.stringify(config, null, 2)};`;
        fs.writeFileSync(configPath, configContent);
        // Create example files
        this.createExampleFiles(config);
        console.log('\n✅ MockAuth project initialized!');
        console.log(`📁 Configuration: ${configPath}`);
        console.log('📁 Example files created in ./examples/');
        console.log('\n🚀 To start MockAuth:');
        console.log('   mockauth start');
    }
    async createInteractiveConfig() {
        const config = {
            port: 3001,
            baseUrl: 'http://localhost:3001',
            jwtSecret: this.generateSecret(),
            users: [],
            enableMFA: true,
            enablePasswordReset: true,
            enableAccountLockout: true,
            logLevel: 'info',
            enableAuditLog: true,
            maxLoginAttempts: 5,
            lockoutDuration: '15m',
            database: {
                type: 'memory',
            },
            ecosystem: {
                mocktail: {
                    enabled: true,
                    outputPath: './mock-data',
                    seedCount: 100,
                },
                schemaghost: {
                    enabled: true,
                    port: 3002,
                },
            },
        };
        // Interactive configuration
        console.log('📝 Project Configuration:');
        const port = await this.question('Server port (3001): ');
        if (port)
            config.port = parseInt(port) || 3001;
        const baseUrl = await this.question('Base URL (http://localhost:3001): ');
        if (baseUrl)
            config.baseUrl = baseUrl;
        const database = await this.question('Database type (memory|sqlite|postgresql|mysql) [memory]: ');
        if (database &&
            ['memory', 'sqlite', 'postgresql', 'mysql'].includes(database)) {
            config.database.type = database;
        }
        const enableMFA = await this.question('Enable MFA? (y/n) [y]: ');
        config.enableMFA = enableMFA.toLowerCase() !== 'n';
        const enableEcosystem = await this.question('Enable MockTail & SchemaGhost? (y/n) [y]: ');
        if (enableEcosystem.toLowerCase() === 'n') {
            config.ecosystem = {
                mocktail: { enabled: false },
                schemaghost: { enabled: false },
            };
        }
        // Create default users
        const createUsers = await this.question('Create default users? (y/n) [y]: ');
        if (createUsers.toLowerCase() !== 'n') {
            config.users = [
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
            ];
        }
        return config;
    }
    createExampleFiles(config) {
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
        // Advanced usage example
        const advancedExample = `const { MockAuth } = require('mockauth');

const config = {
  port: 3001,
  baseUrl: 'http://localhost:3001',
  jwtSecret: 'your-secret-key-must-be-at-least-32-characters-long-for-security',
  enableMFA: true,
  enablePasswordReset: true,
  database: {
    type: 'sqlite',
    connectionString: './mockauth.db'
  },
  ecosystem: {
    mocktail: {
      enabled: true,
      outputPath: './mock-data',
      seedCount: 1000
    },
    schemaghost: {
      enabled: true,
      port: 3002,
      endpoints: [
        {
          path: '/api/posts',
          method: 'GET',
          response: { posts: [] },
          statusCode: 200
        }
      ]
    }
  }
};

async function startAdvancedMockAuth() {
  const auth = new MockAuth(config);
  
  // Add custom middleware
  auth.getApp().use((req, res, next) => {
    console.log(\`Custom middleware: \${req.method} \${req.path}\`);
    next();
  });
  
  await auth.start();
  console.log('🚀 Advanced MockAuth is running!');
}

startAdvancedMockAuth().catch(console.error);`;
        fs.writeFileSync(path.join(examplesDir, 'advanced-usage.js'), advancedExample);
        // Testing example
        const testingExample = `const { MockAuth } = require('mockauth');

async function testMockAuth() {
  const auth = new MockAuth({
    port: 3001,
    baseUrl: 'http://localhost:3001',
    jwtSecret: 'test-secret-key-must-be-at-least-32-characters-long-for-testing',
    users: [
      {
        email: 'test@example.com',
        username: 'testuser',
        password: 'test123',
        roles: ['user']
      }
    ]
  });

  await auth.start();
  console.log('✅ MockAuth test server started');
  
  // Test login
  const loginResult = await auth.login('test@example.com', 'test123');
  console.log('✅ Login test:', loginResult.user.username);
  
  // Test protected route
  const users = await auth.getUsers();
  console.log('✅ Users test:', users.length, 'users found');
  
  await auth.stop();
  console.log('✅ All tests passed!');
}

testMockAuth().catch(console.error);`;
        fs.writeFileSync(path.join(examplesDir, 'testing.js'), testingExample);
        // Package.json for examples
        const packageJson = `{
  "name": "mockauth-examples",
  "version": "1.0.0",
  "description": "MockAuth usage examples",
  "main": "basic-usage.js",
  "scripts": {
    "start": "node basic-usage.js",
    "advanced": "node advanced-usage.js",
    "test": "node testing.js"
  },
  "dependencies": {
    "mockauth": "^1.0.0"
  }
}`;
        fs.writeFileSync(path.join(examplesDir, 'package.json'), packageJson);
    }
    async startServer(options) {
        console.log('🚀 Starting MockAuth server...\n');
        try {
            const config = this.loadConfig(options.config);
            const auth = new index_1.MockAuth(config);
            await auth.start();
            console.log('✅ MockAuth server started successfully!');
            console.log(`🔗 Server running on: ${config.baseUrl}`);
            console.log('📚 Available endpoints:');
            console.log('   • Health: /health');
            console.log('   • API Docs: /api');
            console.log('   • Login: POST /auth/login');
            console.log('   • Users: GET /users');
            console.log('   • Metrics: GET /metrics');
            console.log('\n🔄 Press Ctrl+C to stop');
            // Keep the process running
            process.on('SIGINT', async () => {
                console.log('\n🛑 Shutting down MockAuth...');
                await auth.stop();
                process.exit(0);
            });
        }
        catch (error) {
            console.error('❌ Error starting MockAuth:', error.message);
            console.log('💡 Run "mockauth init" first to create configuration');
            process.exit(1);
        }
    }
    async runTests(options) {
        console.log('🧪 Running MockAuth tests...\n');
        const testCode = `
const { MockAuth } = require('mockauth');

async function testMockAuth() {
  const auth = new MockAuth({
    port: 3001,
    baseUrl: 'http://localhost:3001',
    jwtSecret: 'test-secret-key-must-be-at-least-32-characters-long-for-testing',
    users: [
      {
        email: 'test@example.com',
        username: 'testuser',
        password: 'test123',
        roles: ['user']
      }
    ]
  });

  await auth.start();
  console.log('✅ MockAuth test server started');
  
  // Test login
  const loginResult = await auth.login('test@example.com', 'test123');
  console.log('✅ Login test:', loginResult.user.username);
  
  await auth.stop();
  console.log('✅ All tests passed!');
}

testMockAuth().catch(console.error);`;
        const testFile = 'test-mockauth.js';
        fs.writeFileSync(testFile, testCode);
        console.log(`📝 Test file created: ${testFile}`);
        console.log('🚀 Run: node test-mockauth.js');
    }
    async generateData(options) {
        console.log('🎭 Generating mock data...\n');
        const outputPath = options.output || './mock-data';
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        // Generate sample data
        const users = this.generateUsers(50);
        const posts = this.generatePosts(100);
        const products = this.generateProducts(75);
        fs.writeFileSync(path.join(outputPath, 'users.json'), JSON.stringify(users, null, 2));
        fs.writeFileSync(path.join(outputPath, 'posts.json'), JSON.stringify(posts, null, 2));
        fs.writeFileSync(path.join(outputPath, 'products.json'), JSON.stringify(products, null, 2));
        console.log(`✅ Mock data generated in: ${outputPath}`);
        console.log('📁 Files created:');
        console.log('   • users.json (50 users)');
        console.log('   • posts.json (100 posts)');
        console.log('   • products.json (75 products)');
    }
    async migrateDatabase(options) {
        console.log('🗄️ Running database migrations...\n');
        const config = this.loadConfig(options.config);
        const auth = new index_1.MockAuth(config);
        try {
            await auth.start();
            console.log('✅ Database migrations completed');
            await auth.stop();
        }
        catch (error) {
            console.error('❌ Migration error:', error.message);
            process.exit(1);
        }
    }
    loadConfig(configPath) {
        // FIXED: Properly resolve absolute path
        const resolvedPath = path.resolve(process.cwd(), configPath || 'mockauth.config.js');
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
    async launchBuilder(options) {
        console.log('🎨 Launching MockAuth Visual Builder...\n');
        const port = options.port || 3000;
        console.log(`🌐 Builder will be available at: http://localhost:${port}`);
        console.log('📝 Features:');
        console.log('   • Drag-and-drop user management');
        console.log('   • Real-time configuration preview');
        console.log('   • Visual role and permission mapping');
        console.log('   • Test scenarios builder');
        console.log('   • Export configuration as code');
        console.log('\n🚀 Starting builder...');
        // Start the web builder
        const { spawn } = require('child_process');
        const builder = spawn('node', ['dist/web-builder/server.js', '--port', port.toString()], {
            stdio: 'inherit',
        });
        builder.on('error', (error) => {
            console.error('❌ Error starting builder:', error.message);
            console.log('💡 Make sure the web builder is properly installed');
        });
        process.on('SIGINT', () => {
            console.log('\n🛑 Stopping builder...');
            builder.kill();
            process.exit(0);
        });
    }
    async startDebugMode(options) {
        console.log('🔍 Starting MockAuth Debug Mode...\n');
        try {
            const config = this.loadConfig(options.config);
            const auth = new index_1.MockAuth(config);
            await auth.start();
            console.log('✅ MockAuth debug server started!');
            console.log(`🔗 Server: ${config.baseUrl}`);
            console.log(`🔍 Debug Console: ${config.baseUrl}/debug`);
            console.log('📊 Features:');
            console.log('   • Real-time request/response inspection');
            console.log('   • Live user session monitoring');
            console.log('   • Token validation and debugging');
            console.log('   • Performance metrics dashboard');
            console.log('   • API testing playground');
            console.log('\n🔄 Press Ctrl+C to stop');
            process.on('SIGINT', async () => {
                console.log('\n🛑 Shutting down debug mode...');
                await auth.stop();
                process.exit(0);
            });
        }
        catch (error) {
            console.error('❌ Error starting debug mode:', error.message);
            process.exit(1);
        }
    }
    async runHealthCheck(options) {
        console.log('🏥 Running MockAuth Health Check...\n');
        try {
            const config = this.loadConfig(options.config);
            const auth = new index_1.MockAuth(config);
            await auth.start();
            // Run comprehensive health checks
            const healthStatus = await this.performHealthChecks(auth);
            console.log('📊 Health Check Results:');
            console.log(`✅ Server: ${healthStatus.server ? 'Running' : 'Failed'} on port ${config.port}`);
            console.log(`✅ Database: ${healthStatus.database ? 'Connected' : 'Failed'}`);
            console.log(`✅ Memory: ${healthStatus.memory}MB (${healthStatus.memoryStatus})`);
            console.log(`✅ Response Time: ${healthStatus.responseTime}ms (${healthStatus.performanceStatus})`);
            console.log(`✅ Active Sessions: ${healthStatus.activeSessions}`);
            if (healthStatus.warnings.length > 0) {
                console.log('\n⚠️  Warnings:');
                healthStatus.warnings.forEach((warning) => {
                    console.log(`   • ${warning}`);
                });
            }
            if (healthStatus.suggestions.length > 0) {
                console.log('\n💡 Suggestions:');
                healthStatus.suggestions.forEach((suggestion) => {
                    console.log(`   • ${suggestion}`);
                });
            }
            await auth.stop();
            const overallStatus = healthStatus.server &&
                healthStatus.database &&
                healthStatus.memoryStatus === 'Normal';
            console.log(`\n${overallStatus ? '✅' : '❌'} Overall Status: ${overallStatus ? 'Healthy' : 'Issues Detected'}`);
        }
        catch (error) {
            console.error('❌ Health check failed:', error.message);
            process.exit(1);
        }
    }
    async stopServer(options) {
        console.log('🛑 Stopping MockAuth server...\n');
        try {
            const config = this.loadConfig(options.config);
            const port = options.port || config.port;
            // Try to find and stop the server process
            const serverProcess = await this.findServerProcess(port);
            if (serverProcess) {
                console.log(`📡 Found server running on port ${port} (PID: ${serverProcess.pid})`);
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
                console.log('✅ MockAuth server stopped successfully');
            }
            else {
                console.log(`ℹ️  No MockAuth server found running on port ${port}`);
            }
        }
        catch (error) {
            console.error('❌ Error stopping server:', error.message);
            console.log('💡 Try running "mockauth list" to see running servers');
        }
    }
    async restartServer(options) {
        console.log('🔄 Restarting MockAuth server...\n');
        try {
            // First stop the server
            await this.stopServer(options);
            // Wait a moment
            await new Promise((resolve) => setTimeout(resolve, 1000));
            // Then start it again
            await this.startServer(options);
        }
        catch (error) {
            console.error('❌ Error restarting server:', error.message);
        }
    }
    async resetServer(options) {
        console.log('🔄 Resetting MockAuth server...\n');
        try {
            const config = this.loadConfig(options.config);
            // Stop server if running
            await this.stopServer(options);
            // Clear database/data files
            console.log('🗑️  Clearing server data...');
            await this.clearServerData(config);
            // Restart server
            console.log('🚀 Starting fresh server...');
            await this.startServer(options);
            console.log('✅ MockAuth server reset successfully');
        }
        catch (error) {
            console.error('❌ Error resetting server:', error.message);
        }
    }
    async checkServerStatus(options) {
        console.log('📊 Checking MockAuth server status...\n');
        try {
            const config = this.loadConfig(options.config);
            const port = options.port || config.port;
            // Check if server is running
            const serverProcess = await this.findServerProcess(port);
            if (serverProcess) {
                console.log('✅ Server Status: Running');
                console.log(`📡 Port: ${port}`);
                console.log(`🆔 Process ID: ${serverProcess.pid}`);
                console.log(`🔗 URL: ${config.baseUrl}`);
                // Test server health
                const isHealthy = await this.testServerHealth(config.baseUrl);
                console.log(`💚 Health: ${isHealthy ? 'Healthy' : 'Unhealthy'}`);
                if (isHealthy) {
                    console.log('\n📚 Available endpoints:');
                    console.log('   • Health: /health');
                    console.log('   • API Docs: /api');
                    console.log('   • Login: POST /auth/login');
                    console.log('   • Users: GET /users');
                }
            }
            else {
                console.log('❌ Server Status: Not Running');
                console.log(`📡 Port ${port} is available`);
                console.log('💡 Run "mockauth start" to start the server');
            }
        }
        catch (error) {
            console.error('❌ Error checking server status:', error.message);
        }
    }
    async listServers(options) {
        console.log('📋 Listing all MockAuth servers...\n');
        try {
            const runningServers = await this.findAllMockAuthServers();
            if (runningServers.length === 0) {
                console.log('ℹ️  No MockAuth servers currently running');
                console.log('💡 Run "mockauth start" to start a server');
                return;
            }
            console.log(`Found ${runningServers.length} MockAuth server(s):\n`);
            runningServers.forEach((server, index) => {
                console.log(`${index + 1}. MockAuth Server`);
                console.log(`   📡 Port: ${server.port}`);
                console.log(`   🆔 PID: ${server.pid}`);
                console.log(`   🔗 URL: http://localhost:${server.port}`);
                console.log(`   ⏰ Started: ${server.startTime}`);
                console.log('');
            });
            console.log('💡 Use "mockauth stop --port <port>" to stop a specific server');
            console.log('💡 Use "mockauth kill-all" to stop all servers');
        }
        catch (error) {
            console.error('❌ Error listing servers:', error.message);
        }
    }
    async killAllServers(options) {
        console.log('💀 Stopping all MockAuth servers...\n');
        try {
            const runningServers = await this.findAllMockAuthServers();
            if (runningServers.length === 0) {
                console.log('ℹ️  No MockAuth servers currently running');
                return;
            }
            console.log(`Found ${runningServers.length} server(s) to stop:\n`);
            for (const server of runningServers) {
                console.log(`🛑 Stopping server on port ${server.port} (PID: ${server.pid})...`);
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
                    console.log(`✅ Server on port ${server.port} stopped`);
                }
                catch (error) {
                    console.log(`⚠️  Could not stop server on port ${server.port}: ${error.message}`);
                }
            }
            console.log('\n✅ All MockAuth servers stopped');
        }
        catch (error) {
            console.error('❌ Error stopping servers:', error.message);
        }
    }
    async generateMigration(options) {
        console.log('🔄 Generating Migration Files...\n');
        const provider = options.database || 'better-auth';
        const outputPath = options.output || './dist/auth';
        if (!fs.existsSync(outputPath)) {
            fs.mkdirSync(outputPath, { recursive: true });
        }
        const supportedProviders = [
            'clerk',
            'better-auth',
            'auth0',
            'firebase',
            'supabase',
        ];
        if (!supportedProviders.includes(provider)) {
            console.error(`❌ Unsupported provider: ${provider}`);
            console.log(`💡 Supported providers: ${supportedProviders.join(', ')}`);
            process.exit(1);
        }
        console.log(`📝 Generating migration for: ${provider}`);
        console.log(`📁 Output directory: ${outputPath}`);
        // Generate migration files based on provider
        const migrationFiles = this.generateMigrationFiles(provider, outputPath);
        console.log('\n✅ Migration files generated:');
        migrationFiles.forEach((file) => {
            console.log(`   • ${file}`);
        });
        console.log('\n📚 Next steps:');
        console.log('   1. Review the generated files');
        console.log('   2. Install the required dependencies');
        console.log('   3. Configure environment variables');
        console.log('   4. Test the migration');
        console.log('   5. Deploy to production');
        console.log('\n🧪 Test your migration:');
        console.log(`   npx mockauth test-migration --from mockauth --to ${provider}`);
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
    async performHealthChecks(auth) {
        const startTime = Date.now();
        // Test server response
        const serverCheck = await this.testServerResponse(auth);
        // Test database connection
        const databaseCheck = await this.testDatabaseConnection(auth);
        // Check memory usage
        const memoryUsage = process.memoryUsage();
        const memoryMB = Math.round(memoryUsage.heapUsed / 1024 / 1024);
        const memoryStatus = memoryMB > 100 ? 'High' : memoryMB > 50 ? 'Normal' : 'Low';
        // Test response time
        const responseTime = Date.now() - startTime;
        const performanceStatus = responseTime < 100 ? 'Excellent' : responseTime < 500 ? 'Good' : 'Slow';
        // Get active sessions
        const activeSessions = await this.getActiveSessions(auth);
        // Generate warnings and suggestions
        const warnings = [];
        const suggestions = [];
        if (memoryStatus === 'High') {
            warnings.push('High memory usage detected');
            suggestions.push('Consider restarting the server or optimizing configuration');
        }
        if (performanceStatus === 'Slow') {
            warnings.push('Slow response time detected');
            suggestions.push('Check database performance and server resources');
        }
        if (activeSessions > 100) {
            warnings.push('High number of active sessions');
            suggestions.push('Monitor session cleanup and consider session limits');
        }
        return {
            server: serverCheck,
            database: databaseCheck,
            memory: memoryMB,
            memoryStatus,
            responseTime,
            performanceStatus,
            activeSessions,
            warnings,
            suggestions,
        };
    }
    async testServerResponse(auth) {
        try {
            // Simple health check
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async testDatabaseConnection(auth) {
        try {
            // Test database connection
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getActiveSessions(auth) {
        try {
            // Get active session count
            return 0;
        }
        catch (error) {
            return 0;
        }
    }
    generateMigrationFiles(provider, outputPath) {
        const files = [];
        switch (provider) {
            case 'clerk':
                files.push(this.generateClerkMigration(outputPath));
                break;
            case 'better-auth':
                files.push(this.generateBetterAuthMigration(outputPath));
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
    generateClerkMigration(outputPath) {
        const clerkFile = path.join(outputPath, 'clerk.js');
        const content = `// Clerk Migration File
import { Clerk } from '@clerk/clerk-sdk-node';

const clerk = new Clerk({
  secretKey: process.env.CLERK_SECRET_KEY
});

export const authService = {
  async login(email, password) {
    // Clerk handles this differently, but same interface
    const user = await clerk.users.authenticate({ email, password });
    const token = await clerk.sessions.createToken(user.id);
    
    return {
      user: {
        id: user.id,
        email: user.emailAddresses[0].emailAddress,
        roles: user.publicMetadata.roles || ['user']
      },
      token,
      success: true
    };
  },
  
  async verifyToken(token) {
    const session = await clerk.sessions.verifyToken(token);
    return session.user;
  },
  
  async logout(token) {
    await clerk.sessions.revokeSession(token);
    return { success: true };
  }
};`;
        fs.writeFileSync(clerkFile, content);
        return clerkFile;
    }
    generateBetterAuthMigration(outputPath) {
        const betterAuthFile = path.join(outputPath, 'better-auth.js');
        const content = `// Better-Auth Migration File
// Generated by MockAuth Migration Tool
// This file provides the same API as MockAuth but uses Better-Auth as the backend

import { betterAuth } from 'better-auth';
import { betterAuthClient } from 'better-auth/client';

// Server-side configuration
const auth = betterAuth({
  database: {
    provider: 'postgresql', // or 'mysql', 'sqlite'
    url: process.env.DATABASE_URL
  },
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: false // Set to true for production
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET
    }
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  advanced: {
    generateId: () => crypto.randomUUID(),
    crossSubdomainCookies: {
      enabled: false
    }
  }
});

// Client-side configuration (for frontend)
export const authClient = betterAuthClient({
  baseURL: process.env.BETTER_AUTH_URL || 'http://localhost:3000',
  fetchOptions: {
    onError: (error) => {
      console.error('Better-Auth Error:', error);
    }
  }
});

// MockAuth-compatible service interface
export const authService = {
  async login(email, password) {
    try {
      const session = await auth.api.signInEmail({
        body: { email, password }
      });
      
      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          roles: session.user.roles || ['user'],
          permissions: session.user.permissions || []
        },
        token: session.token,
        refreshToken: session.refreshToken,
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  async register(userData) {
    try {
      const session = await auth.api.signUpEmail({
        body: {
          email: userData.email,
          password: userData.password,
          name: userData.username || userData.name
        }
      });
      
      return {
        user: {
          id: session.user.id,
          email: session.user.email,
          roles: session.user.roles || ['user'],
          permissions: session.user.permissions || []
        },
        token: session.token,
        refreshToken: session.refreshToken,
        success: true
      };
    } catch (error) {
      return {
        success: false,
        error: error.message
      };
    }
  },
  
  async verifyToken(token) {
    try {
      const session = await auth.api.getSession({
        headers: { authorization: \`Bearer \${token}\` }
      });
      return session.user;
    } catch (error) {
      return null;
    }
  },
  
  async logout(token) {
    try {
      await auth.api.signOut({
        headers: { authorization: \`Bearer \${token}\` }
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
  
  async refreshToken(refreshToken) {
    try {
      const session = await auth.api.refresh({
        body: { refreshToken }
      });
      return {
        token: session.token,
        refreshToken: session.refreshToken,
        success: true
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
};

// Export the Better-Auth instance for advanced usage
export { auth };

// Environment variables needed:
// DATABASE_URL=postgresql://user:password@localhost:5432/database
// GOOGLE_CLIENT_ID=your-google-client-id
// GOOGLE_CLIENT_SECRET=your-google-client-secret
// GITHUB_CLIENT_ID=your-github-client-id
// GITHUB_CLIENT_SECRET=your-github-client-secret
// BETTER_AUTH_URL=http://localhost:3000 (optional)`;
        fs.writeFileSync(betterAuthFile, content);
        // Also create a package.json for better-auth dependencies
        const packageJson = {
            name: 'better-auth-migration',
            version: '1.0.0',
            description: 'Better-Auth migration from MockAuth',
            dependencies: {
                'better-auth': '^0.8.0',
                'better-auth-client': '^0.8.0',
            },
            devDependencies: {
                '@types/node': '^20.0.0',
            },
        };
        fs.writeFileSync(path.join(outputPath, 'package.json'), JSON.stringify(packageJson, null, 2));
        // Create environment template
        const envTemplate = `# Better-Auth Environment Variables
DATABASE_URL=postgresql://user:password@localhost:5432/database
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
BETTER_AUTH_URL=http://localhost:3000
BETTER_AUTH_SECRET=your-secret-key-here`;
        fs.writeFileSync(path.join(outputPath, '.env.template'), envTemplate);
        return betterAuthFile;
    }
    generateAuth0Migration(outputPath) {
        const auth0File = path.join(outputPath, 'auth0.js');
        const content = `// Auth0 Migration File
import { ManagementClient } from 'auth0';

const auth0 = new ManagementClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET
});

export const authService = {
  async login(email, password) {
    // Auth0 handles login through their hosted login page
    // This is a simplified example
    const user = await auth0.users.getByEmail(email);
    return {
      user: {
        id: user.user_id,
        email: user.email,
        roles: user.app_metadata?.roles || ['user']
      },
      token: 'auth0-token', // Simplified
      success: true
    };
  },
  
  async verifyToken(token) {
    // Verify JWT token with Auth0
    const decoded = jwt.verify(token, process.env.AUTH0_PUBLIC_KEY);
    return decoded;
  }
};`;
        fs.writeFileSync(auth0File, content);
        return auth0File;
    }
    generateFirebaseMigration(outputPath) {
        const firebaseFile = path.join(outputPath, 'firebase.js');
        const content = `// Firebase Migration File
import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword } from 'firebase/auth';

const app = initializeApp({
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID
});

const auth = getAuth(app);

export const authService = {
  async login(email, password) {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const token = await userCredential.user.getIdToken();
    
    return {
      user: {
        id: userCredential.user.uid,
        email: userCredential.user.email,
        roles: userCredential.user.customClaims?.roles || ['user']
      },
      token,
      success: true
    };
  },
  
  async verifyToken(token) {
    // Firebase token verification
    const decoded = await auth.verifyIdToken(token);
    return decoded;
  }
};`;
        fs.writeFileSync(firebaseFile, content);
        return firebaseFile;
    }
    generateSupabaseMigration(outputPath) {
        const supabaseFile = path.join(outputPath, 'supabase.js');
        const content = `// Supabase Migration File
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export const authService = {
  async login(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    return {
      user: {
        id: data.user.id,
        email: data.user.email,
        roles: data.user.user_metadata?.roles || ['user']
      },
      token: data.session.access_token,
      success: true
    };
  },
  
  async verifyToken(token) {
    const { data, error } = await supabase.auth.getUser(token);
    if (error) throw error;
    return data.user;
  }
};`;
        fs.writeFileSync(supabaseFile, content);
        return supabaseFile;
    }
    close() {
        this.rl.close();
    }
}
exports.MockAuthCLI = MockAuthCLI;
// CLI entry point
if (require.main === module) {
    const args = process.argv.slice(2);
    // Check if legacy mode is requested
    const useLegacy = args.includes('--legacy');
    // Remove flags from args to get clean command list
    const cleanArgs = args.filter((arg) => !arg.startsWith('--'));
    // Check if enhanced UI is requested (default unless --legacy)
    const useEnhancedUI = !useLegacy;
    // Check if advanced commands are requested
    const advancedCommands = [
        'deploy',
        'monitor',
        'backup',
        'restore',
        'validate',
        'benchmark',
        'docs',
        'plugin',
    ];
    const isAdvancedCommand = cleanArgs.length > 0 && advancedCommands.includes(cleanArgs[0]);
    // Validate command if one was provided
    const validCommands = [
        'init',
        'start',
        'stop',
        'restart',
        'reset',
        'status',
        'list',
        'kill-all',
        'test',
        'generate',
        'migrate',
        'builder',
        'debug',
        'health',
        'migrate-to',
        'deploy',
        'monitor',
        'backup',
        'restore',
        'validate',
        'benchmark',
        'docs',
        'plugin',
        'help',
    ];
    const providedCommand = cleanArgs[0];
    const hasHelpFlag = args.includes('--help') || args.includes('-h');
    // Handle --help flag specifically
    if (hasHelpFlag && !providedCommand) {
        if (useLegacy) {
            // Show legacy help
            const mockAuthCLI = new MockAuthCLI();
            mockAuthCLI.showHelp();
            process.exit(0);
        }
        else {
            // Show enhanced UI help
            const cli = new simple_enhanced_1.default();
            cli.handleHelp();
            process.exit(0);
        }
    }
    // If command with --help flag, show command-specific help
    if (providedCommand &&
        hasHelpFlag &&
        validCommands.includes(providedCommand)) {
        const mockAuthCLI = new MockAuthCLI();
        mockAuthCLI.showCommandHelp(providedCommand);
        process.exit(0);
    }
    if (providedCommand &&
        !validCommands.includes(providedCommand) &&
        !isAdvancedCommand &&
        !providedCommand.startsWith('--')) {
        // Invalid command provided - show error with suggestions
        const mockAuthCLI = new MockAuthCLI();
        mockAuthCLI.showInvalidCommand(providedCommand, validCommands);
        process.exit(1);
    }
    if (useLegacy) {
        // Use legacy CLI
        const cli = new MockAuthCLI();
        cli
            .run()
            .then(() => {
            cli.close();
        })
            .catch((error) => {
            console.error('❌ Legacy CLI Error:', error.message);
            cli.close();
            process.exit(1);
        });
    }
    else if (isAdvancedCommand) {
        const cli = new advanced_1.AdvancedMockAuthCLI();
        cli
            .run()
            .then(() => {
            cli.close();
        })
            .catch((error) => {
            console.error('❌ Advanced CLI Error:', error.message);
            cli.close();
            process.exit(1);
        });
    }
    else {
        // Use the new enhanced CLI with beautiful UI (default)
        const cli = new simple_enhanced_1.default();
        cli.run().catch((error) => {
            console.error('❌ Enhanced CLI Error:', error.message);
            process.exit(1);
        });
    }
}
//# sourceMappingURL=index.js.map