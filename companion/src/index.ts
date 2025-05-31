import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Network } from "@aptos-labs/ts-sdk";
import { initHyperionSDK } from '@hyperionxyz/sdk';

// 加载环境变量
dotenv.config();

import { tokenRoute, hyperionDexRoute, tfVaultRoute } from './modules';

// 初始化 Express 应用
const app = express();
const port = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());

// 初始化 Hyperion SDK
export const sdk = initHyperionSDK({
  network: Network.MAINNET,
  APTOS_API_KEY: process.env.APTOS_GRAPHQL_API_KEY || ''
});

// 路由
app.use('/aptos/api/tokens', tokenRoute);
app.use('/aptos/api/pools', hyperionDexRoute);
app.use('/aptos/api/tf_vault', tfVaultRoute);

// 根路由
app.get('/', (req, res) => {
  res.json({
    message: 'TradingFlow Companion API',
    version: '1.0.0',
    endpoints: [
      '/aptos/api/tokens',
      '/aptos/api/tokens/metadata/:address',
      '/aptos/api/pools',
      '/aptos/api/pools/:poolId'
    ]
  });
});

// Aptos 根路由
app.get('/aptos', (req, res) => {
  res.json({
    message: 'TradingFlow Aptos API',
    version: '1.0.0',
    endpoints: [
      '/aptos/api/tokens',
      '/aptos/api/tokens/metadata/:address',
      '/aptos/api/pools',
      '/aptos/api/pools/:poolId'
    ]
  });
});

// 启动服务器
app.listen(port, () => {
  console.log(`服务器运行在 http://localhost:${port}`);
});
