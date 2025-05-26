script {
    use tradingflow_vault::vault;
    
    /// Initialize vault script
    /// This script initializes the user's balance manager
    fun main(user: &signer) {
        // Create balance manager
        vault::create_balance_manager(user);
    }
}
