// vault_tests.move
#[test_only]
module tradingflow_vault::vault_tests {
    use std::signer;
    use std::string;
    use std::vector;
    use aptos_framework::account;
    use aptos_framework::coin::{Self, MintCapability};
    use aptos_framework::aptos_coin::AptosCoin;
    use aptos_std::simple_map;
    
    use tradingflow_vault::vault::{Self, BalanceManager, AdminCap, AccessList, SupporterReward};
    
    /// 测试代币类型
    struct TestCoin {}
    
    /// 初始化测试环境
    fun setup_test(aptos_framework: &signer): (signer, signer, signer, SupporterReward) {
        // 创建测试账户
        let admin = account::create_account_for_test(@tradingflow_vault);
        let user = account::create_account_for_test(@0x456);
        let bot = account::create_account_for_test(@0x789);
        
        // 初始化金库
        vault::init_for_testing(&admin);
        
        // 注册并铸造测试代币
        let (burn_cap, mint_cap) = coin::initialize<TestCoin>(
            aptos_framework,
            string::utf8(b"Test Coin"),
            string::utf8(b"TEST"),
            8,
            false
        );
        
        // 给用户铸造一些代币
        let coins = coin::mint<TestCoin>(1000000, &mint_cap);
        coin::register<TestCoin>(&user);
        coin::deposit(@0x456, coins);
        
        // 给机器人铸造一些代币
        let bot_coins = coin::mint<TestCoin>(1000000, &mint_cap);
        coin::register<TestCoin>(&bot);
        coin::deposit(@0x789, bot_coins);
        
        // 创建支持者奖励
        let sr = vault::create_supporter_reward(&admin);
        
        // 清理
        coin::destroy_burn_cap(burn_cap);
        coin::destroy_mint_cap(mint_cap);
        
        (admin, user, bot, sr)
    }
    
    #[test]
    fun test_init_module() {
        let aptos_framework = account::create_account_for_test(@aptos_framework);
        let (admin, _, _, _) = setup_test(&aptos_framework);
        
        // 验证管理员权限是否正确创建
        assert!(exists<AdminCap>(@tradingflow_vault), 0);
        
        // 验证访问控制列表是否正确创建
        assert!(exists<AccessList>(@tradingflow_vault), 0);
        
        // 清理
        account::destroy_account(admin);
    }
    
    #[test]
    fun test_create_balance_manager() {
        let aptos_framework = account::create_account_for_test(@aptos_framework);
        let (admin, user, _, sr) = setup_test(&aptos_framework);
        
        // 创建余额管理器
        vault::create_balance_manager(&user, &sr);
        
        // 验证余额管理器是否正确创建
        assert!(exists<BalanceManager>(@0x456), 0);
        
        // 清理
        account::destroy_account(admin);
        account::destroy_account(user);
    }
    
    #[test]
    fun test_user_deposit_withdraw() {
        let aptos_framework = account::create_account_for_test(@aptos_framework);
        let (admin, user, _, sr) = setup_test(&aptos_framework);
        
        // 创建余额管理器
        vault::create_balance_manager(&user, &sr);
        
        // 用户存款
        vault::user_deposit<TestCoin>(&user, 10000, &sr);
        
        // 验证余额
        let balance = vault::get_balance<TestCoin>(borrow_global<BalanceManager>(@0x456));
        assert!(balance == 10000, 0);
        
        // 用户提款
        vault::user_withdraw<TestCoin>(&user, 5000, &sr);
        
        // 验证余额
        let balance = vault::get_balance<TestCoin>(borrow_global<BalanceManager>(@0x456));
        assert!(balance == 5000, 0);
        
        // 清理
        account::destroy_account(admin);
        account::destroy_account(user);
    }
    
    #[test]
    fun test_acl_management() {
        let aptos_framework = account::create_account_for_test(@aptos_framework);
        let (admin, _, bot, _) = setup_test(&aptos_framework);
        
        // 添加机器人到白名单
        vault::acl_add(&admin, @0x789);
        
        // 验证白名单
        let acl = borrow_global<AccessList>(@tradingflow_vault);
        assert!(vector::contains(&acl.allow, &@0x789), 0);
        
        // 从白名单移除机器人
        vault::acl_remove(&admin, @0x789);
        
        // 验证白名单
        let acl = borrow_global<AccessList>(@tradingflow_vault);
        assert!(!vector::contains(&acl.allow, &@0x789), 0);
        
        // 清理
        account::destroy_account(admin);
        account::destroy_account(bot);
    }
    
    #[test]
    #[expected_failure(abort_code = 1001)]
    fun test_bot_operations_without_whitelist() {
        let aptos_framework = account::create_account_for_test(@aptos_framework);
        let (admin, user, bot, sr) = setup_test(&aptos_framework);
        
        // 创建余额管理器
        vault::create_balance_manager(&user, &sr);
        
        // 用户存款
        vault::user_deposit<TestCoin>(&user, 10000, &sr);
        
        // 尝试机器人提款（应该失败，因为机器人不在白名单中）
        vault::bot_withdraw<TestCoin>(&bot, @0x456, 5000);
        
        // 清理
        account::destroy_account(admin);
        account::destroy_account(user);
        account::destroy_account(bot);
    }
    
    #[test]
    fun test_bot_operations_with_whitelist() {
        let aptos_framework = account::create_account_for_test(@aptos_framework);
        let (admin, user, bot, sr) = setup_test(&aptos_framework);
        
        // 创建余额管理器
        vault::create_balance_manager(&user, &sr);
        
        // 用户存款
        vault::user_deposit<TestCoin>(&user, 10000, &sr);
        
        // 添加机器人到白名单
        vault::acl_add(&admin, @0x789);
        
        // 机器人提款
        vault::bot_withdraw<TestCoin>(&bot, @0x456, 5000);
        
        // 验证余额
        let balance = vault::get_balance<TestCoin>(borrow_global<BalanceManager>(@0x456));
        assert!(balance == 5000, 0);
        
        // 机器人存款
        vault::bot_deposit<TestCoin>(&bot, @0x456, 2000, 1000);
        
        // 验证余额
        let balance = vault::get_balance<TestCoin>(borrow_global<BalanceManager>(@0x456));
        assert!(balance == 7000, 0);
        
        // 清理
        account::destroy_account(admin);
        account::destroy_account(user);
        account::destroy_account(bot);
    }
}
