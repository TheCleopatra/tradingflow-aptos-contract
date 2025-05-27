import { Aptos, AptosConfig, Network, AccountAddress } from '@aptos-labs/ts-sdk';
import { sdk } from '../index';

/**
 * 代币元数据接口
 */
export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  logoURI?: string;
  projectURL?: string;
  description?: string;
}

/**
 * 获取所有可用代币列表
 * @returns 代币列表
 */
export async function getAllTokens(): Promise<TokenMetadata[]> {
  try {
    // 使用 Hyperion SDK 获取所有池子
    const pools = await sdk.Pool.fetchAllPools();
    
    // 从池子中提取唯一的代币
    const tokenSet = new Set<string>();
    const tokenMetadataMap = new Map<string, TokenMetadata>();
    
    // 遍历所有池子，提取代币信息
    for (const pool of pools) {
      if (pool.token1 && !tokenSet.has(pool.token1)) {
        tokenSet.add(pool.token1);
        const metadata = await getTokenMetadata(pool.token1);
        if (metadata) {
          tokenMetadataMap.set(pool.token1, metadata);
        }
      }
      
      if (pool.token2 && !tokenSet.has(pool.token2)) {
        tokenSet.add(pool.token2);
        const metadata = await getTokenMetadata(pool.token2);
        if (metadata) {
          tokenMetadataMap.set(pool.token2, metadata);
        }
      }
    }
    
    return Array.from(tokenMetadataMap.values());
  } catch (error) {
    console.error('获取代币列表失败:', error);
    throw error;
  }
}

/**
 * 获取特定代币的元数据
 * @param address 代币元数据对象地址
 * @returns 代币元数据
 */
export async function getTokenMetadata(address: string): Promise<TokenMetadata | null> {
  try {
    // 初始化 Aptos 客户端
    const config = new AptosConfig({ 
      network: Network.MAINNET,
      fullnode: process.env.APTOS_NODE_URL,
      indexer: process.env.APTOS_NODE_URL
    });
    const aptos = new Aptos(config);
    
    // 查询代币元数据
    const resource = await aptos.getAccountResource({
      accountAddress: address,
      resourceType: "0x1::fungible_asset::Metadata",
    });
    
    if (!resource || !('data' in resource)) {
      return null;
    }
    
    const data = resource.data as any;
    
    return {
      address,
      name: data.name || 'Unknown',
      symbol: data.symbol || 'UNKNOWN',
      decimals: data.decimals || 0,
      logoURI: data.icon_uri || undefined,
      projectURL: data.project_uri || undefined,
      description: data.description || undefined
    };
  } catch (error) {
    console.error(`获取代币 ${address} 元数据失败:`, error);
    return null;
  }
}

/**
 * 获取 APT 代币的元数据对象ID
 * @returns APT 代币的元数据对象ID
 */
export async function getAptCoinMetadataId(): Promise<string | null> {
  try {
    // 尝试通过已知的 APT 代币类型获取元数据对象ID
    const pools = await sdk.Pool.fetchAllPools();
    
    // 查找包含 APT 代币的池子
    for (const pool of pools) {
      if (pool.token1Symbol === 'APT' || pool.token2Symbol === 'APT') {
        return pool.token1Symbol === 'APT' ? pool.token1 : pool.token2;
      }
    }
    
    return null;
  } catch (error) {
    console.error('获取 APT 代币元数据对象ID失败:', error);
    return null;
  }
}
