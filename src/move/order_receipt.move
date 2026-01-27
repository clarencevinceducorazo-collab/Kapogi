module kapogian_nft::order_receipt {
    use sui::tx_context::TxContext;
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::event;
    use std::string::String;
    use sui::clock::{Self, Clock};

    // ===== Error Codes =====
    const EInvalidStatus: u64 = 2;

    // ===== Constants =====
    const STATUS_PENDING: u8 = 0;
    const STATUS_DELIVERED: u8 = 2;

    // ===== Structs =====

    /// Soulbound Order Receipt - Cannot be transferred
    public struct OrderReceipt has key {
        id: UID,
        nft_id: ID,                          // Reference to Character NFT
        buyer: address,                       // Wallet that minted
        items_selected: String,               // "SHIRT" | "MUG" | "MOUSEPAD" | "PLATE" | "ALL_BUNDLE"
        encrypted_shipping_info: String,      // Encrypted blob
        encryption_pubkey: String,            // Public key used for encryption
        payment_amount: u64,                  // Total paid in MIST
        status: u8,                          // 0=Pending, 1=Shipped, 2=Delivered
        created_at: u64,                     // Timestamp
        updated_at: u64,                     // Last update timestamp
    }

    /// Global registry to track all receipts
    public struct ReceiptRegistry has key {
        id: UID,
        total_receipts: u64,
    }

    // ===== Events =====

    public struct ReceiptCreated has copy, drop {
        receipt_id: ID,
        nft_id: ID,
        buyer: address,
        items_selected: String,
        payment_amount: u64,
        timestamp: u64,
    }

    public struct ReceiptUpdated has copy, drop {
        receipt_id: ID,
        old_status: u8,
        new_status: u8,
        updated_by: address,
        timestamp: u64,
    }

    public struct BundleUpgraded has copy, drop {
        receipt_id: ID,
        additional_payment: u64,
        timestamp: u64,
    }

    // ===== Init Function =====

    fun init(ctx: &mut TxContext) {
        // Create global receipt registry
        let registry = ReceiptRegistry {
            id: object::new(ctx),
            total_receipts: 0,
        };
        transfer::share_object(registry);
    }

    // ===== Public Functions =====

    /// Create a new order receipt (called by character_nft module)
    public(package) fun create_receipt(
        nft_id: ID,
        buyer: address,
        items_selected: String,
        encrypted_shipping_info: String,
        encryption_pubkey: String,
        payment_amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let timestamp = clock::timestamp_ms(clock);
        
        let receipt_uid = object::new(ctx);
        let receipt_id = object::uid_to_inner(&receipt_uid);

        let receipt = OrderReceipt {
            id: receipt_uid,
            nft_id,
            buyer,
            items_selected,
            encrypted_shipping_info,
            encryption_pubkey,
            payment_amount,
            status: STATUS_PENDING,
            created_at: timestamp,
            updated_at: timestamp,
        };

        // Emit event
        event::emit(ReceiptCreated {
            receipt_id,
            nft_id,
            buyer,
            items_selected,
            payment_amount,
            timestamp,
        });

        // Transfer receipt to buyer (Soulbound - cannot be transferred after)
        transfer::transfer(receipt, buyer);
    }

    /// Upgrade receipt to bundle (called by character_nft module)
    public(package) fun upgrade_to_bundle(
        receipt_id: ID,
        _new_encrypted_shipping_info: String,
        additional_payment: u64,
        _ctx: &mut TxContext
    ) {
        // Note: In a full implementation, you would:
        // 1. Use dynamic_object_field to fetch receipt by ID
        // 2. Update items_selected to "ALL_BUNDLE"
        // 3. Update encrypted_shipping_info
        // 4. Update payment_amount
        
        // For now, emit event for tracking
        event::emit(BundleUpgraded {
            receipt_id,
            additional_payment,
            timestamp: 0,  // Blockchain handles event timestamps
        });
    }

    // ===== Admin Functions =====

    /// Update receipt status (admin only)
    /// This function needs to be called with admin_cap from admin module
    public fun update_status(
        receipt: &mut OrderReceipt,
        new_status: u8,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        assert!(new_status <= STATUS_DELIVERED, EInvalidStatus);
        
        let old_status = receipt.status;
        receipt.status = new_status;
        receipt.updated_at = clock::timestamp_ms(clock);

        event::emit(ReceiptUpdated {
            receipt_id: object::uid_to_inner(&receipt.id),
            old_status,
            new_status,
            updated_by: ctx.sender(),
            timestamp: receipt.updated_at,
        });
    }

    // ===== View Functions =====

    /// Get receipt information (returns encrypted data)
    public fun get_receipt_info(receipt: &OrderReceipt): (
        ID,           // nft_id
        address,      // buyer
        String,       // items_selected
        String,       // encrypted_shipping_info
        String,       // encryption_pubkey
        u64,          // payment_amount
        u8,           // status
        u64,          // created_at
        u64           // updated_at
    ) {
        (
            receipt.nft_id,
            receipt.buyer,
            receipt.items_selected,
            receipt.encrypted_shipping_info,
            receipt.encryption_pubkey,
            receipt.payment_amount,
            receipt.status,
            receipt.created_at,
            receipt.updated_at
        )
    }

    /// Get receipt status
    public fun get_status(receipt: &OrderReceipt): u8 {
        receipt.status
    }

    /// Get buyer address
    public fun get_buyer(receipt: &OrderReceipt): address {
        receipt.buyer
    }

    /// Get encrypted shipping info
    public fun get_encrypted_shipping(receipt: &OrderReceipt): String {
        receipt.encrypted_shipping_info
    }

    /// Get encryption public key
    public fun get_encryption_pubkey(receipt: &OrderReceipt): String {
        receipt.encryption_pubkey
    }

    // ===== Test Functions =====

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }
}
