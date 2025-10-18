export interface AdvancedCLIOptions {
    command: string;
    config?: string;
    port?: number;
    database?: string;
    output?: string;
    help?: boolean;
    verbose?: boolean;
    watch?: boolean;
    env?: string;
    profile?: string;
}
export declare class AdvancedMockAuthCLI {
    private rl;
    constructor();
    run(): Promise<void>;
    private parseArgs;
    private showAdvancedHelp;
    deployToCloud(options: AdvancedCLIOptions): Promise<void>;
    private deployToAWS;
    private deployToGCP;
    private deployToAzure;
    private deployWithDocker;
    startMonitoring(options: AdvancedCLIOptions): Promise<void>;
    backupData(options: AdvancedCLIOptions): Promise<void>;
    restoreData(options: AdvancedCLIOptions): Promise<void>;
    validateConfig(options: AdvancedCLIOptions): Promise<void>;
    runBenchmarks(options: AdvancedCLIOptions): Promise<void>;
    generateDocs(options: AdvancedCLIOptions): Promise<void>;
    managePlugins(options: AdvancedCLIOptions): Promise<void>;
    private installPlugin;
    private removePlugin;
    private listPlugins;
    private updatePlugins;
    private question;
    private generateSecret;
    private copyDirectory;
    private getDirectorySize;
    private initProjectAdvanced;
    private startServerAdvanced;
    private runTestsAdvanced;
    private generateDataAdvanced;
    private migrateDatabaseAdvanced;
    close(): void;
}
//# sourceMappingURL=advanced.d.ts.map