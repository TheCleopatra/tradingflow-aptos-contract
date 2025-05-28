module tradingflow_vault::vault {
    use std::signer;
    use aptos_framework::account;
    use aptos_framework::event::{Self, EventHandle};
    use aptos_framework::fungible_asset::{Self, Metadata, FungibleAsset, FungibleStore};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::table::{Self, Table};
    use aptos_std::simple_map::{Self, SimpleMap};
    
    use hyperion::router_v3;
    
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
    
    /// Admin withdrawal event
    struct AdminWithdrawEvent has drop, store {
        admin: address,
        user: address,
        asset_metadata: Object<Metadata>,
        amount: u64,
    }
    
    /// Admin deposit event
    struct AdminDepositEvent has drop, store {
        admin: address,
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

    
    /// Balance manager
    struct BalanceManager has key {
        owner: address,
        balances: SimpleMap<Object<Metadata>, u64>,
        deposit_events: EventHandle<UserDepositEvent>,
        withdraw_events: EventHandle<UserWithdrawEvent>,
        admin_deposit_events: EventHandle<AdminDepositEvent>,
        admin_withdraw_events: EventHandle<AdminWithdrawEvent>,
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
    
    /// Resource account signer capability
    struct ResourceSignerCapability has key {
        signer_cap: account::SignerCapability
    }

    /// Initialize module
    fun init_module(account: &signer) {
        let admin_addr = signer::address_of(account);
        
        // Create admin capability
        move_to(account, AdminCap {
            owner: admin_addr,
        });
        
        // Create record table
        move_to(account, Record {
            record: table::new(),
        });
        
        // Create resource account with a seed
        let (_, signer_cap) = account::create_resource_account(account, b"tradingflow_vault_seed");
        
        // Save the signer capability
        move_to(account, ResourceSignerCapability { 
            signer_cap
        });
    }


    /// Create balance manager
    public entry fun create_balance_manager(
        user: &signer
    ) acquires Record {
        
        // Create balance manager
        let balance_manager = BalanceManager {
            owner: user_addr,
            balances: simple_map::create(),
            deposit_events: account::new_event_handle(user),
            withdraw_events: account::new_event_handle(user),
            admin_deposit_events: account::new_event_handle(user),
            admin_withdraw_events: account::new_event_handle(user),
            trade_signal_events: account::new_event_handle(user),
        };
        
        // Record user's balance manager
        let record = borrow_global_mut<Record>(@tradingflow_vault);
        record.record.add(user_addr, user_addr);
        
        // Move balance manager to user account
        move_to(user, balance_manager);
    }

    /// User deposit function
    public entry fun user_deposit(
        user: &signer,
        metadata: Object<Metadata>,
        amount: u64
    ) acquires BalanceManager {
        
        // Get user's balance manager
        let bm = borrow_global_mut<BalanceManager>(user_addr);
        assert!(bm.owner == user_addr, ENOT_OWNER);

        // Withdraw assets from user's store
        let fa = primary_fungible_store::withdraw(user, metadata, amount);
        
        // Deposit to balance manager
        deposit_internal(bm, fa);
        
        // Emit deposit event
        event::emit_event(&mut bm.deposit_events, UserDepositEvent {
            user: user_addr,
            asset_metadata: metadata,
            amount: amount,
        });
    }
    
    /// User withdrawal function
    public entry fun user_withdraw(
        user: &signer,
        metadata: Object<Metadata>,
        amount: u64
    ) acquires BalanceManager, ResourceSignerCapability {
        let user_addr = signer::address_of(user);
        
        // Get user's balance manager
        let bm = borrow_global_mut<BalanceManager>(user_addr);
        assert!(bm.owner == user_addr, ENOT_OWNER);
        
        // Withdraw tokens from balance manager
        let fa = withdraw_internal(bm, metadata, amount);
        
        // Emit withdrawal event
        event::emit_event(&mut bm.withdraw_events, UserWithdrawEvent {
            user: user_addr,
            asset_metadata: metadata,
            amount: amount,
        });

        // Withdraw to user
        primary_fungible_store::deposit(user_addr, fa)
    }
    
    /// Admin withdrawal function
    public entry fun admin_withdraw(
        admin: &signer,
        user_addr: address,
        metadata: Object<Metadata>,
        amount: u64
    ) acquires BalanceManager, ResourceSignerCapability, AdminCap {
        let admin_addr = signer::address_of(admin);
        
        // Verify admin
        let admin_cap = borrow_global<AdminCap>(@tradingflow_vault);
        assert!(admin_cap.owner == admin_addr, ENOT_ADMIN);
        
        // Get user's balance manager
        let bm = borrow_global_mut<BalanceManager>(user_addr);
        
        // Withdraw tokens from balance manager
        let fa = withdraw_internal(bm, metadata, amount);
        
        // Emit admin withdrawal event
        event::emit_event(&mut bm.admin_withdraw_events, AdminWithdrawEvent {
            admin: admin_addr,
            user: user_addr,
            asset_metadata: metadata,
            amount: amount,
        });
        
        // Transfer tokens to admin
        let admin_store = primary_fungible_store::ensure_primary_store_exists(admin_addr, metadata);
        fungible_asset::deposit(admin_store, fa);
    }
    
    /// Admin deposit function
    public entry fun admin_deposit(
        admin: &signer,
        user_addr: address,
        metadata: Object<Metadata>,
        amount: u64,
        min: u64
    ) acquires BalanceManager, AdminCap {
        let admin_addr = signer::address_of(admin);
        
        // Verify admin
        let admin_cap = borrow_global<AdminCap>(@tradingflow_vault);
        assert!(admin_cap.owner == admin_addr, ENOT_ADMIN);
        
        // Verify amount is at least min
        assert!(amount >= min, EBELOW_MIN_AMOUNT);
        
        // Get user's balance manager
        let bm = borrow_global_mut<BalanceManager>(user_addr);
        
        // Get admin's fungible store
        let admin_store = primary_fungible_store::primary_store(admin_addr, metadata);
        
        // Withdraw assets from admin's store
        let fa = fungible_asset::withdraw(admin, admin_store, amount);
        
        // Deposit to balance manager
        deposit_internal(bm, fa);
        
        // Emit admin deposit event
        event::emit_event(&mut bm.admin_deposit_events, AdminDepositEvent {
            admin: admin_addr,
            user: user_addr,
            asset_metadata: metadata,
            amount: amount,
        });
    }
    
    /// Send trade signal and execute Hyperion DEX transaction
    /// This function is called by admin to execute trades on behalf of users
    public entry fun send_trade_signal(
        admin: &signer,
        user_addr: address,
        from_token_metadata: Object<Metadata>,
        to_token_metadata: Object<Metadata>,
        fee_tier: u8,
        amount_in: u64,
        amount_out_min: u64,
        sqrt_price_limit: u128,
        recipient: address,
        deadline: u64
    ) acquires BalanceManager, ResourceSignerCapability, AdminCap {
        let admin_addr = signer::address_of(admin);
        
        // Verify admin
        let admin_cap = borrow_global<AdminCap>(@tradingflow_vault);
        assert!(admin_cap.owner == admin_addr, ENOT_ADMIN);
        
        // Get user's balance manager
        let bm = borrow_global_mut<BalanceManager>(user_addr);
        
        // Check if balance is sufficient
        let balance = get_balance(bm, from_token_metadata);
        assert!(balance >= amount_in, EINSUFFICIENT_BALANCE);
        
        // Withdraw tokens from balance manager
        let fa = withdraw_internal(bm, from_token_metadata, amount_in);
        
        // Emit trade signal event
        event::emit_event(&mut bm.trade_signal_events, TradeSignalEvent {
            user: user_addr,
            from_asset_metadata: from_token_metadata,
            to_asset_metadata: to_token_metadata,
            amount_in,
            amount_out_min,
        });
        
        // Get resource signer
        let resource_signer = get_resource_signer();
        
        // Get resource account address
        let resource_addr = signer::address_of(&resource_signer);
        
        // Ensure resource account has a store for the from token
        let resource_store = primary_fungible_store::ensure_primary_store_exists(resource_addr, from_token_metadata);

        // TODO:
        // primary_fungible_store::balance()

        // Execute swap on Hyperion DEX
        router_v3::exact_input_swap_entry(
            &resource_signer,
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
    
    /// Deposit to balance manager
    fun deposit_internal(bm: &mut BalanceManager, fa: FungibleAsset) acquires ResourceSignerCapability {
        let metadata = fungible_asset::asset_metadata(&fa);
        let amount = fungible_asset::amount(&fa);

        // Deposit assets to resource account
        primary_fungible_store::deposit(get_resource_addr(), fa);
        
        // Update balance
        if (bm.balances.contains_key(&metadata)) {
            let balance = bm.balances.borrow_mut(&metadata);
            *balance += amount;
        } else {
            bm.balances.add(metadata, amount);
        };
    }

    // Get Resource Address
    fun get_resource_addr():address acquires ResourceSignerCapability {
        account::get_signer_capability_address(&ResourceSignerCapability[@tradingflow_vault].signer_cap)
    }
    
    /// Withdraw from balance manager
    fun withdraw_internal(bm: &mut BalanceManager, metadata: Object<Metadata>, amount: u64): FungibleAsset acquires ResourceSignerCapability {
        // Check if balance is sufficient
        assert!(bm.balances.contains_key(&metadata), EINSUFFICIENT_BALANCE);
        let balance = bm.balances.borrow_mut(&metadata);
        assert!(*balance >= amount, EINSUFFICIENT_BALANCE);
        
        // Update balance
        *balance -= amount;

        // Use withdraw_with_resource_signer to withdraw assets
        withdraw_with_resource_signer(metadata, amount)
    }

    /// Get balance
    public fun get_balance(bm: &BalanceManager, metadata: Object<Metadata>): u64 {
        if (bm.balances.contains_key(&metadata)) {
            *bm.balances.borrow(&metadata)
        } else {
            0
        }
    }
    
    /// Get resource signer for the vault
    /// This function returns a signer for the vault's resource account
    fun get_resource_signer(): signer acquires ResourceSignerCapability {
        let cap = &borrow_global<ResourceSignerCapability>(@tradingflow_vault).signer_cap;
        account::create_signer_with_capability(cap)
    }
    
    /// Withdraw with resource signer
    /// This function withdraws assets using the resource account signer
    fun withdraw_with_resource_signer(metadata: Object<Metadata>,amount: u64): FungibleAsset acquires ResourceSignerCapability {
        let resource_signer = get_resource_signer();
        primary_fungible_store::withdraw(&resource_signer, metadata, amount)
    }
}
