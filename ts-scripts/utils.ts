import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { CONTRACT_ADDRESS, NETWORK } from "./config";

// 创建 Aptos 客户端
export function createAptosClient() {
  const config = new AptosConfig({ network: NETWORK });
  return new Aptos(config);
}

// 从私钥创建账户
export function createAccountFromPrivateKey(privateKeyHex: string) {
  if (!privateKeyHex) {
    throw new Error("私钥不能为空");
  }
  
  // 处理私钥格式，移除 ed25519-priv-0x 或 0x 前缀
  let cleanedKey = privateKeyHex;
  if (privateKeyHex.startsWith("ed25519-priv-0x")) {
    cleanedKey = privateKeyHex.substring("ed25519-priv-0x".length);
  } else if (privateKeyHex.startsWith("0x")) {
    cleanedKey = privateKeyHex.substring(2);
  }
  
  // 将十六进制私钥转换为字节数组
  const privateKeyBytes = Uint8Array.from(
    Buffer.from(cleanedKey, "hex")
  );
  
  const privateKey = new Ed25519PrivateKey(privateKeyBytes);
  return Account.fromPrivateKey({ privateKey });
}

// 获取合约地址
export function getContractAddress() {
  return CONTRACT_ADDRESS;
}

// 等待交易完成并打印结果
export async function waitForTransaction(aptos: Aptos, txHash: string) {
  console.log(`等待交易完成: ${txHash}`);
  const result = await aptos.waitForTransaction({ transactionHash: txHash });
  console.log(`交易已确认，状态: ${result.success ? "成功" : "失败"}`);
  return result;
}

/**
 * 获取代币的元数据对象 ID
 * @param aptos Aptos 客户端
 * @param coinType 代币类型字符串，例如 "0x1::aptos_coin::AptosCoin"
 * @returns 元数据对象 ID
 */
export async function getMetadataObjectId(aptos: Aptos, coinType: string): Promise<string> {
  console.log(`正在获取代币 ${coinType} 的元数据对象 ID...`);
  
  try {
    // 注意：在实际部署中，应该使用下面的查询逻辑来获取真实的元数据对象 ID
    // 这里我们展示两种方法：
    
    // 方法 1：使用 Aptos API 查询代币信息
    // 这里可以调用 Aptos SDK 的 API 来获取代币的元数据对象 ID
    // 例如：
    // const response = await aptos.view({
    //   function: "0x1::coin::metadata",
    //   type_arguments: [coinType],
    //   arguments: [],
    // });
    // const metadataObjectId = response.data;
    
    // 方法 2：使用预定义的映射表
    // 在实际部署中，您可能需要维护一个代币类型到元数据对象 ID 的映射表
    const coinTypeToMetadataMap: Record<string, string> = {
      "0x1::aptos_coin::AptosCoin": "0x1::aptos_coin::AptosCoin", // 这里应该是真实的元数据对象 ID
      "0x1::usdc::USDC": "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b", // 示例 ID
      "0x1::usdt::USDT": "0x3c8e5c0a0b2a0da2e0e14e0f9b6a9f8f6973d952a8c7e0fb3fb8a95c4f426b27", // 示例 ID
      // 添加更多代币类型和对应的元数据对象 ID
    };
    
    // 如果有预定义的映射，使用它
    if (coinTypeToMetadataMap[coinType]) {
      const metadataObjectId = coinTypeToMetadataMap[coinType];
      console.log(`从映射表中获取到元数据对象 ID: ${metadataObjectId}`);
      return metadataObjectId;
    }
    
    // 如果没有预定义的映射，使用代币类型字符串本身
    // 注意：这只是一个临时解决方案，实际部署时应该使用真实的元数据对象 ID
    console.log(`未找到预定义的元数据对象 ID，使用代币类型字符串作为替代`);
    
    // 解析代币类型字符串，获取地址部分
    const parts = coinType.split("::");
    if (parts.length < 2) {
      throw new Error(`无效的代币类型格式: ${coinType}`);
    }
    
    // 获取地址部分
    let address = parts[0];
    if (!address.startsWith("0x")) {
      address = `0x${address}`;
    }
    
    console.log(`使用地址作为元数据对象 ID: ${address}`);
    return address;
  } catch (error) {
    console.error(`获取元数据对象 ID 失败:`, error);
    throw error;
  }
}
