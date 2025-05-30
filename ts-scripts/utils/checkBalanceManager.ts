import { Aptos, AccountAddress } from "@aptos-labs/ts-sdk";
import { createAptosClient, getContractAddress, TOKEN_METADATA } from "../utils/common";

/**
 * 检查用户的余额管理器
 * 这个脚本用于查询指定地址的余额管理器，并显示其中的所有代币余额
 * 
 * @param userAddress 用户地址（可选，如果不提供则从命令行参数获取）
 */
export async function checkBalanceManager(userAddress?: string) {
  try {
    const aptos = createAptosClient();
    
    // 如果没有提供用户地址，则从命令行参数获取
    if (!userAddress && process.argv.length > 2) {
      userAddress = process.argv[2];
    }
    
    if (!userAddress) {
      console.error("请提供用户地址");
      return;
    }
    
    console.log(`正在查询用户 ${userAddress} 的余额管理器...`);
    
    // 查询用户资源
    const resources = await aptos.getAccountResources({
      accountAddress: userAddress,
    });
    
    // 查找余额管理器资源
    const contractAddress = getContractAddress();
    const balanceManagerType = `${contractAddress}::vault::BalanceManager`;
    
    const balanceManager = resources.find(
      (r) => r.type === balanceManagerType
    );
    
    if (!balanceManager) {
      console.log(`用户 ${userAddress} 没有余额管理器，可能需要先初始化`);
      return;
    }
    
    console.log("找到余额管理器:");
    
    // 获取余额管理器数据
    const data = balanceManager.data as any;
    
    // 显示余额管理器所有者
    console.log(`余额管理器所有者: ${data.owner}`);
    
    // 显示余额信息
    console.log("\n余额信息:");
    
    if (data.balances && data.balances.data && data.balances.data.length > 0) {
      // 创建一个表格来显示余额
      console.log("代币名称\t\t元数据对象ID\t\t\t\t\t余额");
      console.log("--------------------------------------------------------------");
      
      for (const balance of data.balances.data) {
        // 确保正确提取元数据对象ID
        const metadataId = balance.key && balance.key.inner ? balance.key.inner : balance.key;
        const amount = balance.value;
        
        // 尝试找到代币名称
        let tokenName = "未知代币";
        for (const [name, id] of Object.entries(TOKEN_METADATA)) {
          if (id === metadataId) {
            tokenName = name;
            break;
          }
        }
        
        // 格式化余额显示，根据代币的精度进行转换
        let formattedAmount = amount;
        if (tokenName === 'APT') {
          // APT 的精度是 8
          formattedAmount = `${amount} (${Number(amount) / 100000000} APT)`;
        } else if (tokenName === 'USDC' || tokenName === 'USDT') {
          // USDC/USDT 的精度是 6
          formattedAmount = `${amount} (${Number(amount) / 1000000} ${tokenName})`;
        }
        
        console.log(`${tokenName}\t\t${metadataId}\t\t${formattedAmount}`);
      }
    } else {
      console.log("余额管理器中没有任何代币余额");
    }
    
    // 显示事件信息
    console.log("\n事件信息:");
    console.log("注意: 合约现在使用模块事件系统，事件不再存储在资源中。");
    console.log("要查询事件，请使用 Aptos Explorer 或 GraphQL API。");
    
    return balanceManager;
  } catch (error) {
    console.error("查询余额管理器失败:", error);
    return null;
  }
}

// 如果直接运行脚本
if (require.main === module) {
  // 从命令行参数获取用户地址
  const userAddress = process.argv[2];
  
  if (!userAddress) {
    console.error("用法: pnpm ts-node utils/checkBalanceManager.ts <用户地址>");
    process.exit(1);
  }
  
  checkBalanceManager(userAddress);
}
