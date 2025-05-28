import { Aptos } from "@aptos-labs/ts-sdk";
import { ADMIN_PRIVATE_KEY } from "./config";
import { createAptosClient, createAccountFromPrivateKey, getContractAddress, waitForTransaction } from "./utils";

/**
 * 管理员操作类型
 */
enum AdminAction {
  INIT_VAULT = 0
}

/**
 * 管理员管理脚本
 * 对应 Move 脚本: admin_manage.move
 * 允许管理员初始化金库
 * 
 * @param action 操作类型 (0: 初始化金库)
 */
async function adminManage(action: AdminAction) {
  try {
    // 创建 Aptos 客户端
    const aptos = createAptosClient();
    
    // 创建管理员账户
    const admin = createAccountFromPrivateKey(ADMIN_PRIVATE_KEY);
    
    console.log(`管理员地址: ${admin.accountAddress}`);
    
    if (action === AdminAction.INIT_VAULT) {
      console.log("正在初始化金库...");
      
      // 构建交易
      const transaction = await aptos.transaction.build.simple({
        sender: admin.accountAddress,
        data: {
          function: `${getContractAddress()}::vault::init_vault`,
          functionArguments: [],
        },
      });
      
      // 签名并提交交易
      console.log("正在提交初始化金库交易...");
      const committedTxn = await aptos.signAndSubmitTransaction({
        signer: admin,
        transaction,
      });
      
      // 等待交易完成
      await waitForTransaction(aptos, committedTxn.hash);
      
      console.log("金库初始化成功！");
    } else {
      console.error("不支持的操作类型");
    }
  } catch (error) {
    console.error("管理员操作失败:", error);
  }
}

// 如果直接运行脚本，从命令行参数获取参数
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 1) {
    console.error("用法: ts-node adminManage.ts <操作类型: 0(初始化金库)>");
    process.exit(1);
  }
  
  const actionValue = parseInt(args[0], 10);
  
  if (isNaN(actionValue) || actionValue !== 0) {
    console.error("操作类型必须是 0(初始化金库)");
    process.exit(1);
  }
  
  adminManage(AdminAction.INIT_VAULT);
}

// 导出函数以便其他脚本使用
export { adminManage, AdminAction };
