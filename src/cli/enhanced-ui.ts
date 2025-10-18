// Enhanced CLI UI/UX Module
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import boxen from 'boxen';
import gradient from 'gradient-string';
import figlet from 'figlet';
import cliProgress from 'cli-progress';
import * as readline from 'readline';

export class EnhancedCLI {
  private static instance: EnhancedCLI;
  private rl: readline.Interface | null = null;

  static getInstance(): EnhancedCLI {
    if (!EnhancedCLI.instance) {
      EnhancedCLI.instance = new EnhancedCLI();
    }
    return EnhancedCLI.instance;
  }

  // Set up ESC key handler
  setupEscKeyHandler(): void {
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
        console.log(chalk.yellow('\n\n🔄 Press ESC again to go back, or Ctrl+C to exit'));
        // Set a flag to handle ESC in the next prompt
        (global as any).__escPressed = true;
      }
    });

    // Handle process termination
    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n\n👋 Goodbye!'));
      process.exit(0);
    });
  }

  // Wrapper for inquirer prompts with ESC key support
  async promptWithEsc(questions: any[]): Promise<any> {
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

  // Clean up readline interface
  close(): void {
    if (this.rl) {
      this.rl.close();
    }
  }

  // 🎨 Welcome Screen
  showWelcome(): void {
    console.clear();

    // ASCII Art with gradient
    const title = figlet.textSync('MockAuth', {
      font: 'ANSI Shadow',
      horizontalLayout: 'fitted',
      verticalLayout: 'fitted',
    });

    console.log(gradient.rainbow.multiline(title));

    // Subtitle with box
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

  // 🎯 Main Menu
  async showMainMenu(): Promise<string> {
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
        message: chalk.bold.cyan('What would you like to do?'),
        choices,
        pageSize: 10,
      },
    ]);

    return action;
  }

  // 🎨 Migration Provider Selection
  async selectMigrationProvider(): Promise<string> {
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

    return provider;
  }

  // 🎯 Interactive Configuration
  async createInteractiveConfig(): Promise<any> {
    console.log(chalk.bold.cyan('\n📝 Project Configuration\n'));

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

    // Create users if requested
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

      const userAnswers = await this.promptWithEsc(userQuestions);
      answers.userCount = userAnswers.userCount;
    }

    return answers;
  }

  // 🎨 Progress Bar
  createProgressBar(label: string): cliProgress.SingleBar {
    return new cliProgress.SingleBar(
      {
        format: `${chalk.cyan('{bar}')} | {percentage}% | {value}/{total} | ${chalk.green('{label}')}`,
        barCompleteChar: '█',
        barIncompleteChar: '░',
        hideCursor: true,
      },
      cliProgress.Presets.shades_classic
    );
  }

  // 🎯 Spinner with custom messages
  createSpinner(text: string): any {
    return ora({
      text: chalk.cyan(text),
      spinner: 'dots',
      color: 'cyan',
    });
  }

  // 🎨 Success Message
  showSuccess(message: string, details?: string[]): void {
    console.log(chalk.green('✅'), chalk.bold.green(message));
    if (details) {
      details.forEach((detail) => {
        console.log(chalk.gray('   •'), detail);
      });
    }
  }

  // 🎨 Error Message
  showError(message: string, suggestions?: string[]): void {
    console.log(chalk.red('❌'), chalk.bold.red(message));
    if (suggestions) {
      console.log(chalk.yellow('\n💡 Suggestions:'));
      suggestions.forEach((suggestion) => {
        console.log(chalk.gray('   •'), suggestion);
      });
    }
  }

  // 🎨 Warning Message
  showWarning(message: string): void {
    console.log(chalk.yellow('⚠️'), chalk.bold.yellow(message));
  }

  // 🎨 Info Message
  showInfo(message: string): void {
    console.log(chalk.blue('ℹ️'), chalk.bold.blue(message));
  }

  // 🎨 Migration Success
  showMigrationSuccess(provider: string, files: string[]): void {
    const title = boxen(
      chalk.bold.green('🎉 Migration Generated Successfully!') +
        '\n\n' +
        chalk.cyan(`Provider: ${provider}`) +
        '\n' +
        chalk.gray(`Files: ${files.length}`),
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
    files.forEach((file) => {
      console.log(chalk.gray('   •'), chalk.green(file));
    });

    console.log(chalk.bold.cyan('\n📚 Next Steps:'));
    console.log(chalk.gray('   1.'), 'Review the generated files');
    console.log(chalk.gray('   2.'), 'Install dependencies: npm install');
    console.log(chalk.gray('   3.'), 'Configure environment variables');
    console.log(chalk.gray('   4.'), 'Test the migration');
    console.log(chalk.gray('   5.'), 'Deploy to production');
  }

  // 🎨 Health Check Results
  showHealthResults(results: any): void {
    const status = results.overall ? '✅ Healthy' : '❌ Issues Detected';
    const color = results.overall ? 'green' : 'red';

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
      results.server ? chalk.green('✅ Running') : chalk.red('❌ Failed')
    );
    console.log(
      chalk.gray('   Database:'),
      results.database ? chalk.green('✅ Connected') : chalk.red('❌ Failed')
    );
    console.log(
      chalk.gray('   Memory:'),
      chalk.yellow(`${results.memory}MB (${results.memoryStatus})`)
    );
    console.log(
      chalk.gray('   Response Time:'),
      chalk.yellow(`${results.responseTime}ms (${results.performanceStatus})`)
    );
    console.log(
      chalk.gray('   Active Sessions:'),
      chalk.cyan(results.activeSessions)
    );

    if (results.warnings.length > 0) {
      console.log(chalk.bold.yellow('\n⚠️ Warnings:'));
      results.warnings.forEach((warning: string) => {
        console.log(chalk.gray('   •'), warning);
      });
    }

    if (results.suggestions.length > 0) {
      console.log(chalk.bold.cyan('\n💡 Suggestions:'));
      results.suggestions.forEach((suggestion: string) => {
        console.log(chalk.gray('   •'), suggestion);
      });
    }
  }

  // 🎨 Server Start Animation
  async showServerStart(config: any): Promise<void> {
    const spinner = this.createSpinner('Starting MockAuth server...');
    spinner.start();

    // Simulate server startup
    await new Promise((resolve) => setTimeout(resolve, 2000));

    spinner.succeed('MockAuth server started successfully!');

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
    console.log(chalk.gray('   •'), chalk.green('✅'), 'RBAC & Audit Logging');

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
  }

  // 🎨 Goodbye Message
  showGoodbye(): void {
    const goodbye = boxen(
      chalk.bold.cyan('👋 Thanks for using MockAuth!') +
        '\n' +
        chalk.gray('Made with ❤️ for developers'),
      {
        padding: 1,
        margin: 1,
        borderStyle: 'round',
        borderColor: 'cyan',
        backgroundColor: '#1a1a1a',
      }
    );

    console.log(goodbye);
  }

  // 🎨 Loading Animation
  async showLoading(text: string, duration: number = 2000): Promise<void> {
    const spinner = this.createSpinner(text);
    spinner.start();

    await new Promise((resolve) => setTimeout(resolve, duration));

    spinner.succeed(text.replace('...', ' completed!'));
  }

  // 🎨 Table Display
  showTable(headers: string[], rows: string[][]): void {
    const table = boxen(this.formatTable(headers, rows), {
      padding: 1,
      margin: 1,
      borderStyle: 'round',
      borderColor: 'cyan',
      backgroundColor: '#1a1a1a',
    });

    console.log(table);
  }

  private formatTable(headers: string[], rows: string[][]): string {
    const maxWidths = headers.map((_, i) =>
      Math.max(headers[i].length, ...rows.map((row) => row[i]?.length || 0))
    );

    const formatRow = (row: string[]) =>
      row.map((cell, i) => cell.padEnd(maxWidths[i])).join(' | ');

    const separator = maxWidths.map((width) => '-'.repeat(width)).join('-|-');

    return [formatRow(headers), separator, ...rows.map(formatRow)].join('\n');
  }
}

export default EnhancedCLI;
