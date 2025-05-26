script {
    use aptos_framework::fungible_asset::{Self, Metadata};
    use aptos_framework::object::{Self, Object};
    use tradingflow_vault::vault;
    
    /// Withdrawal script
    /// This script allows users to withdraw tokens from their vault using metadata object
    fun main(user: &signer, metadata_addr: address, amount: u64) {
        // Convert metadata address to Object<Metadata>
        let metadata = object::address_to_object<Metadata>(metadata_addr);
        
        // Withdraw tokens
        vault::user_withdraw(user, metadata, amount);
    }
}
