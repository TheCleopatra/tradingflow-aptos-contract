# TradingFlow Aptos 智能合约

## 项目概述

TradingFlow Aptos 智能合约是一个专为 Aptos 区块链设计的金库系统，允许用户安全地存储和管理数字资产，并通过与 Hyperion DEX 集成实现自动化交易。

### 核心功能

- **资金管理**：用户可以存入和提取各种代币
- **机器人操作**：机器人可以代表用户执行操作
- **交易信号**：用户可以发送交易信号并在 Hyperion DEX 上执行交易
- **事件记录**：所有操作都会记录详细事件

## 技术架构

合约使用 Move 语言编写，针对 Aptos 区块链进行了优化。主要组件包括：

### 设计模式

合约采用"记账+金库"的设计模式：

1. **用户余额管理器 (BalanceManager)**

   - 每个用户都有自己的 `BalanceManager` 实例，存储在用户自己的账户下
   - `BalanceManager` 只是一个记账系统，记录用户在金库中存入的各种代币的余额
   - 它不实际持有代币，只是记录用户有权从金库中提取多少代币

2. **中央金库 (Vault)**

   - 所有用户的实际代币都存储在合约的资源账户中
   - 这个资源账户拥有所有存入的代币，并通过 `FungibleStore` 管理它们
   - 当用户存款时，代币实际上被转移到这个中央金库
   - 当用户提款时，代币从这个中央金库转出

3. **权限管理**
   - **AdminCap**：控制谁可以执行管理员级别的操作
   - **ResourceSignerCapability**：允许合约代表资源账户执行操作

### 主要组件

- **金库模块**：核心金库功能
- **余额管理器**：跟踪用户资金
- **Hyperion 集成**：与 Hyperion DEX 交互

## 安装和使用

### 前提条件

- Aptos CLI
- Move 编译器
- Aptos 账户

### 编译合约

```bash
aptos move compile --named-addresses tradingflow_vault=<您的地址>
```

### 发布合约

#### 发布到 Devnet

```bash
aptos move publish --named-addresses tradingflow_vault=<您的地址> --profile default
```

#### 发布到 Testnet

```bash
aptos move publish --named-addresses tradingflow_vault=<您的地址> --profile <testnet配置名称>
```

#### 发布到 Mainnet

```bash
aptos move publish --named-addresses tradingflow_vault=<您的地址> --profile <mainnet配置名称>
```

### 角色分配

在我们的部署中，我们使用了两个不同的账户，每个账户拥有不同的角色：

- **cl4**：合约部署者和管理员，负责部署合约并执行管理员操作
- **cl5**：用户账户，用于存入和提取代币

### 部署后操作流程

1. **初始化金库**（管理员 cl4 操作）

   ```bash
   pnpm ts-node adminManage.ts 2
   ```

2. **用户初始化余额管理器**（用户 cl5 操作）

   ```bash
   pnpm ts-node initVault.ts
   ```

3. **存入代币**（用户 cl5 操作）

   ```bash
   pnpm ts-node depositCoins.ts <元数据对象ID> <金额>
   # 例如：pnpm ts-node depositCoins.ts 0x000000000000000000000000000000000000000000000000000000000000000a 1000000
   # 其中 0x000000000000000000000000000000000000000000000000000000000000000a 是 APT 代币的元数据对象 ID
   ```

4. **提取代币**（用户 cl5 操作）

   ```bash
   pnpm ts-node withdrawCoins.ts <元数据对象ID> <金额>
   # 例如：pnpm ts-node withdrawCoins.ts 0x000000000000000000000000000000000000000000000000000000000000000a 1000000
   # 其中 0x000000000000000000000000000000000000000000000000000000000000000a 是 APT 代币的元数据对象 ID
   ```

5. **发送交易信号**（管理员 cl4 操作）

   ```bash
   pnpm ts-node tradeSignal.ts <用户地址> <源代币元数据对象ID> <目标代币元数据对象ID> <费率等级> <输入金额> <最小输出金额> <价格限制> <接收者地址> <截止时间戳>
   # 例如：pnpm ts-node tradeSignal.ts 0x123...abc 0x000000000000000000000000000000000000000000000000000000000000000a 0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b 1 100 95 0 0x123...abc 1717027200
   ```

6. **管理员代表用户存款**（管理员 cl4 操作）

   ```bash
   pnpm ts-node adminDeposit.ts <用户地址> <元数据对象ID> <金额>
   # 例如：pnpm ts-node adminDeposit.ts 0x123...abc 0x000000000000000000000000000000000000000000000000000000000000000a 1000000
   ```

7. **管理员代表用户提款**（管理员 cl4 操作）

   ```bash
   pnpm ts-node adminWithdraw.ts <用户地址> <元数据对象ID> <金额>
   # 例如：pnpm ts-node adminWithdraw.ts 0x123...abc 0x000000000000000000000000000000000000000000000000000000000000000a 1000000
   ```

## 合约功能详解

### 代币元数据对象说明

在 Aptos 区块链上，每个代币都有一个对应的元数据对象 ID，表示为如下形式的字符串：

```
0x1::aptos_coin::AptosCoin -> 0x000000000000000000000000000000000000000000000000000000000000000a  # APT 代币
0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC -> 0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b  # USDC 代币
0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT -> 0x3c8e5c0a0b2a0da2e0e14e0f9b6a9f8f6973d952a8c7e0fb3fb8a95c4f426b27  # USDT 代币
0x9cdcc20b2f2b21c915843fea9d7a1b4a87e3d8bd2b6469ae2e57a97d6854c2c7::king::KING -> 0x432cab29409f83cb74141f231be9b7a70a5daa259bf0808ae33f3e07fec410be  # KING 代币
```

合约直接使用这些元数据对象 ID 来识别和处理代币。我们的 TypeScript 脚本中已经预定义了常用代币的元数据对象 ID，可以在 `utils.ts` 中的 `TOKEN_METADATA` 常量中找到。

### 用户功能（cl 账户）

1. **创建余额管理器**：用户首次使用需要创建余额管理器
2. **存入代币**：将代币存入金库
3. **提取代币**：从金库中取回代币
4. **查询余额**：查询自己在金库中的各种代币余额

### 管理员功能

1. **部署合约**：将合约部署到 Aptos 区块链
2. **初始化金库**：设置金库系统

### 管理员功能

管理员可以执行以下操作：

1. **初始化金库**：设置金库系统
2. **发送交易信号**：代表用户通过 Hyperion DEX 执行交易
3. **代表用户提款**：从用户金库中提取代币
4. **代表用户存款**：向用户金库添加代币

## 账户信息

系统使用两个主要账户：

1. **管理员账户**：负责初始化金库、管理系统功能和代表用户执行交易
2. **用户账户**：用于存入和提取代币

## Hyperion DEX 集成

合约与 Hyperion DEX 集成，支持以下功能：

- **精确输入交换**：指定输入金额并执行交易
- **交易信号记录**：记录所有交易信号
- **代币元数据对象支持**：合约直接使用元数据对象 ID（如 `0x000000000000000000000000000000000000000000000000000000000000000a`）来识别和处理代币

## TypeScript 交互脚本

我们提供了一组 TypeScript 脚本，用于与 TradingFlow Aptos 合约进行交互。这些脚本使用 Aptos TypeScript SDK 实现，替代了原有的 Move 脚本，提供更灵活的交互方式。

### 环境设置

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
   USER_PRIVATE_KEY=ed25519-priv-0x...

   # Contract Addresses
   TRADINGFLOW_VAULT_ADDRESS=bcc4d1cd81c93c854321ad1e94ff99f34a64c4eb9a4f2c0bf85268908067fcbf
   HYPERION_ADDRESS=0x8b4a2c4bb53857c718a04c020b98f8c2e1f99a68b0f57389a8bf5434cd22e05c
   ```

### 可用脚本

#### 1. 初始化用户余额管理器 (initVault.ts)

初始化用户的余额管理器，这是用户与金库交互的第一步。

```bash
pnpm ts-node initVault.ts
```

#### 2. 用户存款 (depositCoins.ts)

将代币存入金库。

```bash
pnpm ts-node depositCoins.ts <代币元数据对象ID> <存款金额>
```

例如：
```bash
pnpm ts-node depositCoins.ts 0x000000000000000000000000000000000000000000000000000000000000000a 1000000
```

注意：代币元数据对象ID必须是有效的十六进制地址，而不是代币类型字符串。您可以使用 `getBalances.ts` 脚本获取可用的代币元数据对象ID。

#### 3. 用户提款 (withdrawCoins.ts)

从金库提取代币。

```bash
pnpm ts-node withdrawCoins.ts <代币元数据对象ID> <提款金额>
```

例如：
```bash
pnpm ts-node withdrawCoins.ts 0x000000000000000000000000000000000000000000000000000000000000000a 500000
```

#### 4. 管理员代表用户发送交易信号 (tradeSignal.ts)

管理员代表用户在 Hyperion DEX 上执行交易。

```bash
pnpm ts-node tradeSignal.ts <用户地址> <源代币元数据ID> <目标代币元数据ID> <费率等级> <输入金额> <最小输出金额> <价格限制> <接收者地址> <截止时间戳>
```

例如：
```bash
pnpm ts-node tradeSignal.ts 0xuser_address 0x000000000000000000000000000000000000000000000000000000000000000a 0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b 3 500000 450000 0 0xuser_address 9999999999
```

#### 5. 管理员初始化金库 (adminManage.ts)

管理员初始化金库系统。

```bash
pnpm ts-node adminManage.ts <操作类型: 2(初始化金库)>
```

例如：
```bash
# 初始化金库
pnpm ts-node adminManage.ts 2
```

#### 6. 管理员存款 (adminDeposit.ts)

管理员向用户的余额管理器中存入代币。

```bash
pnpm ts-node adminDeposit.ts <用户地址> <代币元数据对象ID> <金额>
```

例如：
```bash
pnpm ts-node adminDeposit.ts 0x123...abc 0x000000000000000000000000000000000000000000000000000000000000000a 1000000
```

#### 7. 管理员提款 (adminWithdraw.ts)

管理员从用户的余额管理器中提取代币。

```bash
pnpm ts-node adminWithdraw.ts <用户地址> <代币元数据对象ID> <金额>
```

例如：
```bash
pnpm ts-node adminWithdraw.ts 0x123...abc 0x000000000000000000000000000000000000000000000000000000000000000a 1000000
```

#### 8. 查询用户余额 (getBalances.ts)

查询用户在金库中的余额。

```bash
pnpm ts-node getBalances.ts [用户地址]
```

如果不提供用户地址，则使用环境变量中的用户地址。

### 在其他应用中使用

这些脚本也可以作为库在其他 TypeScript/JavaScript 应用中使用：

```typescript
import { depositCoins, withdrawCoins, tradeSignal, getBalances } from './ts-scripts';

// 示例：存款
await depositCoins('0x000000000000000000000000000000000000000000000000000000000000000a', 1000000);

// 示例：查询余额
const balances = await getBalances();
console.log(balances);
```

### 安全注意事项

1. 私钥存储在 `.env` 文件中，确保该文件不被提交到版本控制系统
2. 在生产环境中，建议使用更安全的密钥管理方案
3. 所有交易都会在链上执行，确保参数正确以避免资金损失

### 获取代币元数据对象ID

代币元数据对象ID是一个十六进制地址，用于唯一标识链上的代币元数据对象。您可以通过以下方式获取代币元数据对象ID：

1. 使用 `getBalances.ts` 脚本查询您的余额，脚本会显示可用的代币元数据对象ID

2. 使用 Aptos Explorer 浏览器查询代币元数据

3. 对于 APT 代币，可以使用以下命令查询其元数据对象ID：
   ```bash
   aptos account resource --account 0x1 --resource 0x1::fungible_asset::Metadata
   ```

常用代币元数据对象 ID参考：
```
0x1::aptos_coin::AptosCoin -> 0x000000000000000000000000000000000000000000000000000000000000000a  # APT
0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDC -> 0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b  # USDC
0xf22bede237a07e121b56d91a491eb7bcdfd1f5907926a9e58338f964a01b17fa::asset::USDT -> 0x3c8e5c0a0b2a0da2e0e14e0f9b6a9f8f6973d952a8c7e0fb3fb8a95c4f426b27  # USDT
0x9cdcc20b2f2b21c915843fea9d7a1b4a87e3d8bd2b6469ae2e57a97d6854c2c7::king::KING -> 0x432cab29409f83cb74141f231be9b7a70a5daa259bf0808ae33f3e07fec410be  # KING
```

## 测试

项目包含全面的测试套件，涵盖所有主要功能：

```bash
aptos move test --named-addresses tradingflow_vault=<cl2的地址>
```

## 安全考虑

- 所有关键操作都有权限检查
- 版本控制防止不兼容更新
- 全面的错误代码系统用于调试
- 支持者奖励验证机制

## 贡献

欢迎通过问题和拉取请求做出贡献。对于重大更改，请先开一个问题讨论您想要更改的内容。

## 许可证

详情请参阅 [LICENSE](LICENSE) 文件。
