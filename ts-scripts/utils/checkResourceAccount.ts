import { Aptos, AccountAddress } from "@aptos-labs/ts-sdk";
import { createAptosClient, getContractAddress, TOKEN_METADATA } from "../utils/common";

/**
 * 检查资源账户信息
 * 这个脚本用于检查合约的资源账户信息，包括资源账户地址、签名者能力和 FungibleStore 的存在情况
 */
async function checkResourceAccount() {
  try {
    const aptos = createAptosClient();
    const contractAddress = getContractAddress();
    
    console.log(`合约地址: ${contractAddress}`);
    
    // 查询合约资源
    console.log("正在查询合约资源...");
    const resources = await aptos.getAccountResources({
      accountAddress: contractAddress,
    });
    
    // 查找 ResourceSignerCapability 资源
    const resourceCapability = resources.find(
      (r) => r.type.includes("ResourceSignerCapability")
    );
    
    if (resourceCapability) {
      console.log("找到资源账户能力:", JSON.stringify(resourceCapability, null, 2));
      
      // 获取资源账户地址
      const data = resourceCapability.data as any;
      const resourceAccountAddress = data.signer_cap.account;
      console.log(`资源账户地址: ${resourceAccountAddress}`);
      
      // 查询 Version 资源
      const versionResource = resources.find(
        (r) => r.type.includes("Version")
      );
      
      if (versionResource) {
        console.log("合约版本信息:", JSON.stringify(versionResource, null, 2));
      }
      
      // 查询 AccessList 资源
      const accessListResource = resources.find(
        (r) => r.type.includes("AccessList")
      );
      
      if (accessListResource) {
        console.log("访问控制列表:", JSON.stringify(accessListResource, null, 2));
      }
      
      // 检查资源账户的资源
      console.log("\n正在查询资源账户的资源...");
      const resourceAccountResources = await aptos.getAccountResources({
        accountAddress: resourceAccountAddress,
      });
      
      console.log(`资源账户有 ${resourceAccountResources.length} 个资源`);
      
      // 检查常用代币的 FungibleStore
      console.log("\n检查资源账户的 FungibleStore:");
      
      // 检查 APT 代币
      await checkFungibleStore(aptos, resourceAccountAddress, "APT", TOKEN_METADATA.APT);
      
      // 检查 USDC 代币
      await checkFungibleStore(aptos, resourceAccountAddress, "USDC", TOKEN_METADATA.USDC);
      
      // 检查 USDT 代币
      await checkFungibleStore(aptos, resourceAccountAddress, "USDT", TOKEN_METADATA.USDT);
      
      // 检查 KING 代币
      await checkFungibleStore(aptos, resourceAccountAddress, "KING", TOKEN_METADATA.KING);
      
    } else {
      console.log("未找到资源账户能力，可能需要重新部署合约");
    }
    
    // 提供一些建议
    console.log("\n建议:");
    console.log("1. 如果未找到资源账户能力，请使用 cl2 账户重新部署合约");
    console.log("2. 如果找到资源账户能力但缺少 FungibleStore，请先执行存款操作创建 FungibleStore");
    console.log("3. 确保 .env 文件中的 CONTRACT_ADDRESS 设置为 cl2 的地址");
    console.log("4. 确保所有脚本使用正确的账户私钥");
    
  } catch (error) {
    console.error("查询失败:", error);
  }
}

/**
 * 检查特定代币的 FungibleStore 是否存在
 * @param aptos Aptos 客户端
 * @param contractAddress 合约地址
 * @param tokenName 代币名称
 * @param metadataId 代币元数据对象 ID
 */
async function checkFungibleStore(aptos: Aptos, contractAddress: string, tokenName: string, metadataId: string) {
  try {
    console.log(`检查 ${tokenName} 代币 (${metadataId}):`);
    
    // 查询合约的 FungibleStore 资源
    const resources = await aptos.getAccountResources({
      accountAddress: contractAddress,
    });
    
    // 查找包含 FungibleStore 的资源
    const fungibleStores = resources.filter(
      (r) => r.type.includes("FungibleStore")
    );
    
    console.log(`  找到 ${fungibleStores.length} 个 FungibleStore 资源`);
    
    // 检查是否有匹配的 FungibleStore
    const matchingStore = fungibleStores.find(
      (r) => JSON.stringify(r).includes(metadataId)
    );
    
    if (matchingStore) {
      console.log(`  ✅ 找到 ${tokenName} 代币的 FungibleStore:`, JSON.stringify(matchingStore, null, 2));
    } else {
      console.log(`  ❌ 未找到 ${tokenName} 代币的 FungibleStore`);
      console.log(`  建议: 执行存款操作来创建 ${tokenName} 代币的 FungibleStore`);
    }
    
  } catch (error) {
    console.error(`  检查 ${tokenName} 代币的 FungibleStore 失败:`, error);
  }
}

// 如果直接运行脚本
if (require.main === module) {
  checkResourceAccount();
}

// 导出函数以便其他脚本使用
export { checkResourceAccount, checkFungibleStore };
