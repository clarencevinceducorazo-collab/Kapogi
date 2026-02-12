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

    // ===== Constants =====
    const STATUS_PENDING: u8 = 0;
    const STATUS_SHIPPED: u8 = 1;
    const STATUS_DELIVERED: u8 = 2;

    // ===== Structs =====

    /// Order Receipt with private encrypted fields
    public struct OrderReceipt has key {
        id: UID,
        
        // PUBLIC FIELDS
        nft_id: ID,
        buyer: address,
        payment_amount: u64,
        created_at: u64,
        updated_at: u64,
        
        // PRIVATE FIELDS
        items_selected: String,
        status: u8,
        tracking_number: String,
        carrier: String,
        estimated_delivery: u64,
        
        // ENCRYPTED SHIPPING DATA
        encrypted_shipping_info: String,
        encryption_pubkey: String,
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

    public struct ShippingInfoUpdated has copy, drop {
        receipt_id: ID,
        updated_by: address,
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

    /// Create receipt with ENCRYPTED shipping data
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
            payment_amount,
            created_at: timestamp,
            updated_at: timestamp,
            items_selected,
            status: STATUS_PENDING,
            tracking_number: string::utf8(b""),
            carrier: string::utf8(b""),
            estimated_delivery: 0,
            encrypted_shipping_info,
            encryption_pubkey,
        };

        event::emit(ReceiptCreated {
            receipt_id,
            nft_id,
            buyer,
            payment_amount,
            timestamp,
        });

        transfer::transfer(receipt, buyer);
    }

    /// Update encrypted shipping info (for bundle upgrades)
    public(package) fun update_encrypted_shipping(
        receipt: &mut OrderReceipt,
        new_encrypted_shipping_info: String,
        clock: &Clock,
        _ctx: &mut TxContext
    ) {
        receipt.encrypted_shipping_info = new_encrypted_shipping_info;
        receipt.updated_at = clock::timestamp_ms(clock);

        event::emit(ShippingInfoUpdated {
            receipt_id: object::uid_to_inner(&receipt.id),
            updated_by: receipt.buyer,
            timestamp: receipt.updated_at,
        });
    }

    // ===== Admin-Only Functions =====

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

    /// ADMIN ONLY: Get full receipt info
    public(package) fun get_receipt_info_admin(receipt: &OrderReceipt): (
        ID, address, String, u64, u8, u64, u64, String, String, u64, String, String
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
            receipt.encrypted_shipping_info,
            receipt.encryption_pubkey
        )
    }

    // ===== Public View Functions =====

    /// Get only public receipt information
    public fun get_receipt_info(receipt: &OrderReceipt): (ID, address, u64, u64, u64) {
        (
            receipt.nft_id,
            receipt.buyer,
            receipt.payment_amount,
            receipt.created_at,
            receipt.updated_at
        )
    }

    public fun get_buyer(receipt: &OrderReceipt): address {
        receipt.buyer
    }

    public fun get_nft_id(receipt: &OrderReceipt): ID {
        receipt.nft_id
    }

    public fun get_payment_amount(receipt: &OrderReceipt): u64 {
        receipt.payment_amount
    }

    public fun get_created_at(receipt: &OrderReceipt): u64 {
        receipt.created_at
    }

    public fun get_updated_at(receipt: &OrderReceipt): u64 {
        receipt.updated_at
    }

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
