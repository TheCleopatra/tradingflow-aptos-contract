import { Aptos, AccountAddress } from "@aptos-labs/ts-sdk";
import { ADMIN_PRIVATE_KEY } from "./config";
import { createAptosClient, createAccountFromPrivateKey, getContractAddress, waitForTransaction } from "./utils";

/**
 * 管理员操作类型
 */
enum AdminAction {
  ADD = 0,
  REMOVE = 1
}

/**
 * 管理员管理脚本
 * 对应 Move 脚本: admin_manage.move
 * 允许管理员添加或移除白名单地址
 * 
 * @param botAddress 要添加或移除的机器人地址
 * @param action 操作类型 (0: 添加, 1: 移除)
 */
async function adminManage(botAddress: string, action: AdminAction) {
  try {
    // 创建 Aptos 客户端
    const aptos = createAptosClient();
    
    // 创建管理员账户
    const admin = createAccountFromPrivateKey(ADMIN_PRIVATE_KEY);
    
    console.log(`管理员地址: ${admin.accountAddress}`);
    console.log(`机器人地址: ${botAddress}`);
    console.log(`操作类型: ${action === AdminAction.ADD ? '添加到白名单' : '从白名单移除'}`);
    
    // 根据操作类型选择函数
    const functionName = action === AdminAction.ADD ? 'acl_add' : 'acl_remove';
    
    // 将机器人地址转换为AccountAddress对象
    const botAccountAddress = AccountAddress.from(botAddress);
    
    // 构建交易
    const transaction = await aptos.transaction.build.simple({
      sender: admin.accountAddress,
      data: {
        function: `${getContractAddress()}::vault::${functionName}`,
        functionArguments: [botAccountAddress],
      },
    });
    
    // 签名并提交交易
    console.log(`正在${action === AdminAction.ADD ? '添加' : '移除'}机器人地址...`);
    const committedTxn = await aptos.signAndSubmitTransaction({
      signer: admin,
      transaction,
    });
    
    // 等待交易完成
    await waitForTransaction(aptos, committedTxn.hash);
    
    console.log(`操作成功！已${action === AdminAction.ADD ? '添加' : '移除'}机器人地址 ${botAddress}`);
  } catch (error) {
    console.error(`${action === AdminAction.ADD ? '添加' : '移除'}机器人地址失败:`, error);
  }
}

// 如果直接运行脚本，从命令行参数获取参数
if (require.main === module) {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("用法: ts-node adminManage.ts <机器人地址> <操作类型: 0(添加) 或 1(移除)>");
    process.exit(1);
  }
  
  const botAddress = args[0];
  const actionValue = parseInt(args[1], 10);
  
  if (isNaN(actionValue) || (actionValue !== 0 && actionValue !== 1)) {
    console.error("操作类型必须是 0(添加) 或 1(移除)");
    process.exit(1);
  }
  
  const action = actionValue === 0 ? AdminAction.ADD : AdminAction.REMOVE;
  
  adminManage(botAddress, action);
}

// 导出函数以便其他脚本使用
export { adminManage, AdminAction };
