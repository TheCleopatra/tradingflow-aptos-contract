import { Aptos, AccountAddress } from "@aptos-labs/ts-sdk";
import { USER_PRIVATE_KEY } from "../config";
import { createAptosClient, createAccountFromPrivateKey, getContractAddress, waitForTransaction, TOKEN_METADATA } from "../utils/common";

/**
 * 用户存款脚本
 * 对应 Move 函数: user_deposit
 * 
 * @param metadataId 代币元数据对象 ID，例如 "0x000000000000000000000000000000000000000000000000000000000000000a"
 * @param amount 存款金额
 */
export async function depositCoins(metadataId: string, amount: number) {
  try {
    // 创建 Aptos 客户端
    const aptos = createAptosClient();
    
    // 创建用户账户
    const user = createAccountFromPrivateKey(USER_PRIVATE_KEY);
    
    console.log(`用户地址: ${user.accountAddress}`);
    console.log(`元数据对象 ID: ${metadataId}`);
    console.log(`存款金额: ${amount}`);
    
    // 构建交易
    const transaction = await aptos.transaction.build.simple({
      sender: user.accountAddress,
      data: {
        function: `${getContractAddress()}::vault::user_deposit`,
        functionArguments: [metadataId, amount],
      },
    });
    
    // 签名并提交交易
    console.log("正在存款...");
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: user,
      transaction,
    });
    
    // 等待交易完成
    await waitForTransaction(aptos, committedTxn.hash);
    
    console.log(`存款成功！已存入 ${amount} 单位的代币到金库。`);
  } catch (error) {
    console.error("存款失败:", error);
  }
}

// 如果直接运行脚本，从命令行参数获取参数
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("用法: pnpm ts-node core/depositCoins.ts <元数据对象ID> <金额>");
    console.error("示例: pnpm ts-node core/depositCoins.ts 0x000000000000000000000000000000000000000000000000000000000000000a 100");
    console.error("常用代币元数据对象 ID:");
    console.error("  APT: " + TOKEN_METADATA.APT);
    console.error("  USDC: " + TOKEN_METADATA.USDC);
    console.error("  USDT: " + TOKEN_METADATA.USDT);
    console.error("  KING: " + TOKEN_METADATA.KING);
    process.exit(1);
  }
  
  const metadataId = args[0];
  const amount = parseInt(args[1], 10);
  
  if (isNaN(amount)) {
    console.error("存款金额必须是有效的数字");
    process.exit(1);
  }
  
  depositCoins(metadataId, amount);
}

// 已在函数定义处导出
