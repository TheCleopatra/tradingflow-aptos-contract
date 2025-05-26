module tradingflow_vault::vault {
    use std::string::{Self, String};
    use std::signer;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::fungible_asset::{Self, Metadata, FungibleAsset, FungibleStore};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::table::{Self, Table};
    use aptos_std::type_info;
    use aptos_std::simple_map::{Self, SimpleMap};
    
    use hyperion::router_v3;

    /// Contract version
    const VERSION: u64 = 1;
    
    /// Error code: Not in whitelist
    const ENOT_WHITELISTED: u64 = 1001;
    
    /// Error code: Version mismatch
    const EVERSION_MISMATCHED: u64 = 1002;
    
    /// Error code: Admin only operation
    const ENOT_ADMIN: u64 = 1003;
    
    /// Error code: Owner only operation
    const ENOT_OWNER: u64 = 1004;
    
    /// Error code: Insufficient balance
    const EINSUFFICIENT_BALANCE: u64 = 1005;
    
    /// Error code: Below minimum amount
    const EBELOW_MIN_AMOUNT: u64 = 1006;

    /// User deposit event
    struct UserDepositEvent has drop, store {
        user: address,
        asset_metadata: Object<Metadata>,
        amount: u64,
    }
    
    /// User withdrawal event
    struct UserWithdrawEvent has drop, store {
        user: address,
        asset_metadata: Object<Metadata>,
        amount: u64,
    }
    
    /// Bot withdrawal event
    struct BotWithdrawEvent has drop, store {
        bot: address,
        user: address,
        asset_metadata: Object<Metadata>,
        amount: u64,
    }
    
    /// Bot deposit event
    struct BotDepositEvent has drop, store {
        bot: address,
        user: address,
        asset_metadata: Object<Metadata>,
        amount: u64,
    }
    
    /// Trade signal event
    struct TradeSignalEvent has drop, store {
        user: address,
        from_asset_metadata: Object<Metadata>,
        to_asset_metadata: Object<Metadata>,
        amount_in: u64,
        amount_out_min: u64,
    }

    /// Access control list
    struct AccessList has key {
        allow: vector<address>,
    }
    
    /// Balance manager
    struct BalanceManager has key {
        owner: address,
        // Use Object<Metadata> as keys instead of String type names
        balances: SimpleMap<Object<Metadata>, u64>,
        deposit_events: EventHandle<UserDepositEvent>,
        withdraw_events: EventHandle<UserWithdrawEvent>,
        bot_deposit_events: EventHandle<BotDepositEvent>,
        bot_withdraw_events: EventHandle<BotWithdrawEvent>,
        trade_signal_events: EventHandle<TradeSignalEvent>,
    }
    
    /// Record table
    struct Record has key {
        record: Table<address, address>,
    }
    
    /// Admin capability
    struct AdminCap has key {
        owner: address,
    }
    
    /// Version information
    struct Version has key {
        version: u64,
    }
    


    /// Initialize module
    fun init_module(account: &signer) {
        let admin_addr = signer::address_of(account);
        
        // Create admin capability
        move_to(account, AdminCap {
            owner: admin_addr,
        });
        
        // Create access control list
        move_to(account, AccessList {
            allow: vector::empty(),
        });
        
        // Create record table
        move_to(account, Record {
            record: table::new(),
        });
        
        // Create version information
        move_to(account, Version {
            version: VERSION,
        });
    }

    /// Add address to whitelist
    public entry fun acl_add(admin: &signer, bot_address: address) acquires AdminCap, AccessList {
        let admin_addr = signer::address_of(admin);
        let admin_cap = borrow_global<AdminCap>(@tradingflow_vault);
        assert!(admin_cap.owner == admin_addr, ENOT_ADMIN);
        
        let acl = borrow_global_mut<AccessList>(@tradingflow_vault);
        if (!vector::contains(&acl.allow, &bot_address)) {
            vector::push_back(&mut acl.allow, bot_address);
        };
    }
    
    /// Remove address from whitelist
    public entry fun acl_remove(admin: &signer, bot_address: address) acquires AdminCap, AccessList {
        let admin_addr = signer::address_of(admin);
        let admin_cap = borrow_global<AdminCap>(@tradingflow_vault);
        assert!(admin_cap.owner == admin_addr, ENOT_ADMIN);
        
        let acl = borrow_global_mut<AccessList>(@tradingflow_vault);
        let (found, index) = vector::index_of(&acl.allow, &bot_address);
        if (found) {
            vector::remove(&mut acl.allow, index);
        };
    }

    /// Create balance manager
    public entry fun create_balance_manager(
        user: &signer
    ) acquires Record, Version {
        let user_addr = signer::address_of(user);
        let version = borrow_global<Version>(@tradingflow_vault);
        assert!(version.version == VERSION, EVERSION_MISMATCHED);
        
        // Create balance manager
        let balance_manager = BalanceManager {
            owner: user_addr,
            balances: simple_map::create(),
            deposit_events: account::new_event_handle(user),
            withdraw_events: account::new_event_handle(user),
            bot_deposit_events: account::new_event_handle(user),
            bot_withdraw_events: account::new_event_handle(user),
            trade_signal_events: account::new_event_handle(user),
        };
        
        // Record user's balance manager
        let record = borrow_global_mut<Record>(@tradingflow_vault);
        table::add(&mut record.record, user_addr, user_addr);
        
        // Move balance manager to user account
        move_to(user, balance_manager);
    }

    /// User deposit using metadata object directly
    public entry fun user_deposit_by_metadata(
        user: &signer,
        metadata: Object<Metadata>,
        amount: u64
    ) acquires BalanceManager, Version {
        let user_addr = signer::address_of(user);
        let version = borrow_global<Version>(@tradingflow_vault);
        assert!(version.version == VERSION, EVERSION_MISMATCHED);
        
        // Get user's balance manager
        let bm = borrow_global_mut<BalanceManager>(user_addr);
        assert!(bm.owner == user_addr, ENOT_OWNER);
        
        // Get user's fungible store
        let user_store = primary_fungible_store::primary_store(user_addr, metadata);
        
        // Withdraw assets from user's store
        let fa = fungible_asset::withdraw(user_store, amount);
        
        // Deposit to balance manager
        deposit_internal_by_metadata(bm, fa);
        
        // Emit deposit event
        event::emit_event(&mut bm.deposit_events, UserDepositEvent {
            user: user_addr,
            asset_metadata: metadata,
            amount: amount,
        });
    }

    /// User withdrawal using metadata object directly
    public entry fun user_withdraw_by_metadata(
        user: &signer,
        metadata: Object<Metadata>,
        amount: u64
    ) acquires BalanceManager, Version {
        let user_addr = signer::address_of(user);
        let version = borrow_global<Version>(@tradingflow_vault);
        assert!(version.version == VERSION, EVERSION_MISMATCHED);
        
        // Get user's balance manager
        let bm = borrow_global_mut<BalanceManager>(user_addr);
        assert!(bm.owner == user_addr, ENOT_OWNER);
        
        // Withdraw tokens from balance manager
        let fa = withdraw_internal_by_metadata(bm, metadata, amount);
        
        // Emit withdrawal event
        event::emit_event(&mut bm.withdraw_events, UserWithdrawEvent {
            user: user_addr,
            asset_metadata: metadata,
            amount: amount,
        });
        
        // Transfer tokens to user
        let user_store = primary_fungible_store::ensure_primary_store_exists(user_addr, metadata);
        fungible_asset::deposit(user_store, fa);
    }
    
    /// User withdrawal (legacy function, use user_withdraw_by_metadata instead)
    public entry fun user_withdraw<CoinType>(
        user: &signer,
        amount: u64
    ) acquires BalanceManager, Version {
        let metadata = get_token_metadata<CoinType>();
        user_withdraw_by_metadata(user, metadata, amount)
    }

    /// Bot withdrawal using metadata object directly
    public entry fun bot_withdraw_by_metadata(
        bot: &signer,
        user_addr: address,
        metadata: Object<Metadata>,
        amount: u64
    ) acquires BalanceManager, AccessList {
        let bot_addr = signer::address_of(bot);
        
        // Verify bot is in whitelist
        let acl = borrow_global<AccessList>(@tradingflow_vault);
        assert!(vector::contains(&acl.allow, &bot_addr), ENOT_WHITELISTED);
        
        // Get user's balance manager
        let bm = borrow_global_mut<BalanceManager>(user_addr);
        
        // Withdraw tokens from balance manager
        let fa = withdraw_internal_by_metadata(bm, metadata, amount);
        
        // Emit bot withdrawal event
        event::emit_event(&mut bm.bot_withdraw_events, BotWithdrawEvent {
            bot: bot_addr,
            user: user_addr,
            asset_metadata: metadata,
            amount: amount,
        });
        
        // Transfer tokens to bot
        let bot_store = primary_fungible_store::ensure_primary_store_exists(bot_addr, metadata);
        fungible_asset::deposit(bot_store, fa);
    }
    
    /// Bot withdrawal (legacy function, use bot_withdraw_by_metadata instead)
    public entry fun bot_withdraw<CoinType>(
        bot: &signer,
        user_addr: address,
        amount: u64
    ) acquires BalanceManager, AccessList {
        let metadata = get_token_metadata<CoinType>();
        bot_withdraw_by_metadata(bot, user_addr, metadata, amount)
    }

    /// Bot deposit
    public entry fun bot_deposit<CoinType>(
        bot: &signer,
        user_addr: address,
        amount: u64,
        min: u64
    ) acquires BalanceManager, AccessList {
        let bot_addr = signer::address_of(bot);
        
        // Verify bot is in whitelist
        let acl = borrow_global<AccessList>(@tradingflow_vault);
        assert!(vector::contains(&acl.allow, &bot_addr), ENOT_WHITELISTED);
        
        // Verify amount meets minimum requirement
        assert!(amount >= min, EBELOW_MIN_AMOUNT);
        
        // Get user's balance manager
        let bm = borrow_global_mut<BalanceManager>(user_addr);
        
        // Withdraw tokens from bot account
        let coin = coin::withdraw<CoinType>(bot, amount);
        
        // Deposit to balance manager
        deposit_internal<CoinType>(bm, coin);
        
        // Emit bot deposit event
        let coin_type = type_info::type_name<CoinType>();
        event::emit_event(&mut bm.bot_deposit_events, BotDepositEvent {
            bot: bot_addr,
            user: user_addr,
            coin_type: coin_type,
            amount: amount,
        });
    }

    /// Send trade signal and execute Hyperion DEX transaction
    public entry fun send_trade_signal(
        user: &signer,
        from_token_metadata: Object<Metadata>,
        to_token_metadata: Object<Metadata>,
        fee_tier: u8,
        amount_in: u64,
        amount_out_min: u64,
        sqrt_price_limit: u128,
        recipient: address,
        deadline: u64
    ) acquires BalanceManager, Version {
        let user_addr = signer::address_of(user);
        let version = borrow_global<Version>(@tradingflow_vault);
        assert!(version.version == VERSION, EVERSION_MISMATCHED);
        
        // Get user's balance manager
        let bm = borrow_global_mut<BalanceManager>(user_addr);
        assert!(bm.owner == user_addr, ENOT_OWNER);
        
        // Check if balance is sufficient
        let balance = get_balance_by_metadata(bm, from_token_metadata);
        assert!(balance >= amount_in, EINSUFFICIENT_BALANCE);
        
        // Withdraw tokens from balance manager
        let fa = withdraw_internal_by_metadata(bm, from_token_metadata, amount_in);
        
        // Emit trade signal event
        event::emit_event(&mut bm.trade_signal_events, TradeSignalEvent {
            user: user_addr,
            from_asset_metadata: from_token_metadata,
            to_asset_metadata: to_token_metadata,
            amount_in: amount_in,
            amount_out_min: amount_out_min,
        });
        
        // Execute Hyperion DEX transaction
        // First, deposit the fungible asset to user's account
        let user_store = primary_fungible_store::ensure_primary_store_exists(user_addr, from_token_metadata);
        fungible_asset::deposit(user_store, fa);
        
        // Now call the router with the correct parameters
        router_v3::exact_input_swap_entry(
            user,
            fee_tier,
            amount_in,
            amount_out_min,
            sqrt_price_limit,
            from_token_metadata,
            to_token_metadata,
            recipient,
            deadline
        );
    }

    /// Internal function: deposit tokens using metadata object directly
    fun deposit_internal_by_metadata(bm: &mut BalanceManager, fa: FungibleAsset) {
        let metadata = fungible_asset::asset_metadata(&fa);
        let amount = fungible_asset::amount(&fa);
        
        // Deposit tokens to vault
        let vault_addr = @tradingflow_vault;
        // Get or create the vault's FungibleStore
        let store = primary_fungible_store::ensure_primary_store_exists(vault_addr, metadata);
        fungible_asset::deposit(store, fa);
        
        // Update balance
        if (simple_map::contains_key(&bm.balances, &metadata)) {
            let balance = simple_map::borrow_mut(&mut bm.balances, &metadata);
            *balance = *balance + amount;
        } else {
            simple_map::add(&mut bm.balances, metadata, amount);
        };
    }
    
    /// Internal function: deposit tokens (legacy function, use deposit_internal_by_metadata instead)
    fun deposit_internal<CoinType>(bm: &mut BalanceManager, fa: FungibleAsset) {
        deposit_internal_by_metadata(bm, fa)
    }

    /// Internal function: withdraw tokens using metadata object directly
    fun withdraw_internal_by_metadata(bm: &mut BalanceManager, metadata: Object<Metadata>, amount: u64): FungibleAsset {
        // Check if balance is sufficient
        assert!(simple_map::contains_key(&bm.balances, &metadata), EINSUFFICIENT_BALANCE);
        let balance = *simple_map::borrow(&bm.balances, &metadata);
        assert!(balance >= amount, EINSUFFICIENT_BALANCE);
        
        // Update balance
        if (balance == amount) {
            simple_map::remove(&mut bm.balances, &metadata);
        } else {
            let balance_ref = simple_map::borrow_mut(&mut bm.balances, &metadata);
            *balance_ref = balance - amount;
        };
        
        // Withdraw tokens from vault
        let vault_addr = @tradingflow_vault;
        
        // Use resource account signer to withdraw assets
        let resource_signer = get_resource_signer();
        
        // Get the vault's FungibleStore
        let store = primary_fungible_store::primary_store(vault_addr, metadata);
        
        // Extract assets from the store
        fungible_asset::withdraw_with_capability(
            &fungible_asset::create_withdraw_capability(
                &resource_signer,
                store
            ),
            amount
        )
    }

    /// Internal function: withdraw tokens (legacy function, use withdraw_internal_by_metadata instead)
    fun withdraw_internal<CoinType>(bm: &mut BalanceManager, amount: u64): FungibleAsset {
        // Get the address of the coin type
        let metadata = get_token_metadata<CoinType>();
        withdraw_internal_by_metadata(bm, metadata, amount)
    }

    /// Get balance using metadata object directly
    public fun get_balance_by_metadata(bm: &BalanceManager, metadata: Object<Metadata>): u64 {
        if (simple_map::contains_key(&bm.balances, &metadata)) {
            *simple_map::borrow(&bm.balances, &metadata)
        } else {
            0
        }
    }
    
    /// Get balance using coin type (legacy function, use get_balance_by_metadata instead)
    public fun get_balance<CoinType>(bm: &BalanceManager): u64 {
        let metadata = get_token_metadata<CoinType>();
        get_balance_by_metadata(bm, metadata)
    }
    
    /// Get token metadata object
    /// This is a helper function to get the token metadata required by router_v3::exact_input_swap_entry
    fun get_token_metadata<CoinType>(): Object<Metadata> {
        // Use Fungible Asset standard to get token metadata objects
        // In the Fungible Asset model, each token type has an associated metadata object
        
        // Get the address of the coin type
        let coin_address = type_info::type_of<CoinType>().account_address;
        
        // Build the metadata object address
        // Note: This assumes the token uses the primary_fungible_store standard and is already registered
        // Actual implementation may need to be adjusted based on specific token registration methods
        let metadata_address = object::create_object_address(&coin_address, b"metadata");
        
        // Convert address to metadata object
        object::address_to_object<Metadata>(metadata_address)
    }

    /// Get resource signer for the vault
    /// This function returns a signer for the vault's resource account
    fun get_resource_signer(): signer {
        // In a real implementation, you would retrieve the resource account's signer capability
        // that was saved during initialization
        // For now, we'll use a placeholder implementation
        abort(1001) // Custom error code indicating unimplemented functionality
    }

    /// Update version
    public entry fun update_version(admin: &signer) acquires AdminCap, Version {
        let admin_addr = signer::address_of(admin);
        let admin_cap = borrow_global<AdminCap>(@tradingflow_vault);
        assert!(admin_cap.owner == admin_addr, ENOT_ADMIN);
        
        let version = borrow_global_mut<Version>(@tradingflow_vault);
        version.version = VERSION;
    }

    /// Initialize module (for testing only)
    #[test_only]
    public fun init_for_testing(account: &signer) {
        init_module(account);
    }
}
