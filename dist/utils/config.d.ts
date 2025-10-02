import { PluginConfig } from '../types/index.js';
/**
 * Default configuration for the MCP server
 */
export declare const DEFAULT_CONFIG: PluginConfig;
/**
 * Configuration manager for the plugin
 */
export declare class ConfigManager {
    private config;
    private configPath;
    constructor(configPath?: string);
    /**
     * Load configuration from file or use defaults
     */
    private loadConfig;
    /**
     * Merge user config with defaults
     */
    private mergeConfigs;
    /**
     * Get current configuration
     */
    getConfig(): PluginConfig;
    /**
     * Update configuration
     */
    updateConfig(updates: Partial<PluginConfig>): void;
    /**
     * Save configuration to file
     */
    saveConfig(): void;
    /**
     * Reset configuration to defaults
     */
    resetConfig(): void;
    /**
     * Validate configuration
     */
    validateConfig(): {
        valid: boolean;
        errors: string[];
    };
    /**
     * Get configuration as JSON string
     */
    getConfigJson(): string;
    /**
     * Get configuration file path
     */
    getConfigPath(): string;
}
export declare const configManager: ConfigManager;
//# sourceMappingURL=config.d.ts.map