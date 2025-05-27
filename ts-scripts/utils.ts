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
