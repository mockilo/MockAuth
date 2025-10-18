#!/usr/bin/env node
export interface CLIOptions {
    command: string;
    config?: string;
    port?: number;
    database?: string;
    output?: string;
    verbose?: boolean;
    watch?: boolean;
    env?: string;
    profile?: string;
    template?: string;
    count?: number;
    type?: string;
    coverage?: boolean;
    open?: boolean;
    legacy?: boolean;
    help?: boolean;
}
export declare class MockAuthCLI {
    private rl;
    constructor();
    run(): Promise<void>;
    private levenshteinDistance;
    private findClosestCommand;
    showInvalidCommand(typo: string, validCommands: string[]): void;
    showCommandHelp(command: string): void;
    private parseArgs;
    showHelp(): void;
    private initProject;
    private createInteractiveConfig;
    private createExampleFiles;
    private startServer;
    private runTests;
    private generateData;
    private migrateDatabase;
    private loadConfig;
    private question;
    private generateSecret;
    private generateUsers;
    private generatePosts;
    private generateProducts;
    private launchBuilder;
    private startDebugMode;
    private runHealthCheck;
    private stopServer;
    private restartServer;
    private resetServer;
    private checkServerStatus;
    private listServers;
    private killAllServers;
    private generateMigration;
    private findServerProcess;
    private findAllMockAuthServers;
    private testServerHealth;
    private clearServerData;
    private performHealthChecks;
    private testServerResponse;
    private testDatabaseConnection;
    private getActiveSessions;
    private generateMigrationFiles;
    private generateClerkMigration;
    private generateBetterAuthMigration;
    private generateAuth0Migration;
    private generateFirebaseMigration;
    private generateSupabaseMigration;
    close(): void;
}
//# sourceMappingURL=index.d.ts.map