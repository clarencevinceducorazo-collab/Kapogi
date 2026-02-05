module kapogian_nft::admin {
    use sui::tx_context::TxContext;
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::clock::Clock;
    use std::string::String;
    
    use kapogian_nft::order_receipt::{Self, OrderReceipt};

    // ===== Structs =====

    public struct AdminCap has key, store {
        id: UID,
        issued_to: address,
        issued_at: u64,
    }

    // ===== Init Function =====

    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
            issued_to: @treasury,
            issued_at: 0,
        };

        transfer::public_transfer(admin_cap, @treasury);
    }

    // ===== Admin Functions =====

    /// Mark order as shipped (admin only)
    public fun mark_as_shipped(
        _admin_cap: &AdminCap,
        receipt: &mut OrderReceipt,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        order_receipt::update_status(receipt, 1, clock, ctx);
    }

    /// Mark order as delivered (admin only)
    public fun mark_as_delivered(
        _admin_cap: &AdminCap,
        receipt: &mut OrderReceipt,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        order_receipt::update_status(receipt, 2, clock, ctx);
    }

    /// NEW: Add tracking information to order (admin only)
    public fun add_tracking_information(
        _admin_cap: &AdminCap,
        receipt: &mut OrderReceipt,
        tracking_number: String,
        carrier: String,
        estimated_delivery: u64,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        order_receipt::add_tracking_info(
            receipt,
            tracking_number,
            carrier,
            estimated_delivery,
            clock,
            ctx
        );
    }

    /// Get receipt information (admin only)
    public fun get_receipt_details(
        _admin_cap: &AdminCap,
        receipt: &OrderReceipt
    ): (
        ID,           // nft_id
        address,      // buyer
        String,       // items_selected
        String,       // encrypted_shipping_info
        String,       // encryption_pubkey
        u64,          // payment_amount
        u8,           // status
        u64,          // created_at
        u64,          // updated_at
        String,       // tracking_number (NEW)
        String,       // carrier (NEW)
        u64           // estimated_delivery (NEW)
    ) {
        order_receipt::get_receipt_info(receipt)
    }

    // ===== View Functions =====

    public fun is_admin(admin_cap: &AdminCap, addr: address): bool {
        admin_cap.issued_to == addr
    }

    public fun get_admin_address(admin_cap: &AdminCap): address {
        admin_cap.issued_to
    }

    // ===== Test Functions =====

    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        init(ctx);
    }

    #[test_only]
    public fun create_admin_cap_for_testing(ctx: &mut TxContext): AdminCap {
        AdminCap {
            id: object::new(ctx),
            issued_to: ctx.sender(),
            issued_at: 0,
        }
    }
}