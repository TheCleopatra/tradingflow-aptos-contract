import { Account, Aptos, AptosConfig, Ed25519PrivateKey, Network } from "@aptos-labs/ts-sdk";
import { CONTRACT_ADDRESS, NETWORK } from "../config";

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
  APT_FA: "0xa", // 专门用来解析 APT 的 FungibleAsset 版本
  
  // 稳定币
  USDC: "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
  USDC_ALT: "0xebbe631401ed3b465a68a4c6f5a96a90339153c582aa71ca817bdbf33d50fd21", // 另一个 USDC 元数据 ID
  USDT: "0x3c8e5c0a0b2a0da2e0e14e0f9b6a9f8f6973d952a8c7e0fb3fb8a95c4f426b27",
  USDt: "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b", // 另一个 USDt 元数据 ID
  USDa: "0xace541cbd9b5d60f38cf545ac27738353f70b4f9b970c37a54cf7acfd19dad76", // USDa 稳定币
  
  // BTC 相关代币
  aBTC: "0xdf7cf2b458485050748e4e4001685e15e4cb0819ad9dcedcbba963662dc54350", // Aptos BTC
  xBTC: "0x9598794dbdfee2891a28ad669b7fb2d250eebbbcce8100a2f45800cf9fb85e35", // Wrapped BTC
  
  // ETH 相关代币
  lzWETH: "0xb614bfdf9edc39b330bbf9c3c5bcd0473eee2f6d4e21748629cc367869ece627", // LayerZero Wrapped ETH
  
  // Aptos 相关代币
  amAPT: "0xe568e9322107a5c9ba4cbd05a630a5586aa73e744ada246c3efb0f4ce3e295f3", // Amnis APT
  stAPT: "0x111ae3e5bc816a5e63c2da97d0aa3886519e0cd5e4b046659fa35796bd11542a", // Staked APT
  
  // 其他代币
  KING: "0x432cab29409f83cb74141f231be9b7a70a5daa259bf0808ae33f3e07fec410be",
  AMI: "0x9598794dbdfee2891a28ad669b7fb2d250eebbbcce8100a2f45800cf9fb85e35" // Amnis Token
};
