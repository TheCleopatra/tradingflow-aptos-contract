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

### 部署后操作流程

1. **初始化金库**
   ```bash
   aptos move run-script --compiled-script-path scripts/init_vault.move --profile <配置名称>
   ```

2. **存入代币**
   ```bash
   aptos move run-script --compiled-script-path scripts/deposit_coins.move --args <代币元数据> <金额> --profile <配置名称>
   ```

3. **提取代币**
   ```bash
   aptos move run-script --compiled-script-path scripts/withdraw_coins.move --args <代币元数据> <金额> --profile <配置名称>
   ```

4. **发送交易信号**
   ```bash
   aptos move run-script --compiled-script-path scripts/trade_signal.move --args <参数...> --profile <配置名称>
   ```

5. **管理白名单**
   ```bash
   aptos move run-script --compiled-script-path scripts/admin_manage.move --args <操作> <地址> --profile <配置名称>
   ```

## 合约功能详解

### 用户功能

1. **创建余额管理器**：用户首次使用需要创建余额管理器
2. **存入代币**：将代币存入金库
3. **提取代币**：从金库中取回代币
4. **发送交易信号**：通过 Hyperion DEX 执行交易

### 管理员功能

1. **添加到白名单**：将地址添加到白名单
2. **从白名单移除**：从白名单中移除地址
3. **更新版本**：更新合约版本

### 机器人功能

1. **代表用户提款**：从用户金库中提取代币
2. **代表用户存款**：向用户金库添加代币

## Hyperion DEX 集成

合约与 Hyperion DEX 集成，支持以下功能：

- **精确输入交换**：指定输入金额并执行交易
- **交易信号记录**：记录所有交易信号

## 测试

项目包含全面的测试套件，涵盖所有主要功能：

```bash
aptos move test --named-addresses tradingflow_vault=<您的地址>
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
