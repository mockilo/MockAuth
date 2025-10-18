import cliProgress from 'cli-progress';
export declare class EnhancedCLI {
    private static instance;
    private rl;
    static getInstance(): EnhancedCLI;
    setupEscKeyHandler(): void;
    promptWithEsc(questions: any[]): Promise<any>;
    close(): void;
    showWelcome(): void;
    showMainMenu(): Promise<string>;
    selectMigrationProvider(): Promise<string>;
    createInteractiveConfig(): Promise<any>;
    createProgressBar(label: string): cliProgress.SingleBar;
    createSpinner(text: string): any;
    showSuccess(message: string, details?: string[]): void;
    showError(message: string, suggestions?: string[]): void;
    showWarning(message: string): void;
    showInfo(message: string): void;
    showMigrationSuccess(provider: string, files: string[]): void;
    showHealthResults(results: any): void;
    showServerStart(config: any): Promise<void>;
    showGoodbye(): void;
    showLoading(text: string, duration?: number): Promise<void>;
    showTable(headers: string[], rows: string[][]): void;
    private formatTable;
}
export default EnhancedCLI;
//# sourceMappingURL=enhanced-ui.d.ts.map