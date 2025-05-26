# TradingFlow Aptos 合约操作指南

本指南详细说明了如何在 Mainnet 上部署、更新和测试 TradingFlow Aptos 合约。我们将使用三个不同的配置文件：
- `cl`: 用于部署合约的管理员账户
- `cl2`: 用于机器人操作的账户
- `cl3`: 模拟普通用户的账户

## 1. 部署新合约

### 1.1 编译合约

```bash
aptos move compile --named-addresses tradingflow_vault=df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7
```

### 1.2 部署合约

```bash
aptos move publish --named-addresses tradingflow_vault=df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7 --profile cl
```

部署成功后，合约将初始化并创建必要的资源账户和管理员权限。

## 2. 更新合约版本

如果您已经部署了合约，并且想要更新到新版本，请按照以下步骤操作：

### 2.1 更新 VERSION 常量

在 `sources/vault.move` 文件中，找到 `VERSION` 常量并增加其值：

```move
/// Contract version
const VERSION: u64 = 2; // 从 1 增加到 2
```

### 2.2 重新部署合约

```bash
aptos move publish --named-addresses tradingflow_vault=df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7 --profile cl
```

### 2.3 更新链上版本

部署后，调用 `update_version` 函数更新链上存储的版本号：

```bash
aptos move run --function-id df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7::vault::update_version --profile cl
```

## 3. 管理员操作

### 3.1 将机器人地址添加到白名单

```bash
aptos move run --function-id df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7::vault::acl_add --args address:<cl2的地址> --profile cl
```

### 3.2 从白名单移除机器人地址

```bash
aptos move run --function-id df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7::vault::acl_remove --args address:<cl2的地址> --profile cl
```

## 4. 用户操作

### 4.1 初始化用户的余额管理器

```bash
aptos move run-script --compiled-script-path scripts/init_vault.move --profile cl3
```

### 4.2 用户存款

假设我们要存入 APT 代币：

```bash
aptos move run-script --compiled-script-path scripts/deposit_coins.move --args object:<APT代币元数据对象ID> u64:1000000 --profile cl3
```

### 4.3 用户提款

```bash
aptos move run-script --compiled-script-path scripts/withdraw_coins.move --args object:<APT代币元数据对象ID> u64:500000 --profile cl3
```

## 5. 机器人操作

### 5.1 代表用户存款

```bash
aptos move run --function-id df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7::vault::bot_deposit --args address:<cl3的地址> object:<代币元数据对象ID> u64:1000000 u64:0 --profile cl2
```

### 5.2 代表用户提款

```bash
aptos move run --function-id df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7::vault::bot_withdraw --args address:<cl3的地址> object:<代币元数据对象ID> u64:500000 address:<接收地址> --profile cl2
```

### 5.3 发送交易信号

```bash
aptos move run --function-id df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7::vault::send_trade_signal --args address:<cl3的地址> object:<源代币元数据对象ID> object:<目标代币元数据对象ID> u8:<费率层级> u64:<输入金额> u64:<最小输出金额> u128:<价格限制> address:<接收地址> u64:<截止时间> --profile cl2
```

## 6. 查询操作

### 6.1 查询用户余额

要查询用户在金库中的余额，您需要编写一个查询脚本或使用 Aptos Explorer 查看用户的 `BalanceManager` 资源。

### 6.2 查询白名单

要查询白名单中的地址，您需要查看 `AccessList` 资源。

## 7. 完整测试流程

以下是一个完整的测试流程，从部署到各种操作：

### 7.1 部署合约

```bash
aptos move publish --named-addresses tradingflow_vault=df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7 --profile cl
```

### 7.2 添加机器人到白名单

```bash
aptos move run --function-id df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7::vault::acl_add --args address:<cl2的地址> --profile cl
```

### 7.3 初始化用户余额管理器

```bash
aptos move run-script --compiled-script-path scripts/init_vault.move --profile cl3
```

### 7.4 用户存款

```bash
aptos move run-script --compiled-script-path scripts/deposit_coins.move --args object:<APT代币元数据对象ID> u64:1000000 --profile cl3
```

### 7.5 机器人代表用户发送交易信号

```bash
aptos move run --function-id df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7::vault::send_trade_signal --args address:<cl3的地址> object:<源代币元数据对象ID> object:<目标代币元数据对象ID> u8:3 u64:500000 u64:450000 u128:0 address:<cl3的地址> u64:9999999999 --profile cl2
```

### 7.6 用户提款

```bash
aptos move run-script --compiled-script-path scripts/withdraw_coins.move --args object:<目标代币元数据对象ID> u64:200000 --profile cl3
```

### 7.7 机器人代表用户提款

```bash
aptos move run --function-id df6e34a634d87c87939201c0afc90453fb1e34d037e8b8e9d1aaf8df275637f7::vault::bot_withdraw --args address:<cl3的地址> object:<目标代币元数据对象ID> u64:100000 address:<cl3的地址> --profile cl2
```

## 8. 常见问题与解决方案

### 8.1 交易失败

- **问题**: 交易执行失败，出现错误
- **解决方案**: 检查错误消息，常见原因包括：
  - 权限不足（不是管理员或不在白名单中）
  - 余额不足
  - 版本不匹配
  - gas 费用不足

### 8.2 找不到代币元数据对象

- **问题**: 无法找到代币的元数据对象ID
- **解决方案**: 使用 Aptos Explorer 查找代币的元数据对象ID，或使用 Aptos CLI 查询

### 8.3 交易超时

- **问题**: 交易执行时间过长或超时
- **解决方案**: 增加 gas 限制或调整 deadline 参数

## 9. 获取代币元数据对象ID

要获取代币的元数据对象ID，可以使用以下命令：

```bash
aptos account list --query resources --account <代币发行账户地址>
```

然后在输出中查找 `FungibleAssetMetadata` 资源，其中包含代币的元数据对象ID。

## 10. 安全建议

1. **定期备份私钥**: 确保安全备份所有账户的私钥
2. **谨慎添加白名单**: 只将信任的地址添加到白名单
3. **测试小额交易**: 在进行大额交易前，先测试小额交易
4. **监控合约活动**: 定期检查合约活动，确保一切正常
5. **设置合理的滑点保护**: 在交易信号中设置合理的最小输出金额，防止滑点过大

希望本指南能帮助您顺利部署和测试 TradingFlow Aptos 合约。如有任何问题，请参考代码注释或联系开发团队。
