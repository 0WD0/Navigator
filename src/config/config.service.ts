import { AppConfig, defaultConfig } from './app.config';

export class ConfigService {
  private config: AppConfig;
  private storageKey = 'navigator-config';

  constructor() {
    this.config = this.loadConfig();
  }

  /**
   * 获取完整配置
   */
  getConfig(): AppConfig {
    return { ...this.config };
  }

  /**
   * 获取配置项
   */
  get<K extends keyof AppConfig>(key: K): AppConfig[K] {
    return this.config[key];
  }

  /**
   * 设置配置项
   */
  set<K extends keyof AppConfig>(key: K, value: AppConfig[K]): void {
    this.config[key] = value;
    this.saveConfig();
  }

  /**
   * 更新配置项（部分更新）
   */
  update<K extends keyof AppConfig>(key: K, value: Partial<AppConfig[K]>): void {
    if (typeof this.config[key] === 'object' && this.config[key] !== null) {
      this.config[key] = { ...this.config[key], ...value } as AppConfig[K];
    } else {
      this.config[key] = value as AppConfig[K];
    }
    this.saveConfig();
  }

  /**
   * 重置为默认配置
   */
  reset(): void {
    this.config = { ...defaultConfig };
    this.saveConfig();
  }

  /**
   * 重置特定配置项
   */
  resetKey<K extends keyof AppConfig>(key: K): void {
    this.config[key] = defaultConfig[key];
    this.saveConfig();
  }

  /**
   * 从本地存储加载配置
   */
  private loadConfig(): AppConfig {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsedConfig = JSON.parse(stored);
        // 合并默认配置和存储的配置，确保新字段的默认值
        return this.mergeConfig(defaultConfig, parsedConfig);
      }
    } catch (error) {
      console.error('加载配置失败:', error);
    }
    return { ...defaultConfig };
  }

  /**
   * 保存配置到本地存储
   */
  private saveConfig(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.config));
    } catch (error) {
      console.error('保存配置失败:', error);
    }
  }

  /**
   * 深度合并配置对象
   */
  private mergeConfig(defaultConfig: AppConfig, userConfig: Partial<AppConfig>): AppConfig {
    const merged = { ...defaultConfig };
    
    for (const key in userConfig) {
      if (userConfig.hasOwnProperty(key)) {
        const userValue = userConfig[key as keyof AppConfig];
        const defaultValue = defaultConfig[key as keyof AppConfig];
        
        if (typeof userValue === 'object' && userValue !== null && !Array.isArray(userValue) &&
            typeof defaultValue === 'object' && defaultValue !== null && !Array.isArray(defaultValue)) {
          merged[key as keyof AppConfig] = {
            ...defaultValue,
            ...userValue,
          } as any;
        } else {
          merged[key as keyof AppConfig] = userValue as any;
        }
      }
    }
    
    return merged;
  }

  /**
   * 导出配置到JSON
   */
  exportConfig(): string {
    return JSON.stringify(this.config, null, 2);
  }

  /**
   * 从JSON导入配置
   */
  importConfig(configJson: string): boolean {
    try {
      const importedConfig = JSON.parse(configJson);
      this.config = this.mergeConfig(defaultConfig, importedConfig);
      this.saveConfig();
      return true;
    } catch (error) {
      console.error('导入配置失败:', error);
      return false;
    }
  }
}

// 单例实例
export const configService = new ConfigService(); 