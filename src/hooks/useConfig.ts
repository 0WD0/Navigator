import { useState, useEffect } from 'react';
import { configService } from '@config/config.service';
import { AppConfig } from '@config/app.config';

export function useConfig() {
  const [config, setConfig] = useState<AppConfig>(configService.getConfig());

  useEffect(() => {
    // TODO: 添加配置变更监听器
    // 现在先使用简单的轮询方式
    const interval = setInterval(() => {
      const newConfig = configService.getConfig();
      setConfig(newConfig);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  const updateConfig = <K extends keyof AppConfig>(
    key: K,
    value: AppConfig[K] | Partial<AppConfig[K]>
  ) => {
    if (typeof config[key] === 'object' && config[key] !== null && !Array.isArray(config[key])) {
      configService.update(key, value as Partial<AppConfig[K]>);
    } else {
      configService.set(key, value as AppConfig[K]);
    }
    setConfig(configService.getConfig());
  };

  const resetConfig = () => {
    configService.reset();
    setConfig(configService.getConfig());
  };

  const resetConfigKey = <K extends keyof AppConfig>(key: K) => {
    configService.resetKey(key);
    setConfig(configService.getConfig());
  };

  return {
    config,
    updateConfig,
    resetConfig,
    resetConfigKey,
    exportConfig: configService.exportConfig.bind(configService),
    importConfig: (jsonConfig: string) => {
      const success = configService.importConfig(jsonConfig);
      if (success) {
        setConfig(configService.getConfig());
      }
      return success;
    },
  };
} 