import { sdk } from '../../index';
import { tokenService } from '../token';

// 定义池子和代币类型
interface TokenInfo {
  assetType?: string;
  bridge?: string | null;
  coinMarketcapId?: string;
  coinType?: string;
  coingeckoId?: string;
  decimals: number;
  faType?: string;
  hyperfluidSymbol?: string;
  logoUrl?: string;
  name: string;
  symbol: string;
  isBanned?: boolean;
  websiteUrl?: string | null;
}

interface Pool {
  currentTick?: number;
  feeRate?: string;
  feeTier: number;
  poolId: string;
  senderAddress?: string;
  sqrtPrice: string;
  token1: string;
  token2: string;
  token1Info?: TokenInfo;
  token2Info?: TokenInfo;
}

/**
 * 池子信息接口
 */
export interface PoolInfo {
  poolId: string;
  token1: string;
  token2: string;
  token1Symbol: string;
  token2Symbol: string;
  token1Decimals: number;
  token2Decimals: number;
  feeTier: number;
  liquidity: string;
  sqrtPrice: string;
  tick: number;
  token1Price?: string;
  token2Price?: string;
}

/**
 * 获取所有可用池子列表
 * @returns 池子列表
 */
export async function getAllPools(): Promise<PoolInfo[]> {
  try {
    const pools = await sdk.Pool.fetchAllPools();
    
    // 增强池子信息
    const enhancedPools = await Promise.all(
      pools.map(async (pool: PoolInfo) => {
        // 计算价格
        const token1Price = calculatePrice(pool.sqrtPrice, pool.token1Decimals, pool.token2Decimals, true);
        const token2Price = calculatePrice(pool.sqrtPrice, pool.token1Decimals, pool.token2Decimals, false);
        
        return {
          ...pool,
          token1Price,
          token2Price
        };
      })
    );
    
    return enhancedPools;
  } catch (error) {
    console.error('获取池子列表失败:', error);
    throw error;
  }
}

/**
 * 根据池子ID获取特定池子的详细信息
 * @param poolId 池子ID
 * @returns 池子详细信息
 */
export async function getPoolById(poolId: string): Promise<PoolInfo | null> {
  try {
    const pool = await sdk.Pool.fetchPoolById({
      poolId
    });
    
    if (!pool) {
      return null;
    }
    
    // 获取代币元数据
    const token1Metadata = await tokenService.getTokenMetadata(pool.token1);
    const token2Metadata = await tokenService.getTokenMetadata(pool.token2);
    
    // 计算价格
    const token1Price = calculatePrice(pool.sqrtPrice, pool.token1Decimals, pool.token2Decimals, true);
    const token2Price = calculatePrice(pool.sqrtPrice, pool.token1Decimals, pool.token2Decimals, false);
    
    return {
      ...pool,
      token1Symbol: token1Metadata?.symbol || pool.token1Symbol,
      token2Symbol: token2Metadata?.symbol || pool.token2Symbol,
      token1Price,
      token2Price
    };
  } catch (error) {
    console.error(`获取池子 ${poolId} 详情失败:`, error);
    return null;
  }
}

/**
 * 根据代币对和费率等级获取池子
 * @param token1 第一个代币的元数据对象ID
 * @param token2 第二个代币的元数据对象ID
 * @param feeTierIndex 费率等级索引 (0-3)
 * @returns 池子信息
 */
export async function getPoolByTokenPair(
  token1: string,
  token2: string,
  feeTierIndex: number
): Promise<PoolInfo | null> {
  try {
    // 验证费率等级
    if (feeTierIndex < 0 || feeTierIndex > 3) {
      throw new Error('无效的费率等级索引，必须是 0-3 之间的整数');
    }
    
    // 将索引转换为费率等级
    let feeTier: number;
    
    // 根据索引选择费率等级
    switch(feeTierIndex) {
      case 0:
        feeTier = 0; // 0.01%
        break;
      case 1:
        feeTier = 1; // 0.05%
        break;
      case 2:
        feeTier = 2; // 0.3%
        break;
      case 3:
        feeTier = 3; // 1%
        break;
      default:
        feeTier = 2; // 默认使用0.3%费率
    }
    
    const pool = await sdk.Pool.getPoolByTokenPairAndFeeTier({
      token1,
      token2,
      feeTier
    });
    
    if (!pool) {
      return null;
    }
    
    // 计算价格
    const token1Price = calculatePrice(pool.sqrtPrice, pool.token1Decimals, pool.token2Decimals, true);
    const token2Price = calculatePrice(pool.sqrtPrice, pool.token1Decimals, pool.token2Decimals, false);
    
    return {
      ...pool,
      token1Price,
      token2Price
    };
  } catch (error) {
    console.error('根据代币对获取池子失败:', error);
    return null;
  }
}

/**
 * 计算代币价格
 * @param sqrtPrice 价格的平方根
 * @param token1Decimals 代币1的小数位数
 * @param token2Decimals 代币2的小数位数
 * @param isToken1 是否计算代币1的价格
 * @returns 格式化的价格字符串
 */
function calculatePrice(
  sqrtPrice: string,
  token1Decimals: number,
  token2Decimals: number,
  isToken1: boolean
): string {
  try {
    const sqrtPriceNum = parseFloat(sqrtPrice);
    if (isNaN(sqrtPriceNum) || sqrtPriceNum === 0) {
      return '0';
    }
    
    // 计算价格
    const price = isToken1 
      ? Math.pow(sqrtPriceNum, 2) * Math.pow(10, token2Decimals - token1Decimals)
      : (1 / Math.pow(sqrtPriceNum, 2)) * Math.pow(10, token1Decimals - token2Decimals);
    
    // 格式化价格
    if (price < 0.000001) {
      return price.toExponential(6);
    } else if (price < 0.01) {
      return price.toFixed(6);
    } else if (price < 1000) {
      return price.toFixed(4);
    } else {
      return price.toFixed(2);
    }
  } catch (error) {
    console.error('计算价格失败:', error);
    return '0';
  }
}
