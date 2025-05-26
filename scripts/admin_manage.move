script {
    use tradingflow_vault::vault;
    
    /// Admin management script
    /// This script allows administrators to add or remove whitelist addresses
    /// action: 0 - add address, 1 - remove address
    fun main(admin: &signer, bot_address: address, action: u8) {
        if (action == 0) {
            // Add to whitelist
            vault::acl_add(admin, bot_address);
        } else if (action == 1) {
            // Remove from whitelist
            vault::acl_remove(admin, bot_address);
        };
    }
}
