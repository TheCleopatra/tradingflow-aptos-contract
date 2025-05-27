/**
 * TradingFlow Aptos 合约 TypeScript 交互脚本
 * 
 * 这个文件导出所有可用的交互函数，方便在其他应用中引用
 */

// 配置导出
export * from './config';

// 工具函数导出
export * from './utils';

// 导出所有功能模块，方便其他应用引用
export { initVault } from './initVault';
export { depositCoins } from './depositCoins';
export { withdrawCoins } from './withdrawCoins';
export { tradeSignal } from './tradeSignal';
export { adminManage, AdminAction } from './adminManage';
export { getBalances } from './getBalances';
