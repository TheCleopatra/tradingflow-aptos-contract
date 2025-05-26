script {
    use aptos_framework::fungible_asset::{Self, Metadata};
    use aptos_framework::object::{Self, Object};
    use tradingflow_vault::vault;
    
    /// Deposit script
    /// This script allows users to deposit tokens into their vault using metadata object
    fun main(user: &signer, metadata_addr: address, amount: u64) {
        // Convert metadata address to Object<Metadata>
        let metadata = object::address_to_object<Metadata>(metadata_addr);
        
        // Deposit tokens
        vault::user_deposit(user, metadata, amount);
    }
}
