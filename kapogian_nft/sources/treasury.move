module kapogian_nft::treasury {
    use sui::tx_context::TxContext;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::transfer;
    use sui::event;

    // ===== Constants =====
    
    /// Base mint price: 20 SUI (in MIST: 1 SUI = 1_000_000_000 MIST)
    const BASE_MINT_PRICE: u64 = 20_000_000;
    
    /// Bundle upgrade price: 10 SUIz
    const BUNDLE_UPGRADE_PRICE: u64 = 10_000_000;
    
    /// Treasury address (hardcoded from PRD)
    const TREASURY_ADDRESS: address = @treasury;

    // ===== Events =====

    public struct PaymentProcessed has copy, drop {
        amount: u64,
        payment_type: u8,  // 0 = Base Mint, 1 = Bundle Upgrade
        timestamp: u64,
    }

    // ===== Public Functions =====

    /// Process payment and send to treasury
    public(package) fun process_payment(
        payment: Coin<SUI>,
        _ctx: &mut TxContext
    ) {
        let amount = coin::value(&payment);
        
        // Determine payment type
        let payment_type = if (amount >= BASE_MINT_PRICE && amount < (BASE_MINT_PRICE + BUNDLE_UPGRADE_PRICE)) {
            0  // Base Mint
        } else {
            1  // Bundle Upgrade or Full Payment
        };

        // Note: Event timestamp handled by blockchain indexer
        event::emit(PaymentProcessed {
            amount,
            payment_type,
            timestamp: 0,
        });

        // Transfer entire payment to treasury
        transfer::public_transfer(payment, TREASURY_ADDRESS);
    }

    // ===== View Functions =====

    /// Get base mint price
    public fun base_mint_price(): u64 {
        BASE_MINT_PRICE
    }

    /// Get bundle upgrade price
    public fun bundle_upgrade_price(): u64 {
        BUNDLE_UPGRADE_PRICE
    }

    /// Get treasury address
    public fun treasury_address(): address {
        TREASURY_ADDRESS
    }

    /// Calculate total price for bundle
    public fun total_bundle_price(): u64 {
        BASE_MINT_PRICE + BUNDLE_UPGRADE_PRICE
    }
}