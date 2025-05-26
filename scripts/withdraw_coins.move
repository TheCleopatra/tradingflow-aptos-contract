script {
    use std::signer;
    use aptos_framework::coin;
    use tradingflow_vault::vault;
    
    /// Withdrawal script
    /// This script allows users to withdraw tokens from their vault
    fun main<CoinType>(user: &signer, amount: u64) {
        // Withdraw tokens
        vault::user_withdraw<CoinType>(user, amount);
    }
}
