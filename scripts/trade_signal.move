script {
    use aptos_framework::fungible_asset::{Self, Metadata};
    use aptos_framework::object::{Self, Object};
    use tradingflow_vault::vault;
    
    /// Trade signal script
    /// This script allows users to send trading signals and execute transactions on Hyperion DEX
    fun main(
        user: &signer,
        from_token_metadata_addr: address,
        to_token_metadata_addr: address,
        fee_tier: u8,
        amount_in: u64,
        amount_out_min: u64,
        sqrt_price_limit: u128,
        recipient: address,
        deadline: u64
    ) {
        // Convert metadata addresses to Object<Metadata>
        let from_token_metadata = object::address_to_object<Metadata>(from_token_metadata_addr);
        let to_token_metadata = object::address_to_object<Metadata>(to_token_metadata_addr);
        
        // Send trade signal and execute transaction
        vault::send_trade_signal(
            user,
            from_token_metadata,
            to_token_metadata,
            fee_tier,
            amount_in,
            amount_out_min,
            sqrt_price_limit,
            recipient,
            deadline
        );
    }
}
