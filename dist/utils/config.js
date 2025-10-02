import * as fs from 'fs';
import * as path from 'path';
/**
 * Default configuration for the MCP server
 */
export const DEFAULT_CONFIG = {
    server: {
        port: 3001,
        host: 'localhost',
        autoStart: true
    },
    tools: {
        file: {
            enabled: true,
            allowedExtensions: ['.txt', '.md', '.js', '.ts', '.json', '.yaml', '.yml', '.xml', '.csv', '.html', '.css', '.scss', '.less'],
            maxFileSize: 10 * 1024 * 1024 // 10MB
        },
        shell: {
            enabled: true,
            allowedCommands: ['ls', 'pwd', 'cd', 'cat', 'echo', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'find', 'grep', 'git', 'npm', 'node', 'python', 'python3'],
            timeout: 30000 // 30 seconds
        },
        edit: {
            enabled: true,
            createBackup: true
        }
    },
    ui: {
        theme: 'auto',
        fontSize: 14,
        showLineNumbers: true
    },
    security: {
        workspaceRestriction: true,
        allowedPaths: [],
        blockedPaths: [
            '/etc',
            '/usr/bin',
            '/bin',
            '/sbin',
            '/System',
            'C:\\Windows',
            'C:\\Program Files',
            'C:\\Program Files (x86)'
        ]
    }
};
/**
 * Configuration manager for the plugin
 */
export class ConfigManager {
    config;
    configPath;
    constructor(configPath) {
        this.configPath = configPath || path.join(process.cwd(), 'cline-config.json');
        this.config = this.loadConfig();
    }
    /**
     * Load configuration from file or use defaults
     */
    loadConfig() {
        try {
            if (fs.existsSync(this.configPath)) {
                const configData = fs.readFileSync(this.configPath, 'utf-8');
                const userConfig = JSON.parse(configData);
                return this.mergeConfigs(DEFAULT_CONFIG, userConfig);
            }
        }
        catch (error) {
            console.warn(`Failed to load config from ${this.configPath}, using defaults:`, error);
        }
        return { ...DEFAULT_CONFIG };
    }
    /**
     * Merge user config with defaults
     */
    mergeConfigs(defaultConfig, userConfig) {
        return {
            server: { ...defaultConfig.server, ...userConfig.server },
            tools: {
                file: { ...defaultConfig.tools.file, ...userConfig.tools?.file },
                shell: { ...defaultConfig.tools.shell, ...userConfig.tools?.shell },
                edit: { ...defaultConfig.tools.edit, ...userConfig.tools?.edit }
            },
            ui: { ...defaultConfig.ui, ...userConfig.ui },
            security: { ...defaultConfig.security, ...userConfig.security }
        };
    }
    /**
     * Get current configuration
     */
    getConfig() {
        return { ...this.config };
    }
    /**
     * Update configuration
     */
    updateConfig(updates) {
        this.config = this.mergeConfigs(this.config, updates);
        this.saveConfig();
    }
    /**
     * Save configuration to file
     */
    saveConfig() {
        try {
            const configDir = path.dirname(this.configPath);
            if (!fs.existsSync(configDir)) {
                fs.mkdirSync(configDir, { recursive: true });
            }
            fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2));
        }
        catch (error) {
            console.error(`Failed to save config to ${this.configPath}:`, error);
        }
    }
    /**
     * Reset configuration to defaults
     */
    resetConfig() {
        this.config = { ...DEFAULT_CONFIG };
        this.saveConfig();
    }
    /**
     * Validate configuration
     */
    validateConfig() {
        const errors = [];
        // Validate server config
        if (this.config.server.port < 1 || this.config.server.port > 65535) {
            errors.push('Server port must be between 1 and 65535');
        }
        if (!this.config.server.host) {
            errors.push('Server host is required');
        }
        // Validate file tool config
        if (this.config.tools.file.maxFileSize <= 0) {
            errors.push('Max file size must be positive');
        }
        if (this.config.tools.file.allowedExtensions.length === 0) {
            errors.push('At least one allowed file extension is required');
        }
        // Validate shell tool config
        if (this.config.tools.shell.timeout <= 0) {
            errors.push('Shell timeout must be positive');
        }
        if (this.config.tools.shell.allowedCommands.length === 0) {
            errors.push('At least one allowed shell command is required');
        }
        // Validate UI config
        if (this.config.ui.fontSize < 8 || this.config.ui.fontSize > 72) {
            errors.push('Font size must be between 8 and 72');
        }
        return {
            valid: errors.length === 0,
            errors
        };
    }
    /**
     * Get configuration as JSON string
     */
    getConfigJson() {
        return JSON.stringify(this.config, null, 2);
    }
    /**
     * Get configuration file path
     */
    getConfigPath() {
        return this.configPath;
    }
}
// Singleton instance
export const configManager = new ConfigManager();
//# sourceMappingURL=config.js.map