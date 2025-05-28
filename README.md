# TradingFlow Aptos Smart Contract

## Project Overview

TradingFlow Aptos Smart Contract is a vault system designed specifically for the Aptos blockchain, allowing users to securely store and manage their digital assets, and enabling automated trading through integration with Hyperion DEX.

### Key Features

- **Fund Management**: Users can deposit and withdraw various tokens
- **Bot Operations**: Bots can perform operations on behalf of users
- **Trading Signals**: Users can send trading signals and execute trades on Hyperion DEX
- **Event Logging**: All operations are recorded with detailed events

## Technical Architecture

The contract is written in Move language, optimized for the Aptos blockchain. Main components include:

- **Vault Module**: Core vault functionality
- **Balance Manager**: Tracks user funds
- **Hyperion Integration**: Interaction with Hyperion DEX

## Installation and Usage

### Prerequisites

- Aptos CLI
- Move compiler
- An Aptos account

### Compile the Contract

```bash
aptos move compile --named-addresses tradingflow_vault=<YOUR_ADDRESS>
```

### Publish the Contract

```bash
aptos move publish --named-addresses tradingflow_vault=<YOUR_ADDRESS>
```

### Using the Scripts

The project includes multiple scripts for easy interaction with the contract:

- **init_vault.move**: Initialize the vault
- **deposit_coins.move**: Deposit tokens
- **withdraw_coins.move**: Withdraw tokens
- **trade_signal.move**: Send trading signals
- **admin_manage.move**: Manage admin functions

## Contract Features in Detail

### User Functions

1. **Create Balance Manager**: Users need to create a balance manager for first-time use
2. **Deposit Tokens**: Store tokens in the vault
3. **Withdraw Tokens**: Retrieve tokens from the vault
4. **Send Trading Signals**: Execute trades through Hyperion DEX

### Admin Functions

1. **Initialize Vault**: Set up the vault system
2. **Manage Admin Capability**: Control who can perform admin operations

### Bot Functions

1. **Withdraw on Behalf of Users**: Extract tokens from user vaults
2. **Deposit on Behalf of Users**: Add tokens to user vaults

## Hyperion DEX Integration

The contract integrates with Hyperion DEX, supporting the following features:

- **Exact Input Swap**: Specify input amount and execute trades
- **Trading Signal Records**: Log all trading signals

## Testing

The project includes a comprehensive test suite covering all major functionalities:

```bash
aptos move test --named-addresses tradingflow_vault=<YOUR_ADDRESS>
```

## Security Considerations

- All critical operations have permission checks
- Comprehensive error code system for debugging

## Account Information

The system uses two main accounts:

1. **Admin Account**: Responsible for initializing the vault and managing admin functions
2. **User Account**: Used for depositing and withdrawing tokens, and sending trade signals

## Contributing

Contributions are welcome through issues and pull requests. For major changes, please open an issue first to discuss what you would like to change.

## License

See the [LICENSE](LICENSE) file for details.