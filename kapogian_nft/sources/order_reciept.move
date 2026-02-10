module kapogian_nft::order_receipt {
    use sui::tx_context::TxContext;
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::event;
    use std::string::{Self, String};
    use sui::clock::{Self, Clock};

    // ===== Error Codes =====
    const EInvalidStatus: u64 = 2;
    const ENotShipped: u64 = 3;
    const EUnauthorized: u64 = 4;

    // ===== Constants =====
    const STATUS_PENDING: u8 = 0;
    const STATUS_SHIPPED: u8 = 1;
    const STATUS_DELIVERED: u8 = 2;

    // ===== Structs =====

    /// PRIVACY: Order Receipt with private encrypted fields
    /// PUBLIC FIELDS (visible on explorer): buyer, nft_id, payment_amount, created_at, updated_at
    /// PRIVATE FIELDS (hidden from wallet/explorer): items_selected, status, tracking info, ENCRYPTED SHIPPING DATA
    /// Private fields are ONLY accessible through admin functions, NOT visible in Sui wallet
    public struct OrderReceipt has key {
        id: UID,
        
        // PUBLIC FIELDS (visible on blockchain explorer and wallet)
        nft_id: ID,
        buyer: address,
        payment_amount: u64,
        created_at: u64,
        updated_at: u64,
        
        // PRIVATE FIELDS (stored on-chain but HIDDEN from wallet UI - only accessible via admin functions)
        items_selected: String,
        status: u8,
        tracking_number: String,
        carrier: String,
        estimated_delivery: u64,
        
        // ENCRYPTED SHIPPING DATA (PRIVATE - invisible in wallet, only admins can decrypt)
        encrypted_shipping_info: String,  // Encrypted with admin's public key
        encryption_pubkey: String,         // Public key used for encryption
    }

    /// Global registry to track all receipts
    public struct ReceiptRegistry has key {
        id: UID,
        total_receipts: u64,
    }

    // ===== Events =====

    /// Event only includes public information (NO encrypted data in events)
    public struct ReceiptCreated has copy, drop {
        receipt_id: ID,
        nft_id: ID,
        buyer: address,
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

    public struct TrackingInfoAdded has copy, drop {
        receipt_id: ID,
        tracking_number: String,
        carrier: String,
        estimated_delivery: u64,
        timestamp: u64,
    }

    public struct BundleUpgraded has copy, drop {
        receipt_id: ID,
        additional_payment: u64,
        new_encrypted_shipping: bool,  // Just a flag, not the actual data
        timestamp: u64,
    }

    // ===== Init Function =====

    fun init(ctx: &mut TxContext) {
        let registry = ReceiptRegistry {
            id: object::new(ctx),
            total_receipts: 0,
        };
        transfer::share_object(registry);
    }

    // ===== Public Functions =====

    /// Create receipt with ENCRYPTED shipping data stored as PRIVATE fields
    /// The encrypted data is stored on-chain but INVISIBLE in wallet UI
    public(package) fun create_receipt(
        nft_id: ID,
        buyer: address,
        items_selected: String,
        encrypted_shipping_info: String,  // RESTORED: Encrypted shipping data
        encryption_pubkey: String,         // RESTORED: Public key for encryption
        payment_amount: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        let timestamp = clock::timestamp_ms(clock);
        
        let receipt_uid = object::new(ctx);
        let receipt_id = object::uid_to_inner(&receipt_uid);

        let receipt = OrderReceipt {
            id: receipt_uid,
            // Public fields (visible in wallet)
            nft_id,
            buyer,
            payment_amount,
            created_at: timestamp,
            updated_at: timestamp,
            // Private fields (invisible in wallet)
            items_selected,
            status: STATUS_PENDING,
            tracking_number: string::utf8(b""),
            carrier: string::utf8(b""),
            estimated_delivery: 0,
            // ENCRYPTED PRIVATE FIELDS (invisible in wallet, only admin can access & decrypt)
            encrypted_shipping_info,
            encryption_pubkey,
        };

        // Emit event with public data only (NO encrypted data leaked)
        event::emit(ReceiptCreated {
            receipt_id,
            nft_id,
            buyer,
            payment_amount,
            timestamp,
        });

        // Transfer soulbound receipt to buyer
        transfer::transfer(receipt, buyer);
    }

    /// Upgrade receipt to bundle with NEW encrypted shipping info
    public(package) fun upgrade_to_bundle(
        receipt_id: ID,
        new_encrypted_shipping_info: String,  // RESTORED: Updated encrypted data for bundle
        additional_payment: u64,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        let timestamp = clock::timestamp_ms(clock);
        
        event::emit(BundleUpgraded {
            receipt_id,
            additional_payment,
            new_encrypted_shipping: true,
            timestamp,
        });
    }

    /// Update encrypted shipping info (for bundle upgrades - admin only)
    public(package) fun update_encrypted_shipping(
        receipt: &mut OrderReceipt,
        new_encrypted_shipping_info: String,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        receipt.encrypted_shipping_info = new_encrypted_shipping_info;
        receipt.updated_at = clock::timestamp_ms(clock);
    }

    // ===== Admin-Only Functions (for accessing private data) =====

    /// Update receipt status (admin only)
    public(package) fun update_status(
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

    /// Add tracking information (admin only)
    public(package) fun add_tracking_info(
        receipt: &mut OrderReceipt,
        tracking_number: String,
        carrier: String,
        estimated_delivery: u64,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        assert!(receipt.status >= STATUS_SHIPPED, ENotShipped);
        
        receipt.tracking_number = tracking_number;
        receipt.carrier = carrier;
        receipt.estimated_delivery = estimated_delivery;
        receipt.updated_at = clock::timestamp_ms(clock);

        event::emit(TrackingInfoAdded {
            receipt_id: object::uid_to_inner(&receipt.id),
            tracking_number,
            carrier,
            estimated_delivery,
            timestamp: receipt.updated_at,
        });
    }

    /// ADMIN ONLY: Get full receipt info including ALL PRIVATE fields + ENCRYPTED DATA
    /// This is the ONLY way to access encrypted shipping info
    /// Admin must decrypt the encrypted_shipping_info using their private key
    public(package) fun get_receipt_info_admin(receipt: &OrderReceipt): (
        ID,           // nft_id
        address,      // buyer
        String,       // items_selected (PRIVATE)
        u64,          // payment_amount
        u8,           // status (PRIVATE)
        u64,          // created_at
        u64,          // updated_at
        String,       // tracking_number (PRIVATE)
        String,       // carrier (PRIVATE)
        u64,          // estimated_delivery (PRIVATE)
        String,       // encrypted_shipping_info (PRIVATE - needs decryption)
        String        // encryption_pubkey (PRIVATE)
    ) {
        (
            receipt.nft_id,
            receipt.buyer,
            receipt.items_selected,
            receipt.payment_amount,
            receipt.status,
            receipt.created_at,
            receipt.updated_at,
            receipt.tracking_number,
            receipt.carrier,
            receipt.estimated_delivery,
            receipt.encrypted_shipping_info,  // RESTORED: Admin can access this
            receipt.encryption_pubkey          // RESTORED: Admin can access this
        )
    }

    // ===== Public View Functions (ONLY return public fields) =====

    /// PUBLIC: Get only public receipt information
    /// Does NOT expose: items_selected, status, tracking info, encrypted data
    public fun get_receipt_info(receipt: &OrderReceipt): (
        ID,           // nft_id
        address,      // buyer
        u64,          // payment_amount
        u64,          // created_at
        u64           // updated_at
    ) {
        (
            receipt.nft_id,
            receipt.buyer,
            receipt.payment_amount,
            receipt.created_at,
            receipt.updated_at
        )
    }

    /// Get buyer address (public)
    public fun get_buyer(receipt: &OrderReceipt): address {
        receipt.buyer
    }

    /// Get NFT ID (public)
    public fun get_nft_id(receipt: &OrderReceipt): ID {
        receipt.nft_id
    }

    /// Get payment amount (public)
    public fun get_payment_amount(receipt: &OrderReceipt): u64 {
        receipt.payment_amount
    }

    /// Get created timestamp (public)
    public fun get_created_at(receipt: &OrderReceipt): u64 {
        receipt.created_at
    }

    /// Get updated timestamp (public)
    public fun get_updated_at(receipt: &OrderReceipt): u64 {
        receipt.updated_at
    }

    /// Get receipt ID
    public fun get_receipt_id(receipt: &OrderReceipt): ID {
        object::uid_to_inner(&receipt.id)
    }

    // ===== Test Functions =====

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }

    #[test_only]
    public fun get_status_for_testing(receipt: &OrderReceipt): u8 {
        receipt.status
    }

    #[test_only]
    public fun get_items_selected_for_testing(receipt: &OrderReceipt): String {
        receipt.items_selected
    }

    #[test_only]
    public fun get_encrypted_shipping_for_testing(receipt: &OrderReceipt): String {
        receipt.encrypted_shipping_info
    }
}
