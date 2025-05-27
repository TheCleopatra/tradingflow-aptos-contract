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
 * 常用代币的元数据对象 ID
 */
export const TOKEN_METADATA = {
  // Aptos 币
  APT: "0x000000000000000000000000000000000000000000000000000000000000000a",
  // 其他常用代币
  USDC: "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
  USDT: "0x3c8e5c0a0b2a0da2e0e14e0f9b6a9f8f6973d952a8c7e0fb3fb8a95c4f426b27",
  // 可以根据需要添加更多代币
  KING: "0x432cab29409f83cb74141f231be9b7a70a5daa259bf0808ae33f3e07fec410be"
};
