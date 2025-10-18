#!/usr/bin/env node
export declare class EnhancedMockAuthCLI {
    private ui;
    private config;
    private rl;
    constructor();
    run(): Promise<void>;
    private mainLoop;
    private setupEscKeyHandler;
    private promptWithEsc;
    private handleAction;
    private handleInit;
    private handleStart;
    private handleServerManagement;
    private handleTest;
    private handleGenerate;
    private handleMigration;
    private handleBuilder;
    private handleDebug;
    private handleStop;
    private handleRestart;
    private handleReset;
    private handleStatus;
    private handleList;
    private handleKillAll;
    private handleHealth;
    private handleHelp;
    private findServerProcess;
    private findAllMockAuthServers;
    private testServerHealth;
    private clearServerData;
    private loadConfig;
    private generateSecret;
    private createExampleFiles;
    private generateUsers;
    private generatePosts;
    private generateProducts;
    private generateMigrationFiles;
    private generateBetterAuthMigration;
    private generateClerkMigration;
    private generateAuth0Migration;
    private generateFirebaseMigration;
    private generateSupabaseMigration;
}
export default EnhancedMockAuthCLI;
//# sourceMappingURL=enhanced-cli.d.ts.map