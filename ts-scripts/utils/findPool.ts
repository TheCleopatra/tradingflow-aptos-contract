import * as fs from 'fs';
import * as path from 'path';

/**
 * 定义池子数据的接口
 */
interface PoolInfo {
  id: string;
  dailyVolumeUSD: string;
  feesUSD: string;
  tvlUSD: string;
  feeAPR: string;
  farmAPR: string;
  token1Price: string;
  token2Price: string;
  pool: {
    currentTick?: number;
    feeRate?: string;
    feeTier?: number;
    poolId?: string;
    senderAddress?: string;
    sqrtPrice?: string;
    token1?: string;
    token2?: string;
    token1Info?: {
      symbol?: string;
      decimals?: number;
      [key: string]: any;
    };
    token2Info?: {
      symbol?: string;
      decimals?: number;
      [key: string]: any;
    };
    [key: string]: any;
  };
  [key: string]: any;
}

/**
 * 将费率等级映射到实际费率百分比
 * @param feeTier 费率等级
 * @returns 费率百分比字符串
 */
function mapFeeTierToRate(feeTier: number): string {
  switch (feeTier) {
    case 0:
      return '0.01%';
    case 1:
      return '0.05%';
    case 2:
      return '0.3%';
    case 3:
      return '1%';
    default:
      return `未知(${feeTier})`;
  }
}

/**
 * 将费率等级映射到 Tick spacing
 * @param feeTier 费率等级
 * @returns Tick spacing
 */
function mapFeeTierToTickSpacing(feeTier: number): number {
  switch (feeTier) {
    case 0:
      return 1;
    case 1:
      return 5;
    case 2:
      return 60;
    case 3:
      return 200;
    default:
      return -1;
  }
}

/**
 * 查找代币对的池子信息
 * 这个脚本用于在 pools.json 文件中查找特定代币对的池子信息
 * 
 * @param token1Symbol 第一个代币的符号
 * @param token2Symbol 第二个代币的符号（可选）
 * @returns 匹配的池子列表
 */
async function findPool(token1Symbol: string, token2Symbol?: string): Promise<PoolInfo[]> {
  try {
    // 读取 pools.json 文件
    const poolsFilePath = path.join(__dirname, 'pools.json');
    const poolsData = fs.readFileSync(poolsFilePath, 'utf8');
    const pools = JSON.parse(poolsData);

    console.log(`总共找到 ${pools.length} 个池子`);
    console.log(`正在查找 ${token1Symbol}${token2Symbol ? '-' + token2Symbol : ''} 的池子...`);

    // 将符号转换为小写以进行不区分大小写的比较
    const symbol1Lower = token1Symbol.toLowerCase();
    const symbol2Lower = token2Symbol ? token2Symbol.toLowerCase() : undefined;

    // 筛选匹配的池子
    const matchedPools = pools.filter((pool: PoolInfo) => {
      // 检查池子是否有完整的信息
      if (!pool.pool || !pool.pool.token1Info || !pool.pool.token2Info) {
        return false;
      }

      // 获取池子中的代币符号
      const poolToken1Symbol = pool.pool.token1Info.symbol ? pool.pool.token1Info.symbol.toLowerCase() : '';
      const poolToken2Symbol = pool.pool.token2Info.symbol ? pool.pool.token2Info.symbol.toLowerCase() : '';

      // 如果只提供了一个代币符号，则检查池子是否包含该代币
      if (!symbol2Lower) {
        return poolToken1Symbol === symbol1Lower || poolToken2Symbol === symbol1Lower;
      }

      // 如果提供了两个代币符号，则检查池子是否包含这两个代币（顺序不限）
      return (poolToken1Symbol === symbol1Lower && poolToken2Symbol === symbol2Lower) ||
        (poolToken1Symbol === symbol2Lower && poolToken2Symbol === symbol1Lower);
    });

    console.log(`找到 ${matchedPools.length} 个匹配的池子`);

    // 显示匹配的池子信息
    if (matchedPools.length > 0) {
      matchedPools.forEach((pool: PoolInfo, index: number) => {
        console.log(`\n池子 #${index + 1}:`);
        console.log(`ID: ${pool.id}`);
        console.log(`费率等级(FeeTierIndex): ${pool.pool.feeTier || 'Unknown'}`);
        
        // 添加空值检查，确保 feeTier 存在且是数字
        const feeTier = typeof pool.pool.feeTier === 'number' ? pool.pool.feeTier : -1;
        console.log(`费率: ${mapFeeTierToRate(feeTier)}`);
        console.log(`Tick Spacing: ${mapFeeTierToTickSpacing(feeTier)}`);
        
        console.log(`TVL (USD): ${pool.tvlUSD}`);
        console.log(`日交易量 (USD): ${pool.dailyVolumeUSD}`);
        console.log(`费用 (USD): ${pool.feesUSD}`);
        console.log(`费用 APR: ${pool.feeAPR}`);
        console.log(`农场 APR: ${pool.farmAPR}`);

        // 显示代币信息
        const token1 = pool.pool.token1Info || {};
        const token2 = pool.pool.token2Info || {};

        console.log(`\n代币 1: ${token1.symbol || 'Unknown'}`);
        console.log(`- 元数据对象 ID: ${pool.pool.token1 || 'Unknown'}`);
        console.log(`- 精度: ${token1.decimals || 'Unknown'}`);

        console.log(`\n代币 2: ${token2.symbol || 'Unknown'}`);
        console.log(`- 元数据对象 ID: ${pool.pool.token2 || 'Unknown'}`);
        console.log(`- 精度: ${token2.decimals || 'Unknown'}`);
        
        // 显示价格信息
        console.log(`\n价格:`);
        console.log(`- ${token1.symbol || 'Unknown'}/${token2.symbol || 'Unknown'}: ${pool.token1Price || 'Unknown'}`);
        console.log(`- ${token2.symbol || 'Unknown'}/${token1.symbol || 'Unknown'}: ${pool.token2Price || 'Unknown'}`);

        // 显示当前 Tick 和 Sqrt Price
        console.log(`\n当前 Tick: ${pool.pool.currentTick}`);
        console.log(`Sqrt Price: ${pool.pool.sqrtPrice}`);
      });
    } else {
      console.log("没有找到匹配的池子");
    }

    return matchedPools;
  } catch (error) {
    console.error("查找池子失败:", error);
    return [];
  }
}

/**
 * 获取所有可用的代币符号
 * 这个函数用于从 pools.json 文件中提取所有可用的代币符号
 * 
 * @returns 所有可用的代币符号列表
 */
function getAllTokenSymbols(): string[] {
  try {
    // 读取 pools.json 文件
    const poolsFilePath = path.join(__dirname, 'pools.json');
    const poolsData = fs.readFileSync(poolsFilePath, 'utf8');
    const pools = JSON.parse(poolsData);

    // 提取所有代币符号
    const symbolsSet = new Set<string>();

    pools.forEach((pool: PoolInfo) => {
      if (pool.pool && pool.pool.token1Info && pool.pool.token1Info.symbol) {
        symbolsSet.add(pool.pool.token1Info.symbol);
      }
      if (pool.pool && pool.pool.token2Info && pool.pool.token2Info.symbol) {
        symbolsSet.add(pool.pool.token2Info.symbol);
      }
    });

    return Array.from(symbolsSet).sort();
  } catch (error: any) {
    console.error("获取代币符号失败:", error);
    return [];
  }
}

// 导出函数以便其他脚本使用
export { findPool, getAllTokenSymbols };

// 如果直接运行脚本
if (require.main === module) {
  // 从命令行参数获取代币符号
  const token1Symbol: string = process.argv[2];
  const token2Symbol: string | undefined = process.argv[3];

  if (!token1Symbol) {
    console.log("用法: pnpm ts-node utils/findPool.ts <代币1符号> [代币2符号]");
    console.log("例如: pnpm ts-node utils/findPool.ts APT USDC");

    // 显示所有可用的代币符号
    const allSymbols = getAllTokenSymbols();
    console.log("\n可用的代币符号:");
    console.log(allSymbols.join(", "));

    process.exit(1);
  }

  findPool(token1Symbol, token2Symbol);
}
