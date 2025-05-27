# TradingFlow Aptos 合约 TypeScript 交互脚本

这个目录包含一组 TypeScript 脚本，用于与 TradingFlow Aptos 合约进行交互。这些脚本使用 Aptos TypeScript SDK 实现，替代了原有的 Move 脚本，提供更灵活的交互方式。

## 环境设置

1. 确保已安装 Node.js 和 npm
2. 安装依赖：
   ```bash
   cd ts-scripts
   npm install
   ```
3. 确保根目录的 `.env` 文件包含正确的配置：
   ```
   # Aptos Network Configuration
   APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com
   APTOS_FAUCET_URL=https://faucet.mainnet.aptoslabs.com

   # Account Configuration
   ADMIN_PRIVATE_KEY=ed25519-priv-0x...
   BOT_PRIVATE_KEY=ed25519-priv-0x...
   USER_PRIVATE_KEY=ed25519-priv-0x...

   # Contract Addresses
   TRADINGFLOW_VAULT_ADDRESS=bcc4d1cd81c93c854321ad1e94ff99f34a64c4eb9a4f2c0bf85268908067fcbf
   HYPERION_ADDRESS=0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c
   ```

## 可用脚本

### 1. 初始化用户余额管理器 (initVault.ts)

初始化用户的余额管理器，这是用户与金库交互的第一步。

```bash
npx ts-node initVault.ts
```

### 2. 用户存款 (depositCoins.ts)

将代币存入金库。

```bash
npx ts-node depositCoins.ts <代币元数据对象ID> <存款金额>
```

例如：
```bash
npx ts-node depositCoins.ts 0x1 1000000
```

注意：代币元数据对象ID必须是有效的十六进制地址，而不是代币类型字符串。您可以使用 `getBalances.ts` 脚本获取可用的代币元数据对象ID。

### 3. 用户提款 (withdrawCoins.ts)

从金库提取代币。

```bash
npx ts-node withdrawCoins.ts <代币元数据对象ID> <提款金额>
```

例如：
```bash
npx ts-node withdrawCoins.ts 0x1 500000
```

注意：代币元数据对象ID必须是有效的十六进制地址。

### 4. 机器人代表用户发送交易信号 (tradeSignal.ts)

白名单中的机器人代表用户在 Hyperion DEX 上执行交易。

```bash
npx ts-node tradeSignal.ts <用户地址> <源代币元数据ID> <目标代币元数据ID> <费率等级> <输入金额> <最小输出金额> <价格限制> <接收者地址> <截止时间戳>
```

例如：
```bash
npx ts-node tradeSignal.ts 0xuser_address 0xsource_token 0xtarget_token 3 500000 450000 0 0xuser_address 9999999999
```

### 5. 管理员管理白名单 (adminManage.ts)

管理员添加或移除白名单地址。

```bash
npx ts-node adminManage.ts <机器人地址> <操作类型: 0(添加) 或 1(移除)>
```

例如：
```bash
# 添加机器人到白名单
npx ts-node adminManage.ts 0xbot_address 0

# 从白名单移除机器人
npx ts-node adminManage.ts 0xbot_address 1
```

### 6. 查询用户余额 (getBalances.ts)

查询用户在金库中的余额。

```bash
npx ts-node getBalances.ts [用户地址]
```

如果不提供用户地址，则使用环境变量中的用户地址。

## 在其他应用中使用

这些脚本也可以作为库在其他 TypeScript/JavaScript 应用中使用：

```typescript
import { depositCoins, withdrawCoins, tradeSignal, getBalances } from './ts-scripts';

// 示例：存款
await depositCoins('0x1', 1000000);

// 示例：查询余额
const balances = await getBalances();
console.log(balances);
```

## 安全注意事项

1. 私钥存储在 `.env` 文件中，确保该文件不被提交到版本控制系统
2. 在生产环境中，建议使用更安全的密钥管理方案
3. 所有交易都会在链上执行，确保参数正确以避免资金损失

## 获取代币元数据对象ID

代币元数据对象ID是一个十六进制地址，用于唯一标识链上的代币元数据对象。您可以通过以下方式获取代币元数据对象ID：

1. 使用 `getBalances.ts` 脚本查询您的余额，脚本会显示可用的代币元数据对象ID

2. 使用 Aptos Explorer 浏览器查询代币元数据

3. 对于 APT 代币，可以使用以下命令查询其元数据对象ID：
   ```bash
   aptos account resource --account 0x1 --resource 0x1::fungible_asset::Metadata
   ```

注意：代币类型字符串（如 `0x1::aptos_coin::AptosCoin`）与代币元数据对象ID不同。在使用这些脚本时，您需要提供元数据对象ID（十六进制地址）。

## 错误处理

所有脚本都包含基本的错误处理，如果出现问题，会在控制台输出详细的错误信息。常见问题包括：

1. 网络连接问题
2. 账户余额不足
3. 合约地址错误
4. 参数格式错误

如果遇到问题，请检查控制台输出并相应调整参数或配置。
