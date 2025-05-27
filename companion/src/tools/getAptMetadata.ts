import { initHyperionSDK } from '@hyperionxyz/sdk';
import { Network } from '@aptos-labs/ts-sdk';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

/**
 * 获取 APT 代币的元数据对象 ID
 */
async function getAptMetadataId() {
  try {
    console.log('正在初始化 Hyperion SDK...');
    
    // 初始化 Hyperion SDK
    const sdk = initHyperionSDK({
      network: Network.MAINNET,
      APTOS_API_KEY: process.env.APTOS_API_KEY || ''
    });
    
    console.log('正在获取所有池子...');
    const pools = await sdk.Pool.fetchAllPools();
    console.log(`找到 ${pools.length} 个池子`);
    
    // 查找包含 APT 代币的池子
    for (const pool of pools) {
      if (pool.token1Symbol === 'APT') {
        console.log('\n找到 APT 代币:');
        console.log(`代币元数据对象ID: ${pool.token1}`);
        console.log(`符号: ${pool.token1Symbol}`);
        console.log(`小数位: ${pool.token1Decimals}`);
        console.log('\n使用示例:');
        console.log(`npx ts-node depositCoins.ts ${pool.token1} 1000000`);
        return pool.token1;
      }
      
      if (pool.token2Symbol === 'APT') {
        console.log('\n找到 APT 代币:');
        console.log(`代币元数据对象ID: ${pool.token2}`);
        console.log(`符号: ${pool.token2Symbol}`);
        console.log(`小数位: ${pool.token2Decimals}`);
        console.log('\n使用示例:');
        console.log(`npx ts-node depositCoins.ts ${pool.token2} 1000000`);
        return pool.token2;
      }
    }
    
    console.log('未找到 APT 代币');
    return null;
  } catch (error) {
    console.error('获取 APT 代币元数据对象ID失败:', error);
    return null;
  }
}

// 执行函数
getAptMetadataId()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('执行失败:', error);
    process.exit(1);
  });
