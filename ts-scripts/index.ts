/**
 * TradingFlow Aptos 合约 TypeScript 交互脚本
 * 
 * 这个文件导出所有可用的交互函数，方便在其他应用中引用
 */

// 配置导出
export * from './config';

// 工具函数导出
export * from './utils/common';

// 导出核心功能模块，方便其他应用引用
export { initVault } from './core/initVault';
export { depositCoins } from './core/depositCoins';
export { withdrawCoins } from './core/withdrawCoins';
export { tradeSignal } from './core/tradeSignal';
export { adminDeposit } from './core/adminDeposit';
export { adminWithdraw } from './core/adminWithdraw';
export { getBalances } from './core/getBalances';

// 导出工具模块
export { checkResourceAccount } from './utils/checkResourceAccount';
export { ensureFungibleStore } from './utils/ensureFungibleStore';
export { findPool } from './utils/findPool';
export { runIntegrationTest } from './utils/integrationTest';
export { checkBalanceManager } from './utils/checkBalanceManager';
