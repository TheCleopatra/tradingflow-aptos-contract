# TradingFlow Aptos 智能合约

## 项目概述

TradingFlow Aptos 智能合约是一个专为 Aptos 区块链设计的金库系统，允许用户安全地存储和管理数字资产，并通过与 Hyperion DEX 集成实现自动化交易。

### 核心功能

- **资金管理**：用户可以存入和提取各种代币
- **白名单机器人**：授权机器人可以代表用户执行操作
- **交易信号**：用户可以发送交易信号并在 Hyperion DEX 上执行交易
- **事件记录**：所有操作都会记录详细事件
- **安全机制**：版本控制、权限管理和全面的错误处理

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
- **访问控制列表**：管理白名单机器人
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

在我们的部署中，我们使用了三个不同的账户，每个账户拥有不同的角色：

- **cl2**：合约部署者和管理员，负责部署合约并管理白名单
- **cl**：用户账户，用于存入和提取代币
- **cl3**：机器人账户，在白名单中，可以代表用户执行交易

### 部署后操作流程

1. **初始化金库**（用户 cl 操作）
   ```bash
   pnpm ts-node ts-scripts/initVault.ts
   ```

2. **存入代币**（用户 cl 操作）
   ```bash
   pnpm ts-node ts-scripts/depositCoins.ts <代币类型> <金额>
   # 例如：pnpm ts-node ts-scripts/depositCoins.ts 0x1::aptos_coin::AptosCoin 1000000
   # 脚本会自动将代币类型转换为元数据对象 ID
   ```

3. **提取代币**（用户 cl 操作）
   ```bash
   pnpm ts-node ts-scripts/withdrawCoins.ts <代币类型> <金额>
   # 例如：pnpm ts-node ts-scripts/withdrawCoins.ts 0x1::aptos_coin::AptosCoin 1000000
   # 脚本会自动将代币类型转换为元数据对象 ID
   ```

4. **发送交易信号**（机器人 cl3 操作）
   ```bash
   pnpm ts-node ts-scripts/tradeSignal.ts <用户地址> <源代币类型> <目标代币类型> <费率等级> <输入金额> <最小输出金额> <价格限制> <接收者地址> <截止时间戳>
   # 脚本会自动将代币类型转换为元数据对象 ID
   ```

5. **管理白名单**（管理员 cl2 操作）
   ```bash
   pnpm ts-node ts-scripts/adminManage.ts <机器人地址> <操作类型: 0(添加) 或 1(移除)>
   # 例如：pnpm ts-node ts-scripts/adminManage.ts 0x123...abc 0
   ```

## 合约功能详解

### 代币元数据对象说明

在 Aptos 区块链上，每个代币都有一个对应的元数据对象，表示为如下形式的字符串：

```
0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387
```

合约使用这些元数据对象 ID 来识别和处理代币。为了简化用户体验，我们的 TypeScript 脚本允许使用更友好的代币类型字符串（如 `0x1::aptos_coin::AptosCoin`），并在内部自动将其转换为对应的元数据对象 ID。

### 用户功能（cl 账户）

1. **创建余额管理器**：用户首次使用需要创建余额管理器
2. **存入代币**：将代币存入金库
3. **提取代币**：从金库中取回代币
4. **查询余额**：查询自己在金库中的各种代币余额

### 管理员功能（cl2 账户）

1. **部署合约**：将合约部署到 Aptos 区块链
2. **添加到白名单**：将机器人地址添加到白名单
3. **从白名单移除**：从白名单中移除机器人地址
4. **更新版本**：更新合约版本

### 机器人功能（cl3 账户）

1. **发送交易信号**：代表用户通过 Hyperion DEX 执行交易
2. **代表用户提款**：从用户金库中提取代币
3. **代表用户存款**：向用户金库添加代币

## Hyperion DEX 集成

合约与 Hyperion DEX 集成，支持以下功能：

- **精确输入交换**：指定输入金额并执行交易
- **交易信号记录**：记录所有交易信号
- **代币元数据对象支持**：合约使用元数据对象 ID（如 `0x81214a80d82035a190fcb76b6ff3c0145161c3a9f33d137f2bbaee4cfec8a387`），而脚本允许使用代币类型字符串（如 `0x1::aptos_coin::AptosCoin`）并自动转换

## 测试

项目包含全面的测试套件，涵盖所有主要功能：

```bash
aptos move test --named-addresses tradingflow_vault=<cl2的地址>
```

我们还提供了 TypeScript 脚本来测试合约功能：

```bash
pnpm ts-node ts-scripts/getBalances.ts  # 查询用户余额
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
