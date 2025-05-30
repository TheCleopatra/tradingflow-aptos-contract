import { Aptos } from "@aptos-labs/ts-sdk";
import { USER_PRIVATE_KEY } from "../config";
import { createAptosClient, createAccountFromPrivateKey, getContractAddress, waitForTransaction } from "../utils/common";

/**
 * 初始化用户的余额管理器
 * 对应 Move 脚本: init_vault.move
 */
export async function initVault() {
  try {
    // 创建 Aptos 客户端
    const aptos = createAptosClient();
    
    // 创建用户账户
    const user = createAccountFromPrivateKey(USER_PRIVATE_KEY);
    
    console.log(`用户地址: ${user.accountAddress}`);
    
    // 构建交易
    const transaction = await aptos.transaction.build.simple({
      sender: user.accountAddress,
      data: {
        function: `${getContractAddress()}::vault::create_balance_manager`,
        functionArguments: [],
      },
    });
    
    // 签名并提交交易
    console.log("正在初始化用户余额管理器...");
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: user,
      transaction,
    });
    
    // 等待交易完成
    await waitForTransaction(aptos, committedTxn.hash);
    
    console.log("用户余额管理器初始化成功！");
  } catch (error) {
    console.error("初始化用户余额管理器失败:", error);
  }
}

// 执行脚本
initVault();
