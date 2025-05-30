import { Aptos, AccountAddress } from "@aptos-labs/ts-sdk";
import { ADMIN_PRIVATE_KEY } from "../config";
import { createAptosClient, createAccountFromPrivateKey, getContractAddress, waitForTransaction, TOKEN_METADATA } from "../utils/common";

/**
 * 交易信号脚本
 * 对应 Move 函数: send_trade_signal
 * 允许管理员代表用户在 Hyperion DEX 上执行交易
 * 
 * @param userAddress 用户地址
 * @param fromTokenMetadataId 源代币元数据对象 ID，例如 "0x000000000000000000000000000000000000000000000000000000000000000a"
 * @param toTokenMetadataId 目标代币元数据对象 ID
 * @param feeTier 费率等级 (0-3)
 * @param amountIn 输入金额
 * @param amountOutMin 最小输出金额
 * @param sqrtPriceLimit 价格限制的平方根 (通常设为0表示无限制)
 * @param deadline 截止时间戳 (Unix 时间戳)
 */
async function tradeSignal(
  userAddress: string,
  fromTokenMetadataId: string,
  toTokenMetadataId: string,
  feeTier: number,
  amountIn: number,
  amountOutMin: number,
  sqrtPriceLimit: string,
  deadline: number
) {
  try {
    // 创建 Aptos 客户端
    const aptos = createAptosClient();
    
    // 创建管理员账户
    const admin = createAccountFromPrivateKey(ADMIN_PRIVATE_KEY);
    
    console.log(`管理员地址: ${admin.accountAddress}`);
    console.log(`用户地址: ${userAddress}`);
    console.log(`源代币元数据对象 ID: ${fromTokenMetadataId}`);
    console.log(`目标代币元数据对象 ID: ${toTokenMetadataId}`);
    console.log(`输入金额: ${amountIn}`);
    console.log(`最小输出金额: ${amountOutMin}`);
    
    // 将用户地址转换为AccountAddress对象
    const userAccountAddress = AccountAddress.from(userAddress);
    
    // 构建交易
    const transaction = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${getContractAddress()}::vault::send_trade_signal`,
        functionArguments: [
          userAccountAddress,
          fromTokenMetadataId,
          toTokenMetadataId,
          feeTier,
          amountIn,
          amountOutMin,
          sqrtPriceLimit,
          deadline
        ],
      },
    });
    
    // 签名并提交交易
    console.log("正在发送交易信号...");
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: admin,
      transaction,
    });
    
    // 等待交易完成
    await waitForTransaction(aptos, committedTxn.hash);
    
    console.log(`交易信号发送成功！已在 Hyperion DEX 上执行交易。`);
  } catch (error) {
    console.error("发送交易信号失败:", error);
  }
}

// 如果直接运行脚本，从命令行参数获取参数
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 8) {
    console.error("用法: pnpm ts-node core/tradeSignal.ts <用户地址> <源代币元数据对象ID> <目标代币元数据对象ID> <费率等级> <输入金额> <最小输出金额> <价格限制> <截止时间戳>");
    console.error("示例: pnpm ts-node core/tradeSignal.ts 0x123...abc " + TOKEN_METADATA.APT + " " + TOKEN_METADATA.USDC + " 1 100 95 0 " + Math.floor(Date.now() / 1000 + 3600));
    console.error("常用代币元数据对象 ID:");
    console.error("  APT: " + TOKEN_METADATA.APT);
    console.error("  USDC: " + TOKEN_METADATA.USDC);
    console.error("  USDT: " + TOKEN_METADATA.USDT);
    process.exit(1);
  }
  
  const userAddress = args[0];
  const fromTokenMetadataId = args[1];
  const toTokenMetadataId = args[2];
  const feeTier = parseInt(args[3], 10);
  const amountIn = parseInt(args[4], 10);
  const amountOutMin = parseInt(args[5], 10);
  const sqrtPriceLimit = args[6];
  const deadline = parseInt(args[7], 10);
  
  if (isNaN(feeTier) || isNaN(amountIn) || isNaN(amountOutMin) || isNaN(deadline)) {
    console.error("费率等级、输入金额、最小输出金额和截止时间戳必须是有效的数字");
    process.exit(1);
  }
  
  tradeSignal(
    userAddress,
    fromTokenMetadataId,
    toTokenMetadataId,
    feeTier,
    amountIn,
    amountOutMin,
    sqrtPriceLimit,
    deadline
  );
}

// 导出函数以便其他脚本使用
export { tradeSignal };
