declare module '@hyperionxyz/sdk' {
  import { Network } from '@aptos-labs/ts-sdk';

  export interface HyperionSDKConfig {
    network: Network;
    APTOS_API_KEY: string; // 使用APTOS_GRAPHQL_API_KEY作为值
  }

  export function initHyperionSDK(config: HyperionSDKConfig): HyperionSDK;

  export interface HyperionSDK {
    Pool: PoolService;
  }

  export interface PoolService {
    fetchAllPools(): Promise<PoolInfo[]>;
    fetchPoolById(params: { poolId: string }): Promise<PoolInfo | null>;
    getPoolByTokenPairAndFeeTier(params: { token1: string; token2: string; feeTier: FeeTierIndex }): Promise<PoolInfo | null>;
  }

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
  }

  export enum FeeTierIndex {
    "PER_0.01_SPACING_1" = 0,
    "PER_0.05_SPACING_10" = 1,
    "PER_0.3_SPACING_60" = 2,
    "PER_1_SPACING_200" = 3
  }
}
