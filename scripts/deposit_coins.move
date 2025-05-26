script {
    use std::signer;
    use aptos_framework::coin;
    use tradingflow_vault::vault;
    
    /// Deposit script
    /// This script allows users to deposit tokens into their vault
    fun main<CoinType>(user: &signer, amount: u64) {
        // Deposit tokens
        vault::user_deposit<CoinType>(user, amount);
    }
}
