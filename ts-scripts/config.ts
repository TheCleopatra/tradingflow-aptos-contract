import { Network } from "@aptos-labs/ts-sdk";
import * as dotenv from "dotenv";

dotenv.config({ path: "../.env" });

// 合约地址
export const CONTRACT_ADDRESS = process.env.TRADINGFLOW_VAULT_ADDRESS || "";

// 网络配置
export const NETWORK = Network.MAINNET;

// 私钥配置 (从环境变量中获取，确保安全性)
export const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY || "";
export const USER_PRIVATE_KEY = process.env.USER_PRIVATE_KEY || "";

// 验证配置
if (!ADMIN_PRIVATE_KEY || !USER_PRIVATE_KEY) {
  console.warn("警告: 未设置所有必要的私钥环境变量。请在.env文件中设置ADMIN_PRIVATE_KEY和USER_PRIVATE_KEY。");
}
