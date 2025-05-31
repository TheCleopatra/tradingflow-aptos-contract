# TradingFlow Companion

TradingFlow Companion 是一个为 TradingFlow Aptos 智能合约提供支持的后端服务，提供了一系列 API 接口，用于与 Aptos 区块链上的 TradingFlow 合约进行交互。

## 项目结构

项目采用模块化架构，按业务功能划分为不同的模块：

```
src/
├── modules/
│   ├── token/            # 代币相关功能
│   │   ├── index.ts      # 导出模块功能
│   │   ├── route.ts      # 路由定义
│   │   ├── service.ts    # 服务实现
│   │   └── tests/        # 测试文件
│   ├── hyperion_dex/     # Hyperion DEX 交互功能
│   │   ├── index.ts
│   │   ├── route.ts
│   │   ├── service.ts
│   │   └── tests/
│   ├── tf_vault/         # TradingFlow 金库功能
│   │   ├── index.ts
│   │   ├── route.ts
│   │   ├── service.ts
│   │   └── tests/
│   ├── common/           # 通用功能
│   │   └── tests/
│   └── index.ts          # 统一导出所有模块
├── types/                # 类型定义
├── tools/                # 工具脚本
└── index.ts              # 应用入口
```

## 功能模块

### Token 模块

提供代币相关的功能，包括：

- 获取所有支持的代币列表
- 获取特定代币的元数据信息（名称、符号、精度等）

### Hyperion DEX 模块

提供与 Hyperion DEX 交互的功能，包括：

- 获取所有交易池信息
- 获取特定交易池详情
- 执行代币交换操作

### TF Vault 模块

提供与 TradingFlow 金库合约交互的功能，包括：

- 检查用户是否已创建余额管理器
- 管理员执行交易操作
- 查询用户事件记录
- 查询用户持仓情况
- 获取代币元数据信息

## 环境配置

项目使用环境变量进行配置，主要包括：

```
# Aptos API 配置
APTOS_NODE_URL=https://fullnode.mainnet.aptoslabs.com

# GraphQL API 配置
APTOS_GRAPHQL_ENDPOINT=https://api.mainnet.aptoslabs.com/v1/graphql
APTOS_GRAPHQL_API_KEY=your_graphql_api_key_here

# 服务器配置
PORT=3000

# TradingFlow 合约地址
TRADINGFLOW_VAULT_ADDRESS=0xbcc4d1cd81c93c854321ad1e94ff99f34a64c4eb9a4f2c0bf85268908067fcbf

# TradingFlow 管理员私钥
TRADINGFLOW_ADMIN_PRIVATE_KEY=your_admin_private_key_here
```

请创建 `.env` 文件并设置上述环境变量。

## 安装与运行

### 安装依赖

```bash
npm install
# 或
yarn install
# 或
pnpm install
```

### 开发模式运行

```bash
npm run dev
# 或
yarn dev
# 或
pnpm dev
```

### 生产模式构建

```bash
npm run build
# 或
yarn build
# 或
pnpm build
```

### 生产模式运行

```bash
npm start
# 或
yarn start
# 或
pnpm start
```

## API 接口文档

### Token 模块

#### 获取所有代币

```
GET /aptos/api/tokens
```

#### 获取特定代币元数据

```
GET /aptos/api/tokens/:address
```

### Hyperion DEX 模块

#### 获取所有交易池

```
GET /aptos/api/pools
```

#### 获取特定交易池详情

```
GET /aptos/api/pools/:poolId
```

### TF Vault 模块

#### 检查用户是否已创建余额管理器

```
GET /aptos/api/tf_vault/balance-manager/:address
```

#### 管理员执行交易

```
POST /aptos/api/tf_vault/trade-signal
```

请求体示例：
```json
{
  "userAddress": "0x6a1a233e8034ad0cf8d68951864a5a49819b3e9751da4b9fe34618dd41ea9d0d",
  "fromTokenMetadataId": "0x000000000000000000000000000000000000000000000000000000000000000a",
  "toTokenMetadataId": "0xbae207659db88bea0cbead6da0ed00aac12edcdda169e591cd41c94180b46f3b",
  "feeTier": 2,
  "amountIn": 200000,
  "amountOutMin": 0,
  "sqrtPriceLimit": "0",
  "deadline": 1748591382614460
}
```

#### 查询用户事件

```
GET /aptos/api/tf_vault/events/:address
```

可选查询参数：
- `eventType`: 事件类型，可选值包括 `BalanceManagerCreatedEvent`、`UserDepositEvent`、`UserWithdrawEvent`、`TradeSignalEvent`
- `limit`: 返回结果数量限制，默认为 20

#### 查询用户持仓

```
GET /aptos/api/tf_vault/holdings/:address
```

#### 获取代币元数据

```
GET /aptos/api/tf_vault/token-metadata/:address
```

## 测试

项目使用 HTTP 文件进行 API 测试，测试文件位于各模块的 `tests` 目录下。您可以使用 VS Code 的 REST Client 插件或其他 HTTP 客户端工具运行这些测试。

## 技术栈

- Node.js
- Express
- TypeScript
- Aptos TypeScript SDK (@aptos-labs/ts-sdk)
- Hyperion SDK (@hyperionxyz/sdk)

## 贡献指南

1. Fork 本仓库
2. 创建您的特性分支 (`git checkout -b feature/amazing-feature`)
3. 提交您的更改 (`git commit -m 'Add some amazing feature'`)
4. 推送到分支 (`git push origin feature/amazing-feature`)
5. 开启一个 Pull Request

## 许可证

[MIT](LICENSE)
