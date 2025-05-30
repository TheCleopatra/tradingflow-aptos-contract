import { Aptos } from "@aptos-labs/ts-sdk";
import { USER_PRIVATE_KEY, ADMIN_PRIVATE_KEY } from "../config";
import { createAptosClient, createAccountFromPrivateKey, TOKEN_METADATA, waitForTransaction } from "../utils/common";
import { initVault } from "../core/initVault";
import { depositCoins } from "../core/depositCoins";
import { withdrawCoins } from "../core/withdrawCoins";
import { tradeSignal } from "../core/tradeSignal";
import { checkBalanceManager } from "../utils/checkBalanceManager";

/**
 * 综合测试脚本 1
 * 这个脚本执行完整的测试流程：
 * 1. 初始化用户的余额管理器
 * 2. 用户存入 APT 代币
 * 3. 用户提取部分 APT 代币
 * 4. 用户将剩余的 APT 代币交换为 USDC 代币
 * 5. 查询最终余额
 */
async function runIntegrationTest1() {
  try {
    console.log("开始执行综合测试 1...");

    // 创建 Aptos 客户端
    const aptos = createAptosClient();

    // 创建用户账户
    const user = createAccountFromPrivateKey(USER_PRIVATE_KEY);
    const userAddress = user.accountAddress.toString();
    
    // 创建管理员账户
    const admin = createAccountFromPrivateKey(ADMIN_PRIVATE_KEY);
    const adminAddress = admin.accountAddress.toString();

    console.log(`用户地址: ${userAddress}`);
    console.log(`管理员地址: ${adminAddress}`);

    // 步骤 1: 初始化用户的余额管理器
    console.log("\n步骤 1: 初始化用户的余额管理器");
    await initVault();

    // 查询余额管理器状态
    console.log("\n初始化后的余额管理器状态:");
    await checkBalanceManager(userAddress);

    // 步骤 2: 用户存入 APT 代币
    console.log("\n步骤 2: 用户存入 APT 代币");

    // 可以调整存款金额
    const depositAmount = 100000000; // 1 APT = 10^8 单位

    await depositCoins(TOKEN_METADATA.APT, depositAmount);

    // 查询存款后的余额管理器状态
    console.log("\n存款后的余额管理器状态:");
    await checkBalanceManager(userAddress);

    // 步骤 3: 用户提取部分 APT 代币
    console.log("\n步骤 3: 用户提取部分 APT 代币");

    // 可以调整提款金额
    const withdrawAmount = 50000000; // 0.5 APT

    await withdrawCoins(TOKEN_METADATA.APT, withdrawAmount);

    // 查询提款后的余额管理器状态
    console.log("\n提款后的余额管理器状态:");
    await checkBalanceManager(userAddress);

    // 步骤 4: 管理员代表用户将剩余的 APT 代币交换为 USDC 代币
    console.log("\n步骤 4: 管理员代表用户将剩余的 APT 代币交换为 USDC 代币");

    // 可以调整交易参数
    const fromToken = TOKEN_METADATA.APT;
    const toToken = TOKEN_METADATA.USDC;
    const feeTier = 1; // 费率等级
    const amountIn = depositAmount - withdrawAmount; // 剩余的 APT 代币
    const amountOutMin = 0; // 最小输出金额，设为 0 表示接受任何数量
    // 使用一个有效的 sqrtPriceLimit 值，而不是 "0"
    // 这个值代表一个非常大的价格限制，实际上相当于无限制
    const sqrtPriceLimit = "4295128740"; // 一个大的数值，代表极高的价格限制
    const deadline = Math.floor(Date.now() / 1000) + 60; // 截止时间为当前时间 + 1 分钟

    console.log(`\n管理员 ${adminAddress} 代表用户 ${userAddress} 发送交易信号`);
    
    // 调用 tradeSignal 函数，由管理员代表用户发送交易信号
    await tradeSignal(
      userAddress,
      fromToken,
      toToken,
      feeTier,
      amountIn,
      amountOutMin,
      sqrtPriceLimit,
      deadline
    );

    // 步骤 5: 查询最终余额
    console.log("\n步骤 5: 查询最终余额");
    console.log("\n交易后的余额管理器状态:");
    await checkBalanceManager(userAddress);

    console.log("\n综合测试 1 完成!");
  } catch (error) {
    console.error("综合测试 1 失败:", error);
  }
}

// 如果直接运行脚本
if (require.main === module) {
  runIntegrationTest1();
}

// 导出函数以便其他脚本使用
export { runIntegrationTest1 };
