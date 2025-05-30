import { Aptos, AccountAddress } from "@aptos-labs/ts-sdk";
import { USER_PRIVATE_KEY } from "../config";
import { createAptosClient, createAccountFromPrivateKey, getContractAddress } from "../utils/common";

/**
 * 查询用户在金库中的余额
 * 
 * @param userAddress 用户地址，如果不提供则使用环境变量中的用户地址
 * @returns 用户在金库中的余额信息，格式为 { [coinType: string]: { amount: string, metadata?: TokenMetadata } }
 */
interface TokenMetadata {
  name: string;
  symbol: string;
  decimals: number;
  supply?: string;
}

interface BalanceInfo {
  amount: string;
  metadata?: TokenMetadata;
  metadataObjectId?: string;
}

async function getBalances(userAddress?: string): Promise<Record<string, BalanceInfo>> {
  try {
    // 创建 Aptos 客户端
    const aptos = createAptosClient();
    
    // 如果没有提供用户地址，则使用环境变量中的用户地址
    let address: string;
    if (userAddress) {
      address = userAddress;
    } else {
      const user = createAccountFromPrivateKey(USER_PRIVATE_KEY);
      address = user.accountAddress.toString();
    }
    
    console.log(`查询用户地址: ${address} 的余额`);
    
    // 获取用户的 BalanceManager 资源
    const contractAddress = getContractAddress();
    // 使用类型断言来确保类型正确
    const balanceManagerType = `${contractAddress}::vault::BalanceManager` as `${string}::${string}::${string}`;
    
    try {
      const resource = await aptos.getAccountResource({
        accountAddress: address,
        resourceType: balanceManagerType,
      });
      
      console.log("余额管理器信息:");
      console.log(JSON.stringify(resource, null, 2));
      
      // 从资源中提取余额信息
      if (resource && 'data' in resource) {
        const data = resource.data as any;
        const result: Record<string, BalanceInfo> = {};
        
        if (data.balances && Array.isArray(data.balances.data)) {
          console.log("\n用户余额:");
          console.log("----------------------------------------");
          
          // 遍历并打印每种代币的余额
          for (const entry of data.balances.data) {
            if (entry && entry.key && entry.value) {
              const metadataObjectId = entry.key;
              const amount = entry.value;
              
              // 尝试获取代币的元数据
              try {
                const metadata = await aptos.getAccountResource({
                  accountAddress: metadataObjectId,
                  resourceType: "0x1::fungible_asset::Metadata",
                });
                
                if (metadata && 'data' in metadata) {
                  const metaData = metadata.data as any;
                  const tokenMetadata: TokenMetadata = {
                    name: metaData.name || '未知',
                    symbol: metaData.symbol || '未知',
                    decimals: metaData.decimals || 0,
                  };
                  
                  if (metaData.supply) {
                    tokenMetadata.supply = metaData.supply.toString();
                  }
                  
                  // 根据元数据生成代币类型字符串
                  // 注意：这里的转换只是一个估计，实际上需要从元数据中获取准确的类型信息
                  const coinType = `${metadataObjectId}::${metaData.symbol}`;
                  
                  // 格式化输出
                  console.log(`\n代币类型: ${coinType}`);
                  console.log(`元数据对象ID: ${metadataObjectId}`);
                  console.log(`余额: ${amount}`);
                  console.log(`名称: ${tokenMetadata.name}`);
                  console.log(`符号: ${tokenMetadata.symbol}`);
                  console.log(`小数位: ${tokenMetadata.decimals}`);
                  if (tokenMetadata.supply) {
                    console.log(`总供应量: ${tokenMetadata.supply}`);
                  }
                  
                  result[coinType] = { 
                    amount: amount.toString(),
                    metadata: tokenMetadata,
                    metadataObjectId: metadataObjectId 
                  };
                  
                  console.log(`----------------------------------------`);
                }
              } catch (error) {
                console.log(`\n元数据对象ID: ${metadataObjectId}`);
                console.log(`余额: ${amount}`);
                console.log(`无法获取代币元数据`);
                console.log(`----------------------------------------`);
                
                // 即使无法获取元数据，也将元数据对象ID作为键存储
                result[metadataObjectId] = { 
                  amount: amount.toString(),
                  metadataObjectId: metadataObjectId 
                };
              }
            }
          }
          
          console.log("\n使用说明:");
          console.log("存款命令: pnpm ts-node core/depositCoins.ts <代币类型> <金额>");
          console.log("提款命令: pnpm ts-node core/withdrawCoins.ts <代币类型> <金额>");
          console.log("例如: pnpm ts-node core/depositCoins.ts 0x1::aptos_coin::AptosCoin 1000000");
        } else {
          console.log("用户没有余额记录");
        }
        
        return result;
      } else {
        console.log("无法解析余额管理器数据");
        return {};
      }
    } catch (error) {
      console.log(`用户 ${address} 没有初始化余额管理器`);
      return {};
    }
  } catch (error) {
    console.error("查询余额失败:", error);
    return {};
  }
}

// 如果直接运行脚本，从命令行参数获取参数
if (require.main === module) {
  const args = process.argv.slice(2);
  const userAddress = args[0]; // 可选参数
  
  getBalances(userAddress);
}

// 导出函数以便其他脚本使用
export { getBalances };
