import { Aptos, AccountAddress } from "@aptos-labs/ts-sdk";
import { BOT_PRIVATE_KEY } from "./config";
import { createAptosClient, createAccountFromPrivateKey, getContractAddress, waitForTransaction } from "./utils";

/**
 * 交易信号脚本
 * 对应 Move 函数: send_trade_signal
 * 允许白名单中的机器人代表用户在 Hyperion DEX 上执行交易
 * 
 * @param userAddress 用户地址
 * @param fromTokenType 源代币类型，例如 "0x1::aptos_coin::AptosCoin"
 * @param toTokenType 目标代币类型，例如 "0x1::aptos_coin::AptosCoin"
 * @param feeTier 费率等级 (0-3)
 * @param amountIn 输入金额
 * @param amountOutMin 最小输出金额
 * @param sqrtPriceLimit 价格限制的平方根 (通常设为0表示无限制)
 * @param recipient 接收者地址 (通常是用户自己的地址)
 * @param deadline 截止时间戳 (Unix 时间戳)
 */
async function tradeSignal(
  userAddress: string,
  fromTokenType: string,
  toTokenType: string,
  feeTier: number,
  amountIn: number,
  amountOutMin: number,
  sqrtPriceLimit: string,
  recipient: string,
  deadline: number
) {
  try {
    // 创建 Aptos 客户端
    const aptos = createAptosClient();
    
    // 创建机器人账户
    const bot = createAccountFromPrivateKey(BOT_PRIVATE_KEY);
    
    console.log(`机器人地址: ${bot.accountAddress}`);
    console.log(`用户地址: ${userAddress}`);
    console.log(`源代币类型: ${fromTokenType}`);
    console.log(`目标代币类型: ${toTokenType}`);
    console.log(`输入金额: ${amountIn}`);
    console.log(`最小输出金额: ${amountOutMin}`);
    
    // 将用户地址和接收者地址转换为AccountAddress对象
    const userAccountAddress = AccountAddress.from(userAddress);
    const recipientAddress = AccountAddress.from(recipient);
    
    // 构建交易
    const transaction = await aptos.transaction.build.simple({
      sender: bot.accountAddress,
      data: {
        function: `${getContractAddress()}::vault::send_trade_signal`,
        functionArguments: [
          userAccountAddress,
          fromTokenType,
          toTokenType,
          feeTier,
          amountIn,
          amountOutMin,
          sqrtPriceLimit,
          recipientAddress,
          deadline
        ],
      },
    });
    
    // 签名并提交交易
    console.log("正在发送交易信号...");
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: bot,
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
  if (args.length < 9) {
    console.error("用法: pnpm ts-node tradeSignal.ts <用户地址> <源代币类型> <目标代币类型> <费率等级> <输入金额> <最小输出金额> <价格限制> <接收者地址> <截止时间戳>");
    console.error("示例: pnpm ts-node tradeSignal.ts 0x123...abc 0x1::aptos_coin::AptosCoin 0x1::usdc::USDC 1 100 95 0 0x123...abc " + Math.floor(Date.now() / 1000 + 3600));
    process.exit(1);
  }
  
  const userAddress = args[0];
  const fromTokenType = args[1];
  const toTokenType = args[2];
  const feeTier = parseInt(args[3], 10);
  const amountIn = parseInt(args[4], 10);
  const amountOutMin = parseInt(args[5], 10);
  const sqrtPriceLimit = args[6];
  const recipient = args[7];
  const deadline = parseInt(args[8], 10);
  
  if (isNaN(feeTier) || isNaN(amountIn) || isNaN(amountOutMin) || isNaN(deadline)) {
    console.error("费率等级、输入金额、最小输出金额和截止时间戳必须是有效的数字");
    process.exit(1);
  }
  
  tradeSignal(
    userAddress,
    fromTokenType,
    toTokenType,
    feeTier,
    amountIn,
    amountOutMin,
    sqrtPriceLimit,
    recipient,
    deadline
  );
}

// 导出函数以便其他脚本使用
export { tradeSignal };
