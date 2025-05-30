import { Aptos, AccountAddress } from "@aptos-labs/ts-sdk";
import { USER_PRIVATE_KEY, ADMIN_PRIVATE_KEY } from "../config";
import { createAptosClient, createAccountFromPrivateKey, TOKEN_METADATA, waitForTransaction } from "../utils/common";
import { checkBalanceManager } from "../utils/checkBalanceManager";
import { tradeSignal } from "../core/tradeSignal";

/**
 * 综合测试脚本 2
 * 这个脚本专注于管理员代表用户发送交易信号：
 * 1. 管理员代表用户在 DEX 上交换 APT 到 USDC
 * 2. 查询交换前后的余额
 */
async function runIntegrationTest2() {
  try {
    console.log("开始执行管理员代理交易测试...");

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

    // 查询初始余额
    console.log("\n交易前的用户余额管理器状态:");
    await checkBalanceManager(userAddress);

    // 执行管理员代理交易
    console.log("\n管理员代表用户发送交易信号: APT -> USDC");

    // 交易参数
    const fromToken = TOKEN_METADATA.APT; // 使用 APT 元数据 ID
    const toToken = TOKEN_METADATA.USDC; // 使用 USDC 元数据 ID
    const feeTier = 1; // 费率等级 (0.05%)
    const amountIn = 200000; // 0.002 APT
    const amountOutMin = 0; // 最小输出金额，设为 0 表示接受任何数量
    // 使用一个有效的 sqrtPriceLimit 值，而不是 "0"
    // 这个值代表一个非常大的价格限制，实际上相当于无限制
    const sqrtPriceLimit = "4295128740"; // 一个大的数值，代表极高的价格限制
    const deadline = Math.floor(Date.now() / 1000) + 60; // 截止时间为当前时间 + 1 分钟

    // 管理员代表用户发送交易信号
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

    // 查询交易后的余额
    console.log("\n交易后的用户余额管理器状态:");
    await checkBalanceManager(userAddress);

    // 查询原生代币余额
    console.log("\n用户原生代币余额:");
    await checkUserNativeBalance(aptos, userAddress);

    console.log("\n管理员代理交易测试完成!");
  } catch (error) {
    console.error("管理员代理交易测试失败:", error);
  }
}

/**
 * 查询用户原生余额
 * 显示用户账户中的原生代币余额
 */
async function checkUserNativeBalance(aptos: Aptos, userAddress: string) {
  try {
    // 查询 APT 余额
    const aptBalance = await aptos.getAccountCoinAmount({
      accountAddress: userAddress,
      coinType: "0x1::aptos_coin::AptosCoin"
    });

    console.log(`APT 余额: ${aptBalance} (${Number(aptBalance) / 100000000} APT)`);

    // 尝试查询 USDC 余额
    try {
      const usdcBalance = await aptos.getAccountCoinAmount({
        accountAddress: userAddress,
        coinType: "0x5e156f1207d0ebfa19a9eeff00d62a282278fb8719f4fab3a586a0a2c0fffbea::coin::T" // USDC 代币类型
      });

      console.log(`USDC 余额: ${usdcBalance} (${Number(usdcBalance) / 1000000} USDC)`);
    } catch (error) {
      console.log("未找到 USDC 余额或查询出错");
    }

    // 查询其他常用代币余额
    try {
      const usdtBalance = await aptos.getAccountCoinAmount({
        accountAddress: userAddress,
        coinType: "0xa2eda21a58856fda86451436513b867c97eecb4ba099da5775520e0f7492e852::coin::T" // USDT 代币类型
      });

      console.log(`USDT 余额: ${usdtBalance} (${Number(usdtBalance) / 1000000} USDT)`);
    } catch (error) {
      console.log("未找到 USDT 余额或查询出错");
    }
  } catch (error) {
    console.error("查询余额失败:", error);
  }
}

// 如果直接运行脚本
if (require.main === module) {
  runIntegrationTest2();
}

// 导出函数以便其他脚本使用
export { runIntegrationTest2 };
