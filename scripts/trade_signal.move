script {
    use tradingflow_vault::vault;
    
    /// Trade signal script
    /// This script allows users to send trading signals and execute transactions on Hyperion DEX
    fun main<FromCoinType, ToCoinType>(
        user: &signer,
        fee_tier: u8,
        amount_in: u64,
        amount_out_min: u64,
        sqrt_price_limit: u128,
        recipient: address,
        deadline: u64
    ) {
        // Send trade signal and execute transaction
        vault::send_trade_signal<FromCoinType, ToCoinType>(
            user,
            fee_tier,
            amount_in,
            amount_out_min,
            sqrt_price_limit,
            recipient,
            deadline
        );
    }
}
