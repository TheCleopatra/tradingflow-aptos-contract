import { Aptos, AccountAddress } from "@aptos-labs/ts-sdk";
import { ADMIN_PRIVATE_KEY } from "../config";
import { createAptosClient, createAccountFromPrivateKey, getContractAddress, waitForTransaction } from "../utils/common";

/**
 * 管理员提款脚本
 * 对应 Move 函数: admin_withdraw
 * 允许管理员从用户的余额管理器中提取代币
 * 
 * @param userAddress 用户地址
 * @param metadataId 代币元数据对象 ID，例如 "0x000000000000000000000000000000000000000000000000000000000000000a"
 * @param amount 提款金额
 */
async function adminWithdraw(
  userAddress: string,
  metadataId: string,
  amount: number
) {
  try {
    // 创建 Aptos 客户端
    const aptos = createAptosClient();
    
    // 创建管理员账户
    const admin = createAccountFromPrivateKey(ADMIN_PRIVATE_KEY);
    
    console.log(`管理员地址: ${admin.accountAddress}`);
    console.log(`用户地址: ${userAddress}`);
    console.log(`代币元数据对象 ID: ${metadataId}`);
    console.log(`提款金额: ${amount}`);
    
    // 将用户地址转换为AccountAddress对象
    const userAccountAddress = AccountAddress.from(userAddress);
    
    // 构建交易
    const transaction = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${getContractAddress()}::vault::admin_withdraw`,
        functionArguments: [
          userAccountAddress,
          metadataId,
          amount
        ],
      },
    });
    
    // 签名并提交交易
    console.log("正在执行管理员提款...");
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: admin,
      transaction,
    });
    
    // 等待交易完成
    await waitForTransaction(aptos, committedTxn.hash);
    
    console.log(`管理员提款成功！已从用户 ${userAddress} 提取 ${amount} 单位的代币。`);
  } catch (error) {
    console.error("管理员提款失败:", error);
  }
}

// 如果直接运行脚本，从命令行参数获取参数
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 3) {
    console.error("用法: pnpm ts-node core/adminWithdraw.ts <用户地址> <代币元数据对象ID> <金额>");
    console.error("示例: pnpm ts-node core/adminWithdraw.ts 0x123...abc 0x000000000000000000000000000000000000000000000000000000000000000a 1000000");
    process.exit(1);
  }
  
  const userAddress = args[0];
  const metadataId = args[1];
  const amount = parseInt(args[2], 10);
  
  if (isNaN(amount) || amount <= 0) {
    console.error("金额必须是大于0的整数");
    process.exit(1);
  }
  
  adminWithdraw(userAddress, metadataId, amount);
}

// 导出函数以便其他脚本使用
export { adminWithdraw };
