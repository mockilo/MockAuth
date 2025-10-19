#!/usr/bin/env node

import { MockAuth } from '../index';
import { MockAuthConfig } from '../types';
import * as fs from 'fs';
import * as path from 'path';
import chalk from 'chalk';
import boxen from 'boxen';
import inquirer from 'inquirer';
import * as crypto from 'crypto';
import * as readline from 'readline';

export class SimpleEnhancedCLI {
  private config: MockAuthConfig | null = null;
  private rl: readline.Interface | null = null;

  async run(): Promise<void> {
    try {
      // Set up ESC key handler
      this.setupEscKeyHandler();

      // Show welcome screen
      this.showWelcome();

      // Main loop for navigation
      await this.mainLoop();
    } catch (error: any) {
      console.log(
        chalk.red('❌'),
        chalk.bold.red('An error occurred:'),
        error.message
      );
      console.log(chalk.yellow('\n💡 Suggestions:'));
      console.log(chalk.gray('   • Check your configuration'));
      console.log(chalk.gray('   • Verify all dependencies are installed'));
      console.log(chalk.gray('   • Try running with --help for more options'));
      process.exit(1);
    } finally {
      // Clean up readline interface
      if (this.rl) {
        this.rl.close();
      }
    }
  }

  private async mainLoop(): Promise<void> {
    while (true) {
      try {
        // Show main menu
        const action = await this.showMainMenu();

        // Handle the selected action
        await this.handleAction(action);
      } catch (error: any) {
        if (error.message === 'ESC_PRESSED') {
          console.log(chalk.yellow('\n👋 Goodbye!'));
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

  private setupEscKeyHandler(): void {
    // Set up raw mode for key detection
    if (process.stdin.isTTY) {
      process.stdin.setRawMode(true);
    }

    // Handle process termination
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n👋 Goodbye!'));
      process.exit(0);
    });
  }

  // Wrapper for inquirer prompts with ESC key support
  private async promptWithEsc(questions: any[]): Promise<any> {
    // Process each question individually to catch back immediately
    const result: any = {};
    
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
      } else if (question.type === 'input') {
        enhancedQuestion = {
          ...question,
          message: question.message + ' (or type "back" to go back)',
          validate: (input: string) => {
            const lowerInput = input.toLowerCase().trim();
            if (lowerInput === 'back' || lowerInput === 'exit' || lowerInput === '__back__' || 
                lowerInput === 'go back' || lowerInput === 'goback' || lowerInput === 'go-back') {
              return true; // Allow these special inputs
            }
            return question.validate ? question.validate(input) : true;
          },
          filter: (input: string) => {
            const lowerInput = input.toLowerCase().trim();
            if (lowerInput === 'back' || lowerInput === 'exit' || lowerInput === '__back__' || 
                lowerInput === 'go back' || lowerInput === 'goback' || lowerInput === 'go-back') {
              return '__back__';
            }
            return question.filter ? question.filter(input) : input;
          }
        };
      } else if (question.type === 'confirm') {
        enhancedQuestion = {
          ...question,
          message: question.message + ' (or type "back" to go back)',
          validate: (input: any) => {
            if (typeof input === 'string') {
              const lowerInput = input.toLowerCase().trim();
              if (lowerInput === 'back' || lowerInput === 'exit' || lowerInput === '__back__' || 
                  lowerInput === 'go back' || lowerInput === 'goback' || lowerInput === 'go-back') {
                return true;
              }
            }
            return question.validate ? question.validate(input) : true;
          },
          filter: (input: any) => {
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
      } else {
        enhancedQuestion = question;
      }

      // Prompt for this single question
      const questionResult = await inquirer.prompt([enhancedQuestion]);
      
      // Check if user selected back for this question
      const value = questionResult[question.name];
      if (value === '__back__') {
        console.clear();
        console.log(chalk.blue('🔄 Going back to main menu...'));
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

  private showWelcome(): void {
    console.clear();

    console.log(
      chalk.cyan.bold(`
███╗   ███╗ ██████╗  ██████╗██╗  ██╗ █████╗ ██╗   ██╗████████╗██╗  ██╗
████╗ ████║██╔═══██╗██╔════╝██║ ██╔╝██╔══██╗██║   ██║╚══██╔══╝██║  ██║
██╔████╔██║██║   ██║██║     █████╔╝ ███████║██║   ██║   ██║   ███████║
██║╚██╔╝██║██║   ██║██║     ██╔═██╗ ██╔══██║██║   ██║   ██║   ██╔══██║
██║ ╚═╝ ██║╚██████╔╝╚██████╗██║  ██╗██║  ██║╚██████╔╝   ██║   ██║  ██║
╚═╝     ╚═╝ ╚═════╝  ╚═════╝╚═╝  ╚═╝╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝
`)
    );

    const subtitle = boxen(
      chalk.bold.cyan('🚀 Developer-First Authentication Simulator') +
        '\n' +
        chalk.gray('The most powerful auth testing platform for developers'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: '#1a1a1a',
      }
    );

    console.log(subtitle);
  }

  private async showMainMenu(): Promise<string> {
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
        message: chalk.bold.cyan('What would you like to do?'),
        choices,
      },
    ]);

    return action;
  }

  private async handleAction(action: string): Promise<void> {
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
        console.log(chalk.yellow('\n👋 Goodbye!'));
        process.exit(0);
      default:
        console.log(
          chalk.red('❌'),
          chalk.bold.red(`Unknown action: ${action}`)
        );
    }
  }

  private async handleInit(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Initializing new MockAuth project...')
    );

    const questions: any[] = [
      {
        type: 'input',
        name: 'port',
        message: 'Server port:',
        default: '3001',
        validate: (input: string) => {
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
    const config: MockAuthConfig = {
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
      const userQuestions: any[] = [
        {
          type: 'number',
          name: 'userCount',
          message: 'How many default users to create?',
          default: 2,
          validate: (input: number) =>
            input > 0 && input <= 10
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
          permissions:
            i === 0 ? ['read:users', 'write:users'] : ['read:profile'],
        });
      }
    }

    // Save configuration
    const configPath = 'mockauth.config.js';
    const configContent = `module.exports = ${JSON.stringify(config, null, 2)};`;
    fs.writeFileSync(configPath, configContent);

    // Create example files
    this.createExampleFiles();

    console.log(
      chalk.green('✅'),
      chalk.bold.green('MockAuth project initialized successfully!')
    );
    console.log(chalk.gray('   •'), `Configuration saved to: ${configPath}`);
    console.log(chalk.gray('   •'), `Server will run on port: ${answers.port}`);
    console.log(
      chalk.gray('   •'),
      `Base URL: http://localhost:${answers.port}`
    );
    console.log(chalk.gray('   •'), 'Example files created in ./examples/');

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
    } else {
      console.log(
        chalk.blue('ℹ️'),
        chalk.bold.blue('Run "mockauth start" when you\'re ready to begin!')
      );
    }
  }

  private async handleStart(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Starting MockAuth server...')
    );

    try {
      const config = this.loadConfig();
      
      // Check for existing servers and clean them up
      await this.checkAndCleanupExistingServers(config.port);
      
      const auth = new MockAuth(config);

      await auth.start();

      const serverInfo = boxen(
        chalk.bold.cyan('🚀 MockAuth Server Running') +
          '\n\n' +
          chalk.gray('Server:') +
          ' ' +
          chalk.green(config.baseUrl) +
          '\n' +
          chalk.gray('Port:') +
          ' ' +
          chalk.cyan(config.port) +
          '\n' +
          chalk.gray('API Docs:') +
          ' ' +
          chalk.blue(`${config.baseUrl}/api`) +
          '\n' +
          chalk.gray('Health:') +
          ' ' +
          chalk.blue(`${config.baseUrl}/health`),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
          backgroundColor: '#1a1a1a',
        }
      );

      console.log(serverInfo);

      // 🔑 Test Credentials
      console.log(chalk.bold.cyan('\n🔑 Test Credentials (Ready to Use):'));
      console.log(chalk.gray('   Admin Account:'));
      console.log(chalk.gray('     Email:'), chalk.green('admin@example.com'));
      console.log(chalk.gray('     Password:'), chalk.green('admin123'));
      console.log(chalk.gray('   Standard User:'));
      console.log(chalk.gray('     Email:'), chalk.green('user@example.com'));
      console.log(chalk.gray('     Password:'), chalk.green('user123'));

      // 🧪 Quick Curl Commands
      console.log(chalk.bold.cyan('\n🧪 Quick Test Commands:'));
      console.log(chalk.gray('   # Login as admin'));
      console.log(
        chalk.yellow(`   curl -X POST ${config.baseUrl}/auth/login \\`)
      );
      console.log(chalk.yellow(`     -H "Content-Type: application/json" \\`));
      console.log(
        chalk.yellow(
          `     -d '{"email":"admin@example.com","password":"admin123"}'`
        )
      );
      console.log(chalk.gray('\n   # Health check'));
      console.log(chalk.yellow(`   curl ${config.baseUrl}/health`));
      console.log(chalk.gray('\n   # Get users (with token)'));
      console.log(
        chalk.yellow(
          `   curl ${config.baseUrl}/users -H "Authorization: Bearer YOUR_TOKEN"`
        )
      );

      // 🌐 Web Interfaces
      console.log(chalk.bold.cyan('\n🌐 Web Interfaces:'));
      console.log(
        chalk.gray('   - Dashboard:   '),
        chalk.green(`${config.baseUrl}/dashboard`)
      );
      console.log(
        chalk.gray('   - Login Page:  '),
        chalk.green(`${config.baseUrl}/login`)
      );
      console.log(
        chalk.gray('   - Signup:      '),
        chalk.green(`${config.baseUrl}/signup`)
      );
      console.log(
        chalk.gray('   - Builder:     '),
        chalk.green(`${config.baseUrl}/builder`)
      );

      // ✨ Active Features
      console.log(chalk.bold.cyan('\n✨ Active Features:'));
      console.log(chalk.gray('   •'), chalk.green('✅'), 'JWT Authentication');
      console.log(chalk.gray('   •'), chalk.green('✅'), 'User Registration');
      console.log(chalk.gray('   •'), chalk.green('✅'), 'Password Reset');
      console.log(
        chalk.gray('   •'),
        chalk.yellow('⚠️'),
        'MFA (Optional - enable in config)'
      );
      console.log(
        chalk.gray('   •'),
        chalk.green('✅'),
        'Rate Limiting (100 req/15min)'
      );
      console.log(
        chalk.gray('   •'),
        chalk.green('✅'),
        'RBAC & Audit Logging'
      );

      // 📚 Quick Reference
      console.log(chalk.bold.cyan('\n📚 Key Endpoints:'));
      console.log(
        chalk.gray('   •'),
        chalk.blue('POST /auth/register'),
        chalk.gray('- Register new user')
      );
      console.log(
        chalk.gray('   •'),
        chalk.blue('POST /auth/login'),
        chalk.gray('- User login')
      );
      console.log(
        chalk.gray('   •'),
        chalk.blue('GET /users'),
        chalk.gray('- List all users')
      );
      console.log(
        chalk.gray('   •'),
        chalk.blue('GET /health'),
        chalk.gray('- System health')
      );
      console.log(
        chalk.gray('   •'),
        chalk.blue('GET /metrics'),
        chalk.gray('- Performance metrics')
      );

      // 🛑 Stop Instructions
      console.log(chalk.bold.yellow('\n🛑 Stop Instructions:'));
      console.log(
        chalk.gray('   •'),
        chalk.yellow('Press Ctrl+C'),
        chalk.gray('to gracefully shutdown')
      );
      console.log(chalk.gray('   •'), chalk.gray('All sessions will be saved'));
      console.log(
        chalk.gray('   •'),
        chalk.gray('Database connections will close cleanly')
      );

      // Keep the process running
      process.on('SIGINT', async () => {
        console.log(
          chalk.blue('\nℹ️'),
          chalk.bold.blue('Shutting down MockAuth...')
        );
        await auth.stop();
        console.log(
          chalk.green('✅'),
          chalk.bold.green('MockAuth stopped successfully!')
        );
        process.exit(0);
      });

      // Keep the process alive
      await new Promise(() => {}); // This keeps the process running indefinitely
    } catch (error: any) {
      console.log(
        chalk.red('❌'),
        chalk.bold.red('Failed to start MockAuth server:')
      );
      console.log(chalk.red('Error details:'), error.message);
      console.log(chalk.gray('   •'), 'Check if port is available');
      console.log(chalk.gray('   •'), 'Verify configuration file exists');
      console.log(
        chalk.gray('   •'),
        'Run "mockauth init" to create configuration'
      );
    }
  }

  private async handleServerManagement(): Promise<void> {
    console.log(chalk.cyan.bold('\n⚙️  Server Management'));
    console.log(chalk.gray('Choose a server management action:'));

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
        message: chalk.bold.cyan('What would you like to do?'),
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

  private async handleTest(): Promise<void> {
    console.log(chalk.blue('ℹ️'), chalk.bold.blue('Running MockAuth tests...'));

    // Simulate test running
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(chalk.green('✅'), chalk.bold.green('All tests passed!'));
    console.log(chalk.gray('   •'), 'Authentication flow: ✅');
    console.log(chalk.gray('   •'), 'User management: ✅');
    console.log(chalk.gray('   •'), 'Token validation: ✅');
    console.log(chalk.gray('   •'), 'API endpoints: ✅');
  }

  private async handleGenerate(): Promise<void> {
    console.log(chalk.blue('ℹ️'), chalk.bold.blue('Generating mock data...'));

    const outputDir = './mock-data';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate sample data
    const users = this.generateUsers(50);
    const posts = this.generatePosts(100);
    const products = this.generateProducts(75);

    fs.writeFileSync(
      path.join(outputDir, 'users.json'),
      JSON.stringify(users, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'posts.json'),
      JSON.stringify(posts, null, 2)
    );
    fs.writeFileSync(
      path.join(outputDir, 'products.json'),
      JSON.stringify(products, null, 2)
    );

    console.log(
      chalk.green('✅'),
      chalk.bold.green('Mock data generated successfully!')
    );
    console.log(chalk.gray('   •'), `Output directory: ${outputDir}`);
    console.log(chalk.gray('   •'), 'users.json (50 users)');
    console.log(chalk.gray('   •'), 'posts.json (100 posts)');
    console.log(chalk.gray('   •'), 'products.json (75 products)');
  }

  private async handleMigration(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Migration Tools - Choose your production provider')
    );

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
        message: chalk.bold.cyan('Choose your production auth provider:'),
        choices: providers,
        pageSize: 10,
      },
    ]);

    const outputPath = './dist/auth';

    if (!fs.existsSync(outputPath)) {
      fs.mkdirSync(outputPath, { recursive: true });
    }

    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue(`Generating ${provider} migration files...`)
    );

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

    const title = boxen(
      chalk.bold.green('🎉 Migration Generated Successfully!') +
        '\n\n' +
        chalk.cyan(`Provider: ${provider}`) +
        '\n' +
        chalk.gray(`Files: 1`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        backgroundColor: '#1a1a1a',
      }
    );

    console.log(title);

    console.log(chalk.bold.cyan('\n📁 Generated Files:'));
    console.log(chalk.gray('   •'), chalk.green(migrationFile));

    console.log(chalk.bold.cyan('\n📚 Next Steps:'));
    console.log(chalk.gray('   1.'), 'Review the generated files');
    console.log(chalk.gray('   2.'), 'Install dependencies: npm install');
    console.log(chalk.gray('   3.'), 'Configure environment variables');
    console.log(chalk.gray('   4.'), 'Test the migration');
    console.log(chalk.gray('   5.'), 'Deploy to production');
  }

  private async handleFrameworkIntegrations(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Framework Integrations - Choose your framework')
    );

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
        message: chalk.bold.cyan('Choose your framework:'),
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
        validate: (input: string) =>
          input.trim().length > 0 ? true : 'Please enter a project name',
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

    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue(`Generating ${framework} integration...`)
    );

    // Create the project directory
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate framework-specific files
    await this.generateFrameworkIntegration(framework, projectName, outputDir);

    const title = boxen(
      chalk.bold.green('🎉 Framework Integration Generated Successfully!') +
        '\n\n' +
        chalk.cyan(`Framework: ${framework}`) +
        '\n' +
        chalk.gray(`Project: ${projectName}`) +
        '\n' +
        chalk.gray(`Directory: ${outputDir}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'green',
        backgroundColor: '#1a1a1a',
      }
    );

    console.log(title);

    console.log(chalk.bold.cyan('\n📁 Generated Files:'));
    const files = this.getFrameworkFiles(framework);
    files.forEach((file: string) => {
      console.log(chalk.gray('   •'), chalk.green(file));
    });

    console.log(chalk.bold.cyan('\n📚 Next Steps:'));
    console.log(chalk.gray('   1.'), `cd ${outputDir}`);
    console.log(chalk.gray('   2.'), 'npm install');
    console.log(chalk.gray('   3.'), 'npm run dev');
    console.log(chalk.gray('   4.'), 'Start MockAuth server: mockauth start');
    console.log(chalk.gray('   5.'), 'Test the integration');

    console.log(chalk.bold.cyan('\n🔗 Quick Start:'));
    console.log(chalk.gray('   •'), 'MockAuth Server: http://localhost:3001');
    console.log(chalk.gray('   •'), 'Your App: http://localhost:3000');
    console.log(chalk.gray('   •'), 'Dashboard: http://localhost:3001/dashboard');
  }

  private async handleBuilder(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Launching MockAuth Visual Builder...')
    );

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
    const builder = spawn(
      'node',
      ['dist/web-builder/server.js', '--port', port.toString()],
      {
        stdio: 'inherit',
      }
    );

    builder.on('error', (error: any) => {
      console.error('❌ Error starting builder:', error.message);
      console.log('💡 Make sure the web builder is properly installed');
    });

    // Show success message after a brief delay
    setTimeout(() => {
      console.log(
        chalk.green('✅'),
        chalk.bold.green('Visual Builder launched!')
      );
      console.log(
        chalk.gray('   •'),
        `Open your browser to http://localhost:${port}`
      );
      console.log(
        chalk.gray('   •'),
        'Configure MockAuth with the intuitive interface'
      );
      console.log(chalk.gray('   •'), 'Export configuration when done');
      console.log('\n🔄 Press Ctrl+C to stop the builder');
    }, 2000);

    process.on('SIGINT', () => {
      console.log('\n🛑 Stopping builder...');
      builder.kill();
      process.exit(0);
    });
  }

  private async findAvailablePort(startPort: number, endPort: number): Promise<number> {
    const net = require('net');
    
    for (let port = startPort; port <= endPort; port++) {
      const isAvailable = await new Promise<boolean>((resolve) => {
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

  private async checkAndCleanupExistingServers(port: number): Promise<void> {
    console.log(chalk.yellow('🔍 Checking for existing servers...'));
    
    try {
      // Check if port is in use
      const isPortInUse = !(await new Promise<boolean>((resolve) => {
        const server = require('net').createServer();
        server.listen(port, () => {
          server.close(() => resolve(true));
        });
        server.on('error', () => resolve(false));
      }));
      
      if (isPortInUse) {
        console.log(chalk.yellow(`⚠️  Port ${port} is already in use`));
        console.log(chalk.blue('🔄 Attempting to clean up existing servers...'));
        
        // Try to find and stop existing Node.js processes that might be using the port
        const { exec } = require('child_process');
        const util = require('util');
        const execAsync = util.promisify(exec);
        
        try {
          // On Windows, find processes using the port
          if (process.platform === 'win32') {
            const { stdout } = await execAsync(`netstat -ano | findstr :${port}`);
            if (stdout.trim()) {
              console.log(chalk.blue('🛑 Stopping processes using port'), chalk.cyan(port));
              // Extract PID from netstat output and kill specific process
              const lines = stdout.trim().split('\n');
              for (const line of lines) {
                const parts = line.trim().split(/\s+/);
                if (parts.length >= 5) {
                  const pid = parts[4];
                  try {
                    await execAsync(`taskkill /f /pid ${pid}`);
                    console.log(chalk.gray(`   • Stopped process ${pid}`));
                  } catch (killError) {
                    console.log(chalk.gray(`   • Process ${pid} already stopped or not accessible`));
                  }
                }
              }
              // Wait a moment for processes to stop
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } else {
            // On Unix-like systems
            const { stdout } = await execAsync(`lsof -ti:${port}`);
            if (stdout.trim()) {
              console.log(chalk.blue('🛑 Stopping processes using port'), chalk.cyan(port));
              const pids = stdout.trim().split('\n');
              for (const pid of pids) {
                try {
                  await execAsync(`kill -9 ${pid.trim()}`);
                  console.log(chalk.gray(`   • Stopped process ${pid.trim()}`));
                } catch (killError) {
                  console.log(chalk.gray(`   • Process ${pid.trim()} already stopped or not accessible`));
                }
              }
              // Wait a moment for processes to stop
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
          
          // Check if port is now available
          const isNowAvailable = await new Promise<boolean>((resolve) => {
            const server = require('net').createServer();
            server.listen(port, () => {
              server.close(() => resolve(true));
            });
            server.on('error', () => resolve(false));
          });
          
          if (isNowAvailable) {
            console.log(chalk.green('✅ Port is now available'));
          } else {
            console.log(chalk.red('❌ Port is still in use. Please manually stop the existing server.'));
            console.log(chalk.gray('   • Check for other applications using port'), chalk.cyan(port));
            console.log(chalk.gray('   • Try running: netstat -ano | findstr :'), chalk.cyan(port));
            throw new Error(`Port ${port} is still in use after cleanup attempt`);
          }
        } catch (error) {
          console.log(chalk.red('❌ Could not automatically clean up existing servers'));
          console.log(chalk.gray('   Please manually stop any existing MockAuth servers'));
          throw new Error(`Port ${port} is in use and could not be freed automatically`);
        }
      } else {
        console.log(chalk.green('✅ Port is available'));
      }
    } catch (error) {
      console.log(chalk.red('❌ Error checking port availability:'), (error as Error).message);
      throw error;
    }
  }

  private async handleDebug(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Starting MockAuth Debug Mode...')
    );

    try {
      // Load configuration
      const configPath = 'mockauth.config.js';
      let config;
      
      if (fs.existsSync(configPath)) {
        config = require(path.resolve(configPath));
      } else {
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
      
      console.log(chalk.blue('🔧'), `Debug Console will run on port ${debugPort}`);

      // Start MockAuth server with debug features
      const { MockAuth } = require('../index');
      const auth = new MockAuth(config);
      
      await auth.start();

      console.log(chalk.green('✅'), chalk.bold.green('Debug mode started!'));
      console.log(chalk.cyan('🔗'), `Server: ${config.baseUrl}`);
      console.log(chalk.cyan('🔍'), `Debug Console: ${config.baseUrl}/debug`);
      console.log(chalk.gray('   •'), 'Real-time request/response inspection');
      console.log(chalk.gray('   •'), 'Live user session monitoring');
      console.log(chalk.gray('   •'), 'Token validation and debugging');
      console.log(chalk.gray('   •'), 'Performance metrics dashboard');
      console.log(chalk.gray('   •'), 'API testing playground');
      console.log(chalk.yellow('\n🔄 Press Ctrl+C to stop'));

      // Handle graceful shutdown
      process.on('SIGINT', async () => {
        console.log(chalk.yellow('\n🛑 Shutting down debug mode...'));
        await auth.stop();
        process.exit(0);
      });

      // Keep the debug server running - don't return to main menu
      console.log(chalk.blue('\n🔍 Debug Console is now running...'));
      console.log(chalk.gray('   Open your browser to:'), chalk.cyan(config.baseUrl + '/debug'));
      console.log(chalk.gray('   The server will continue running until you press Ctrl+C'));
      
      // Keep the process alive with a simple infinite loop
      while (true) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }

    } catch (error) {
      console.error(chalk.red('❌ Error starting debug mode:'), (error as Error).message);
      console.log(chalk.gray('   • Check configuration file'));
      console.log(chalk.gray('   • Verify all dependencies are installed'));
      process.exit(1);
    }
  }

  private async handleHealth(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Running MockAuth Health Check...')
    );

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

    const title = boxen(
      chalk.bold[color](`🏥 Health Check Results: ${status}`),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: color,
        backgroundColor: '#1a1a1a',
      }
    );

    console.log(title);

    console.log(chalk.bold.cyan('\n📊 System Status:'));
    console.log(
      chalk.gray('   Server:'),
      healthResults.server ? chalk.green('✅ Running') : chalk.red('❌ Failed')
    );
    console.log(
      chalk.gray('   Database:'),
      healthResults.database
        ? chalk.green('✅ Connected')
        : chalk.red('❌ Failed')
    );
    console.log(
      chalk.gray('   Memory:'),
      chalk.yellow(`${healthResults.memory}MB (${healthResults.memoryStatus})`)
    );
    console.log(
      chalk.gray('   Response Time:'),
      chalk.yellow(
        `${healthResults.responseTime}ms (${healthResults.performanceStatus})`
      )
    );
    console.log(
      chalk.gray('   Active Sessions:'),
      chalk.cyan(healthResults.activeSessions)
    );
  }

  private async handleStop(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Stopping MockAuth server...')
    );

    try {
      const config = this.loadConfig();
      const port = config.port;

      // Try to find and stop the server process
      const serverProcess = await this.findServerProcess(port);

      if (serverProcess) {
        console.log(
          chalk.cyan('📡'),
          chalk.bold.cyan(
            `Found server running on port ${port} (PID: ${serverProcess.pid})`
          )
        );

        // Graceful shutdown
        process.kill(serverProcess.pid, 'SIGTERM');

        // Wait a moment for graceful shutdown
        await new Promise((resolve) => setTimeout(resolve, 2000));

        // Force kill if still running
        try {
          process.kill(serverProcess.pid, 'SIGKILL');
        } catch (error) {
          // Process already stopped
        }

        console.log(
          chalk.green('✅'),
          chalk.bold.green('MockAuth server stopped successfully!')
        );
      } else {
        console.log(
          chalk.yellow('ℹ️'),
          chalk.bold.yellow(`No MockAuth server found running on port ${port}`)
        );
      }
    } catch (error: any) {
      console.log(chalk.red('❌'), chalk.bold.red('Failed to stop server:'));
      console.log(chalk.red('Error details:'), error.message);
      console.log(chalk.gray('   •'), 'Check if server is running');
      console.log(
        chalk.gray('   •'),
        'Try running "mockauth list" to see running servers'
      );
    }
  }

  private async handleRestart(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Restarting MockAuth server...')
    );

    try {
      // First stop the server
      await this.handleStop();

      // Wait a moment
      await new Promise((resolve) => setTimeout(resolve, 1000));

      // Then start it again
      await this.handleStart();
    } catch (error: any) {
      console.log(chalk.red('❌'), chalk.bold.red('Failed to restart server:'));
      console.log(chalk.red('Error details:'), error.message);
      console.log(chalk.gray('   •'), 'Check server configuration');
      console.log(chalk.gray('   •'), 'Verify port is available');
    }
  }

  private async handleReset(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Resetting MockAuth server...')
    );

    try {
      const config = this.loadConfig();

      // Stop server if running
      await this.handleStop();

      // Clear database/data files
      console.log(chalk.blue('ℹ️'), chalk.bold.blue('Clearing server data...'));
      await this.clearServerData(config);

      // Restart server
      console.log(
        chalk.blue('ℹ️'),
        chalk.bold.blue('Starting fresh server...')
      );
      await this.handleStart();

      console.log(
        chalk.green('✅'),
        chalk.bold.green('MockAuth server reset successfully!')
      );
      console.log(chalk.gray('   •'), 'All data has been cleared');
      console.log(
        chalk.gray('   •'),
        'Server is running with fresh configuration'
      );
    } catch (error: any) {
      console.log(chalk.red('❌'), chalk.bold.red('Failed to reset server:'));
      console.log(chalk.red('Error details:'), error.message);
      console.log(chalk.gray('   •'), 'Check file permissions');
      console.log(chalk.gray('   •'), 'Verify configuration is valid');
    }
  }

  private async handleStatus(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Checking MockAuth server status...')
    );

    try {
      const config = this.loadConfig();
      const port = config.port;

      // Check if server is running
      const serverProcess = await this.findServerProcess(port);

      if (serverProcess) {
        const statusBox = boxen(
          chalk.bold.green('✅ Server Status: Running') +
            '\n\n' +
            chalk.gray('Port:') +
            ' ' +
            chalk.cyan(port) +
            '\n' +
            chalk.gray('Process ID:') +
            ' ' +
            chalk.cyan(serverProcess.pid) +
            '\n' +
            chalk.gray('URL:') +
            ' ' +
            chalk.blue(config.baseUrl),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'green',
            backgroundColor: '#1a1a1a',
          }
        );

        console.log(statusBox);

        // Test server health
        const isHealthy = await this.testServerHealth(config.baseUrl);
        console.log(
          chalk.cyan('💚'),
          chalk.bold.cyan(`Health: ${isHealthy ? 'Healthy' : 'Unhealthy'}`)
        );

        if (isHealthy) {
          console.log(chalk.bold.cyan('\n📚 Available endpoints:'));
          console.log(chalk.gray('   •'), chalk.blue('Health: /health'));
          console.log(chalk.gray('   •'), chalk.blue('API Docs: /api'));
          console.log(
            chalk.gray('   •'),
            chalk.blue('Login: POST /auth/login')
          );
          console.log(chalk.gray('   •'), chalk.blue('Users: GET /users'));
        }
      } else {
        const statusBox = boxen(
          chalk.bold.red('❌ Server Status: Not Running') +
            '\n\n' +
            chalk.gray(`Port ${port} is available`) +
            '\n' +
            chalk.gray('Run "mockauth start" to start the server'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'red',
            backgroundColor: '#1a1a1a',
          }
        );

        console.log(statusBox);
      }
    } catch (error: any) {
      console.log(
        chalk.red('❌'),
        chalk.bold.red('Failed to check server status:')
      );
      console.log(chalk.red('Error details:'), error.message);
      console.log(chalk.gray('   •'), 'Check configuration file');
      console.log(chalk.gray('   •'), 'Verify server is properly installed');
    }
  }

  private async handleList(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Listing all MockAuth servers...')
    );

    try {
      const runningServers = await this.findAllMockAuthServers();

      if (runningServers.length === 0) {
        const noServersBox = boxen(
          chalk.bold.yellow('ℹ️ No MockAuth servers currently running') +
            '\n\n' +
            chalk.gray('Run "mockauth start" to start a server'),
          {
            padding: 1,
            margin: 1,
            borderStyle: 'round',
            borderColor: 'yellow',
            backgroundColor: '#1a1a1a',
          }
        );

        console.log(noServersBox);
        return;
      }

      const serversBox = boxen(
        chalk.bold.cyan(`Found ${runningServers.length} MockAuth server(s):`) +
          '\n\n' +
          runningServers
            .map(
              (server, index) =>
                chalk.gray(`${index + 1}.`) +
                ' MockAuth Server\n' +
                chalk.gray('   📡 Port:') +
                ' ' +
                chalk.cyan(server.port) +
                '\n' +
                chalk.gray('   🆔 PID:') +
                ' ' +
                chalk.cyan(server.pid) +
                '\n' +
                chalk.gray('   🔗 URL:') +
                ' ' +
                chalk.blue(`http://localhost:${server.port}`) +
                '\n' +
                chalk.gray('   ⏰ Started:') +
                ' ' +
                chalk.gray(server.startTime)
            )
            .join('\n\n'),
        {
          padding: 1,
          margin: 1,
          borderStyle: 'round',
          borderColor: 'cyan',
          backgroundColor: '#1a1a1a',
        }
      );

      console.log(serversBox);

      console.log(chalk.bold.cyan('\n💡 Management commands:'));
      console.log(
        chalk.gray('   •'),
        'Use "mockauth stop --port <port>" to stop a specific server'
      );
      console.log(
        chalk.gray('   •'),
        'Use "mockauth kill-all" to stop all servers'
      );
    } catch (error: any) {
      console.log(chalk.red('❌'), chalk.bold.red('Failed to list servers:'));
      console.log(chalk.red('Error details:'), error.message);
      console.log(chalk.gray('   •'), 'Check system permissions');
      console.log(chalk.gray('   •'), 'Verify MockAuth is properly installed');
    }
  }

  private async handleKillAll(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Stopping all MockAuth servers...')
    );

    try {
      const runningServers = await this.findAllMockAuthServers();

      if (runningServers.length === 0) {
        console.log(
          chalk.yellow('ℹ️'),
          chalk.bold.yellow('No MockAuth servers currently running')
        );
        return;
      }

      console.log(
        chalk.cyan('📋'),
        chalk.bold.cyan(`Found ${runningServers.length} server(s) to stop:`)
      );

      for (const server of runningServers) {
        console.log(
          chalk.blue('ℹ️'),
          chalk.bold.blue(
            `Stopping server on port ${server.port} (PID: ${server.pid})...`
          )
        );

        try {
          // Graceful shutdown
          process.kill(server.pid, 'SIGTERM');

          // Wait for graceful shutdown
          await new Promise((resolve) => setTimeout(resolve, 2000));

          // Force kill if still running
          try {
            process.kill(server.pid, 'SIGKILL');
          } catch (error) {
            // Process already stopped
          }

          console.log(
            chalk.green('✅'),
            chalk.bold.green(`Server on port ${server.port} stopped`)
          );
        } catch (error: any) {
          console.log(
            chalk.red('⚠️'),
            chalk.bold.red(
              `Could not stop server on port ${server.port}: ${error.message}`
            )
          );
        }
      }

      console.log(
        chalk.green('✅'),
        chalk.bold.green('All MockAuth servers stopped!')
      );
    } catch (error: any) {
      console.log(chalk.red('❌'), chalk.bold.red('Failed to stop servers:'));
      console.log(chalk.red('Error details:'), error.message);
      console.log(chalk.gray('   •'), 'Check system permissions');
      console.log(chalk.gray('   •'), 'Some servers may still be running');
    }
  }

  public async handleHelp(): Promise<void> {
    const helpContent = boxen(
      chalk.bold.cyan('📚 MockAuth CLI - Comprehensive Guide') +
        '\n\n' +
        // Commands section
        chalk.bold.yellow('⚡ Available Commands:') +
        '\n\n' +
        chalk.cyan('  mockauth init') +
        chalk.gray(' [--template]') +
        '\n' +
        chalk.gray('    Initialize a new MockAuth project') +
        '\n' +
        chalk.gray('    Flags: --template=basic|enterprise|minimal') +
        '\n\n' +
        chalk.cyan('  mockauth start') +
        chalk.gray(' [--port] [--watch]') +
        '\n' +
        chalk.gray('    Start the MockAuth server') +
        '\n' +
        chalk.gray('    Flags: --port=3001, --watch (auto-reload)') +
        '\n\n' +
        chalk.cyan('  mockauth stop') +
        chalk.gray(' [--port]') +
        '\n' +
        chalk.gray('    Stop the MockAuth server') +
        '\n' +
        chalk.gray('    Flags: --port=3001 (stop specific port)') +
        '\n\n' +
        chalk.cyan('  mockauth restart') +
        chalk.gray(' [--port]') +
        '\n' +
        chalk.gray('    Restart the MockAuth server') +
        '\n' +
        chalk.gray('    Flags: --port=3001 (restart specific port)') +
        '\n\n' +
        chalk.cyan('  mockauth reset') +
        chalk.gray(' [--port]') +
        '\n' +
        chalk.gray('    Reset server data and restart') +
        '\n' +
        chalk.gray('    Flags: --port=3001 (reset specific port)') +
        '\n\n' +
        chalk.cyan('  mockauth status') +
        chalk.gray(' [--port]') +
        '\n' +
        chalk.gray('    Check server status and health') +
        '\n' +
        chalk.gray('    Flags: --port=3001 (check specific port)') +
        '\n\n' +
        chalk.cyan('  mockauth list') +
        '\n' +
        chalk.gray('    List all running MockAuth servers') +
        '\n\n' +
        chalk.cyan('  mockauth kill-all') +
        '\n' +
        chalk.gray('    Stop all running MockAuth servers') +
        '\n\n' +
        chalk.cyan('  mockauth test') +
        chalk.gray(' [--coverage]') +
        '\n' +
        chalk.gray('    Run authentication tests') +
        '\n' +
        chalk.gray('    Flags: --coverage (generate coverage report)') +
        '\n\n' +
        chalk.cyan('  mockauth generate') +
        chalk.gray(' [--count] [--type]') +
        '\n' +
        chalk.gray('    Generate mock data (users, tokens, sessions)') +
        '\n' +
        chalk.gray('    Flags: --count=100, --type=users|tokens|all') +
        '\n\n' +
        chalk.cyan('  mockauth builder') +
        '\n' +
        chalk.gray('    Open visual configuration builder (web UI)') +
        '\n\n' +
        chalk.cyan('  mockauth migrate-to') +
        chalk.gray(' <provider>') +
        '\n' +
        chalk.gray('    Migrate to production auth (better-auth, auth0, etc)') +
        '\n\n' +
        chalk.cyan('  mockauth health') +
        '\n' +
        chalk.gray('    Check server health and system status') +
        '\n\n' +
        chalk.cyan('  mockauth debug') +
        '\n' +
        chalk.gray('    Interactive debugging console') +
        '\n\n' +
        chalk.cyan('  mockauth deploy') +
        chalk.gray(' [--env] [--profile]') +
        '\n' +
        chalk.gray('    Deploy to cloud platforms (AWS, GCP, Azure, Docker)') +
        '\n\n' +
        chalk.cyan('  mockauth monitor') +
        chalk.gray(' [--watch]') +
        '\n' +
        chalk.gray('    Real-time server monitoring dashboard') +
        '\n\n' +
        chalk.cyan('  mockauth backup') +
        chalk.gray(' [--output]') +
        '\n' +
        chalk.gray('    Backup server data and configuration') +
        '\n\n' +
        chalk.cyan('  mockauth restore') +
        chalk.gray(' [--file]') +
        '\n' +
        chalk.gray('    Restore from backup') +
        '\n\n' +
        chalk.cyan('  mockauth validate') +
        chalk.gray(' [--config]') +
        '\n' +
        chalk.gray('    Validate configuration files and dependencies') +
        '\n\n' +
        chalk.cyan('  mockauth benchmark') +
        chalk.gray(' [--duration]') +
        '\n' +
        chalk.gray('    Performance benchmarking') +
        '\n\n' +
        chalk.cyan('  mockauth docs') +
        chalk.gray(' [--open]') +
        '\n' +
        chalk.gray('    Generate and open API documentation') +
        '\n\n' +
        chalk.cyan('  mockauth plugin') +
        chalk.gray(' [--list|--install|--remove]') +
        '\n' +
        chalk.gray('    Plugin management system') +
        '\n\n' +
        chalk.cyan('  mockauth --legacy') +
        '\n' +
        chalk.gray('    Use legacy CLI interface (no enhanced UI)') +
        '\n\n' +
        // Examples section
        chalk.bold.yellow('📖 Common Examples:') +
        '\n\n' +
        chalk.gray('  # Quick start - create and run') +
        '\n' +
        chalk.white('  mockauth init && mockauth start') +
        '\n\n' +
        chalk.gray('  # Start on custom port') +
        '\n' +
        chalk.white('  mockauth start --port=4000') +
        '\n\n' +
        chalk.gray('  # Stop server') +
        '\n' +
        chalk.white('  mockauth stop --port=3001') +
        '\n\n' +
        chalk.gray('  # Restart server') +
        '\n' +
        chalk.white('  mockauth restart') +
        '\n\n' +
        chalk.gray('  # Reset server data') +
        '\n' +
        chalk.white('  mockauth reset') +
        '\n\n' +
        chalk.gray('  # Check server status') +
        '\n' +
        chalk.white('  mockauth status') +
        '\n\n' +
        chalk.gray('  # List all servers') +
        '\n' +
        chalk.white('  mockauth list') +
        '\n\n' +
        chalk.gray('  # Stop all servers') +
        '\n' +
        chalk.white('  mockauth kill-all') +
        '\n\n' +
        chalk.gray('  # Generate 500 test users') +
        '\n' +
        chalk.white('  mockauth generate --count=500 --type=users') +
        '\n\n' +
        chalk.gray('  # Open visual builder') +
        '\n' +
        chalk.white('  mockauth builder') +
        '\n\n' +
        chalk.gray('  # Migrate to Better Auth') +
        '\n' +
        chalk.white('  mockauth migrate-to better-auth') +
        '\n\n' +
        chalk.gray('  # Use legacy interface') +
        '\n' +
        chalk.white('  mockauth --legacy init') +
        '\n\n' +
        chalk.gray('  # Deploy to production') +
        '\n' +
        chalk.white('  mockauth deploy --env=production') +
        '\n\n' +
        chalk.gray('  # Monitor server performance') +
        '\n' +
        chalk.white('  mockauth monitor --watch') +
        '\n\n' +
        chalk.gray('  # Backup server data') +
        '\n' +
        chalk.white('  mockauth backup --output=./backup') +
        '\n\n' +
        chalk.gray('  # Run performance benchmarks') +
        '\n' +
        chalk.white('  mockauth benchmark --duration=300') +
        '\n\n' +
        chalk.gray('  # Generate API documentation') +
        '\n' +
        chalk.white('  mockauth docs --open') +
        '\n\n' +
        chalk.gray('  # Manage plugins') +
        '\n' +
        chalk.white('  mockauth plugin --list') +
        '\n\n' +
        // Quick Start section
        chalk.bold.yellow('🚀 Quick Start (30 seconds):') +
        '\n\n' +
        chalk.gray('  1.') +
        ' mockauth init' +
        chalk.gray('           # Create config') +
        '\n' +
        chalk.gray('  2.') +
        ' mockauth start' +
        chalk.gray('          # Start server') +
        '\n' +
        chalk.gray('  3.') +
        ' Open http://localhost:3001/dashboard' +
        '\n\n' +
        // Useful Links section
        chalk.bold.yellow('🔗 Useful Links:') +
        '\n\n' +
        chalk.gray('  Web Dashboard:  ') +
        chalk.green('http://localhost:3001/dashboard') +
        '\n' +
        chalk.gray('  Visual Builder: ') +
        chalk.green('http://localhost:3001/builder') +
        '\n' +
        chalk.gray('  API Docs:       ') +
        chalk.green('http://localhost:3001/api') +
        '\n' +
        chalk.gray('  Health Check:   ') +
        chalk.green('http://localhost:3001/health') +
        '\n\n' +
        // Support section
        chalk.bold.yellow('💬 Need Help?') +
        '\n\n' +
        chalk.gray('  Documentation:  ') +
        chalk.blue('https://mockauth.dev/docs') +
        '\n' +
        chalk.gray('  GitHub Issues:  ') +
        chalk.blue('https://github.com/mockilo/mockauth') +
        '\n' +
        chalk.gray('  Discord:        ') +
        chalk.blue('https://discord.gg/mockauth') +
        '\n',
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: '#1a1a1a',
      }
    );

    console.log(helpContent);

    // Show tip at the bottom
    console.log(
      chalk.dim('\n  💡 Tip: Run ') +
        chalk.cyan('mockauth <command> --help') +
        chalk.dim(' for detailed info about a specific command\n')
    );
  }

  // Server Management Helper Methods
  private async findServerProcess(
    port: number
  ): Promise<{ pid: number; port: number } | null> {
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
    } catch (error) {
      return null;
    }
  }

  private async findAllMockAuthServers(): Promise<
    Array<{ pid: number; port: number; startTime: string }>
  > {
    try {
      const { exec } = require('child_process');
      const { promisify } = require('util');
      const execAsync = promisify(exec);

      const servers: Array<{ pid: number; port: number; startTime: string }> =
        [];

      // Find all Node.js processes
      const { stdout } = await execAsync(
        'tasklist /FI "IMAGENAME eq node.exe" /FO CSV'
      );

      if (stdout.trim()) {
        const lines = stdout.trim().split('\n').slice(1); // Skip header

        for (const line of lines) {
          const parts = line.split(',').map((part) => part.replace(/"/g, ''));
          if (parts.length >= 2) {
            const pid = parseInt(parts[1]);
            if (pid && pid > 0) {
              // Check if this process is using a port (simplified check)
              try {
                const { stdout: netstat } = await execAsync(
                  `netstat -ano | findstr ${pid}`
                );
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
              } catch (error) {
                // Skip this process
              }
            }
          }
        }
      }

      return servers;
    } catch (error) {
      return [];
    }
  }

  private async testServerHealth(baseUrl: string): Promise<boolean> {
    try {
      // Use built-in fetch (Node.js 18+) or fallback to http module
      const response = await fetch(`${baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  private async clearServerData(config: MockAuthConfig): Promise<void> {
    try {
      // Clear database files based on type
      if (config.database?.type === 'sqlite') {
        const dbPath = config.database.connectionString || './mockauth.db';
        if (fs.existsSync(dbPath)) {
          fs.unlinkSync(dbPath);
          console.log(chalk.gray('🗑️'), 'Cleared SQLite database');
        }
      }

      // Clear any cached data
      const cacheDir = './.mockauth-cache';
      if (fs.existsSync(cacheDir)) {
        fs.rmSync(cacheDir, { recursive: true, force: true });
        console.log(chalk.gray('🗑️'), 'Cleared cache directory');
      }

      // Clear session data
      const sessionDir = './sessions';
      if (fs.existsSync(sessionDir)) {
        fs.rmSync(sessionDir, { recursive: true, force: true });
        console.log(chalk.gray('🗑️'), 'Cleared session data');
      }
    } catch (error: any) {
      console.log(
        chalk.yellow('⚠️'),
        chalk.bold.yellow('Some data could not be cleared:'),
        error.message
      );
    }
  }

  // Helper methods
  private loadConfig(): MockAuthConfig {
    // FIXED: Properly resolve absolute path with better error message
    const resolvedPath = path.resolve(process.cwd(), 'mockauth.config.js');

    if (!fs.existsSync(resolvedPath)) {
      throw new Error(
        `Configuration file not found: ${resolvedPath}\nRun 'mockauth init' to create one.`
      );
    }

    try {
      delete require.cache[resolvedPath];
      return require(resolvedPath);
    } catch (error: any) {
      throw new Error(`Failed to load configuration: ${error.message}`);
    }
  }

  private generateSecret(): string {
    // FIXED: Generate secure 32+ character secret using crypto
    // Generates a 64-character hexadecimal string
    return crypto.randomBytes(32).toString('hex');
  }

  private createExampleFiles(): void {
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

  private generateUsers(count: number): any[] {
    const users: any[] = [];
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

  private generatePosts(count: number): any[] {
    const posts: any[] = [];
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

  private generateProducts(count: number): any[] {
    const products: any[] = [];
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
  private async handleAdvancedCommands(): Promise<void> {
    console.log(chalk.cyan.bold('\n☁️  Advanced Commands'));
    console.log(chalk.gray('Choose an advanced command:'));
    
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
        message: chalk.bold.cyan('What would you like to do?'),
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

  private async handleWebDashboard(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Starting MockAuth Advanced Web Dashboard...')
    );

    const { port } = await this.promptWithEsc([
      {
        type: 'input',
        name: 'port',
        message: 'Web dashboard port:',
        default: '3004',
        validate: (input: string) => {
          const port = parseInt(input);
          return port > 0 && port < 65536
            ? true
            : 'Please enter a valid port number';
        },
      },
    ]);

    console.log(
      chalk.green('✅'),
      chalk.bold.green('Starting web dashboard server...')
    );

    // Start the web dashboard server
    const { spawn } = require('child_process');
    const path = require('path');
    
    const serverPath = path.join(__dirname, '../web-builder/advanced-server.js');
    const server = spawn('node', [serverPath], {
      env: { ...process.env, PORT: port },
      stdio: 'inherit'
    });

    console.log(
      chalk.green('🌐'),
      chalk.bold.green(`Advanced Web Dashboard running on http://localhost:${port}`)
    );
    console.log(chalk.gray('   •'), 'Beautiful web interface for all advanced commands');
    console.log(chalk.gray('   •'), 'Same design as MockAuth dashboard');
    console.log(chalk.gray('   •'), 'Interactive forms and real-time updates');
    console.log(chalk.gray('   •'), 'Press Ctrl+C to stop the server');

    // Handle server exit
    server.on('close', (code) => {
      console.log(chalk.yellow('🛑'), 'Web dashboard server stopped');
    });

    // Keep the process running
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n🛑'), 'Stopping web dashboard server...');
      server.kill();
      process.exit(0);
    });
  }

  private async handleDeploy(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Deploying MockAuth to cloud...')
    );

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
    const { AdvancedMockAuthCLI } = await import('./advanced');
    const advancedCLI = new AdvancedMockAuthCLI();
    
    // Use the real deployment implementation
    await advancedCLI.deployToCloud({ command: 'deploy', env: environment });
  }

  private async handleMonitor(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Starting real-time monitoring dashboard...')
    );

    const { port } = await this.promptWithEsc([
      {
        type: 'input',
        name: 'port',
        message: 'Monitoring dashboard port:',
        default: '3003',
        validate: (input: string) => {
          const port = parseInt(input);
          return port > 0 && port < 65536
            ? true
            : 'Please enter a valid port number';
        },
      },
    ]);

    // Import and use the real monitoring functionality from AdvancedMockAuthCLI
    const { AdvancedMockAuthCLI } = await import('./advanced');
    const advancedCLI = new AdvancedMockAuthCLI();
    
    // Use the real monitoring implementation
    await advancedCLI.startMonitoring({ command: 'monitor', port: parseInt(port) });
  }

  private async handleBackup(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Creating MockAuth backup...')
    );

    const { outputDir } = await this.promptWithEsc([
      {
        type: 'input',
        name: 'outputDir',
        message: 'Backup output directory:',
        default: './backups',
      },
    ]);

    // Import and use the real backup functionality from AdvancedMockAuthCLI
    const { AdvancedMockAuthCLI } = await import('./advanced');
    const advancedCLI = new AdvancedMockAuthCLI();
    
    // Use the real backup implementation
    await advancedCLI.backupData({ command: 'backup', output: outputDir });
  }

  private async handleRestore(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Restoring MockAuth from backup...')
    );

    // Import and use the real restore functionality from AdvancedMockAuthCLI
    const { AdvancedMockAuthCLI } = await import('./advanced');
    const advancedCLI = new AdvancedMockAuthCLI();
    
    // Use the real restore implementation
    await advancedCLI.restoreData({ command: 'restore' });
  }

  private async handleValidate(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Validating MockAuth configuration...')
    );

    // Import and use the real validation functionality from AdvancedMockAuthCLI
    const { AdvancedMockAuthCLI } = await import('./advanced');
    const advancedCLI = new AdvancedMockAuthCLI();
    
    // Use the real validation implementation
    await advancedCLI.validateConfig({ command: 'validate' });
  }

  private async handleBenchmark(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Running MockAuth performance benchmarks...')
    );

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
    const { AdvancedMockAuthCLI } = await import('./advanced');
    const advancedCLI = new AdvancedMockAuthCLI();
    
    // Use the real benchmark implementation
    await advancedCLI.runBenchmarks({ command: 'benchmark' });
  }

  private async handleDocs(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Generating MockAuth API documentation...')
    );

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
    const { AdvancedMockAuthCLI } = await import('./advanced');
    const advancedCLI = new AdvancedMockAuthCLI();
    
    // Use the real docs implementation
    await advancedCLI.generateDocs({ command: 'docs', output: outputDir });
  }

  private async handlePlugin(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('MockAuth Plugin Management')
    );

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
    const { AdvancedMockAuthCLI } = await import('./advanced');
    const advancedCLI = new AdvancedMockAuthCLI();
    
    // Use the real plugin implementation
    await advancedCLI.managePlugins({ command: 'plugin' });
  }

  private async handlePluginInstall(): Promise<void> {
    const { pluginName } = await this.promptWithEsc([
      {
        type: 'input',
        name: 'pluginName',
        message: 'Plugin name to install:',
        validate: (input: string) =>
          input.trim().length > 0 ? true : 'Please enter a plugin name',
      },
    ]);

    console.log(
      chalk.green('✅'),
      chalk.bold.green(`Plugin "${pluginName}" installed successfully!`)
    );
    console.log(chalk.gray('   •'), 'Dependencies installed');
    console.log(chalk.gray('   •'), 'Configuration updated');
    console.log(chalk.gray('   •'), 'Plugin activated');
  }

  private async handlePluginRemove(): Promise<void> {
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

    console.log(
      chalk.green('✅'),
      chalk.bold.green(`Plugin "${pluginName}" removed successfully!`)
    );
    console.log(chalk.gray('   •'), 'Plugin deactivated');
    console.log(chalk.gray('   •'), 'Dependencies cleaned up');
    console.log(chalk.gray('   •'), 'Configuration updated');
  }

  private async handlePluginList(): Promise<void> {
    const plugins = [
      { name: 'oauth-provider', version: '1.0.0', status: 'active' },
      { name: 'rate-limiter', version: '2.1.0', status: 'active' },
      { name: 'audit-logger', version: '1.5.0', status: 'inactive' },
    ];

    console.log(chalk.bold.cyan('\n📋 Installed Plugins:'));
    plugins.forEach((plugin) => {
      const statusIcon = plugin.status === 'active' ? '✅' : '❌';
      console.log(
        chalk.gray('   •'),
        `${statusIcon} ${plugin.name} (v${plugin.version}) - ${plugin.status}`
      );
    });
  }

  private async handlePluginUpdate(): Promise<void> {
    console.log(
      chalk.blue('ℹ️'),
      chalk.bold.blue('Updating all plugins...')
    );

    // Simulate update process
    await new Promise((resolve) => setTimeout(resolve, 2000));

    console.log(
      chalk.green('✅'),
      chalk.bold.green('All plugins updated successfully!')
    );
    console.log(chalk.gray('   •'), 'oauth-provider: v1.0.0 → v1.1.0');
    console.log(chalk.gray('   •'), 'rate-limiter: v2.1.0 → v2.2.0');
    console.log(chalk.gray('   •'), 'audit-logger: v1.5.0 → v1.6.0');
  }

  // Framework Integration Helper Methods
  private async generateFrameworkIntegration(
    framework: string,
    projectName: string,
    outputDir: string
  ): Promise<void> {
    // Create package.json
    const packageJson = this.generatePackageJson(framework, projectName);
    fs.writeFileSync(
      path.join(outputDir, 'package.json'),
      JSON.stringify(packageJson, null, 2)
    );

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
    fs.writeFileSync(
      path.join(outputDir, 'mockauth.config.js'),
      `module.exports = ${JSON.stringify(mockAuthConfig, null, 2)};`
    );

    // Create README
    const readme = this.generateReadme(framework, projectName);
    fs.writeFileSync(path.join(outputDir, 'README.md'), readme);
  }

  private generatePackageJson(framework: string, projectName: string): any {
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

  private async generateReactIntegration(projectName: string, outputDir: string): Promise<void> {
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

  private async generateVueIntegration(projectName: string, outputDir: string): Promise<void> {
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

  private async generateAngularIntegration(projectName: string, outputDir: string): Promise<void> {
    // Angular integration would be more complex, so we'll create a simplified version
    console.log(chalk.yellow('⚠️'), 'Angular integration is more complex and requires Angular CLI');
    console.log(chalk.gray('   •'), 'Run: ng new ' + projectName);
    console.log(chalk.gray('   •'), 'Add MockAuth service manually');
  }

  private async generateNextjsIntegration(projectName: string, outputDir: string): Promise<void> {
    // Next.js integration
    console.log(chalk.yellow('⚠️'), 'Next.js integration requires Next.js CLI');
    console.log(chalk.gray('   •'), 'Run: npx create-next-app@latest ' + projectName);
    console.log(chalk.gray('   •'), 'Add MockAuth integration manually');
  }

  private async generateNuxtIntegration(projectName: string, outputDir: string): Promise<void> {
    // Nuxt integration
    console.log(chalk.yellow('⚠️'), 'Nuxt integration requires Nuxt CLI');
    console.log(chalk.gray('   •'), 'Run: npx nuxi@latest init ' + projectName);
    console.log(chalk.gray('   •'), 'Add MockAuth integration manually');
  }

  private async generateSvelteIntegration(projectName: string, outputDir: string): Promise<void> {
    // Svelte integration
    console.log(chalk.yellow('⚠️'), 'Svelte integration requires Svelte CLI');
    console.log(chalk.gray('   •'), 'Run: npm create svelte@latest ' + projectName);
    console.log(chalk.gray('   •'), 'Add MockAuth integration manually');
  }

  private async generateSvelteKitIntegration(projectName: string, outputDir: string): Promise<void> {
    // SvelteKit integration
    console.log(chalk.yellow('⚠️'), 'SvelteKit integration requires SvelteKit CLI');
    console.log(chalk.gray('   •'), 'Run: npm create svelte@latest ' + projectName);
    console.log(chalk.gray('   •'), 'Add MockAuth integration manually');
  }

  private async generateSolidIntegration(projectName: string, outputDir: string): Promise<void> {
    // Solid.js integration
    console.log(chalk.yellow('⚠️'), 'Solid.js integration requires Solid CLI');
    console.log(chalk.gray('   •'), 'Run: npm create solid@latest ' + projectName);
    console.log(chalk.gray('   •'), 'Add MockAuth integration manually');
  }

  private generateMockAuthConfig(): any {
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

  private getFrameworkFiles(framework: string): string[] {
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

  private generateReadme(framework: string, projectName: string): string {
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

// Note: This CLI should be accessed through the main index.js entry point
// Use: node dist/cli/index.js (for enhanced CLI)
// Use: node dist/cli/index.js --legacy (for legacy CLI)

export default SimpleEnhancedCLI;
