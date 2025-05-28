import { Aptos, AccountAddress } from "@aptos-labs/ts-sdk";
import { USER_PRIVATE_KEY } from "./config";
import { createAptosClient, createAccountFromPrivateKey, getContractAddress, TOKEN_METADATA } from "./utils";
import { depositCoins } from "./depositCoins";

/**
 * 确保资源账户有对应代币的 FungibleStore
 * 这个脚本通过存入小额代币来创建 FungibleStore
 * 
 * @param metadataId 代币元数据对象 ID
 */
async function ensureFungibleStore(metadataId: string) {
  try {
    // 创建 Aptos 客户端
    const aptos = createAptosClient();
    
    // 创建用户账户
    const user = createAccountFromPrivateKey(USER_PRIVATE_KEY);
    
    console.log(`用户地址: ${user.accountAddress}`);
    console.log(`元数据对象 ID: ${metadataId}`);
    
    // 获取合约地址
    const contractAddress = getContractAddress();
    console.log(`合约地址: ${contractAddress}`);
    
    // 查询资源账户地址
    console.log("正在查询资源账户地址...");
    const resources = await aptos.getAccountResources({
      accountAddress: contractAddress,
    });
    
    const resourceCapability = resources.find(
      (r) => r.type.includes("ResourceSignerCapability")
    );
    
    if (!resourceCapability) {
      console.error("未找到资源账户能力，请确保合约已正确部署");
      return;
    }
    
    const data = resourceCapability.data as any;
    const resourceAccountAddress = data.signer_cap.account;
    console.log(`资源账户地址: ${resourceAccountAddress}`);
    
    // 我们将使用存款脚本来创建 FungibleStore
    console.log("正在尝试存入小额代币来创建 FungibleStore...");
    
    // 存入一个非常小的金额，只是为了创建 FungibleStore
    // 这里使用 1 作为最小单位
    await depositCoins(metadataId, 1);
    
    console.log(`存款操作完成，应该已经创建了 FungibleStore`);
    
    // 再次检查资源账户的 FungibleStore
    console.log("正在再次检查 FungibleStore...");
    const resourceAccountResources = await aptos.getAccountResources({
      accountAddress: resourceAccountAddress,
    });
    
    // 查找包含 FungibleStore 的资源
    const fungibleStores = resourceAccountResources.filter(
      (r) => r.type.includes("FungibleStore")
    );
    
    console.log(`资源账户现在有 ${fungibleStores.length} 个 FungibleStore 资源`);
    
    // 检查是否有匹配的 FungibleStore
    const matchingStore = fungibleStores.find(
      (r) => JSON.stringify(r).includes(metadataId)
    );
    
    if (matchingStore) {
      console.log(`✅ 成功创建了 ${metadataId} 代币的 FungibleStore!`);
    } else {
      console.error(`❌ 未能创建 ${metadataId} 代币的 FungibleStore。`);
    }
    
  } catch (error) {
    console.error("创建 FungibleStore 失败:", error);
  }
}

// 如果直接运行脚本，从命令行参数获取参数
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("用法: pnpm ts-node ensureFungibleStore.ts <元数据对象ID>");
    console.error("示例: pnpm ts-node ensureFungibleStore.ts 0x000000000000000000000000000000000000000000000000000000000000000a");
    console.error("常用代币元数据对象 ID:");
    console.error("  APT: " + TOKEN_METADATA.APT);
    console.error("  USDC: " + TOKEN_METADATA.USDC);
    console.error("  USDT: " + TOKEN_METADATA.USDT);
    console.error("  KING: " + TOKEN_METADATA.KING);
    process.exit(1);
  }
  
  const metadataId = args[0];
  ensureFungibleStore(metadataId);
}

// 导出函数以便其他脚本使用
export { ensureFungibleStore };
