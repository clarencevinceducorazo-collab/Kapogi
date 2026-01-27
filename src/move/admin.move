module kapogian_nft::admin {
    use sui::tx_context::TxContext;
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::clock::Clock;
    use std::string::String;
    
    use kapogian_nft::order_receipt::{Self, OrderReceipt};

    // ===== Structs =====

    /// Admin Capability - Proof of admin authority
    public struct AdminCap has key, store {
        id: UID,
        issued_to: address,  // Treasury address
        issued_at: u64,      // Timestamp when created
    }

    // ===== Init Function =====

    /// Initialize admin module - creates AdminCap and sends to treasury
    fun init(ctx: &mut TxContext) {
        let admin_cap = AdminCap {
            id: object::new(ctx),
            issued_to: 0x262da71b77b62fe106c8a0b7ffa6e3ad6bb2898ffda5db074107bf0bf5e6aa7a,
            issued_at: 0,  // Set during init, timestamp not critical for AdminCap
        };

        // Transfer AdminCap to treasury address
        transfer::public_transfer(admin_cap, 0x262da71b77b62fe106c8a0b7ffa6e3ad6bb2898ffda5db074107bf0bf5e6aa7a);
    }

    // ===== Admin Functions =====

    /// Mark order as shipped (admin only)
    public fun mark_as_shipped(
        _admin_cap: &AdminCap,
        receipt: &mut OrderReceipt,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // AdminCap ownership is verified by Sui runtime
        // Update receipt status to SHIPPED (1)
        order_receipt::update_status(receipt, 1, clock, ctx);
    }

    /// Mark order as delivered (admin only)
    public fun mark_as_delivered(
        _admin_cap: &AdminCap,
        receipt: &mut OrderReceipt,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Update receipt status to DELIVERED (2)
        order_receipt::update_status(receipt, 2, clock, ctx);
    }

    /// Get receipt information (admin only)
    /// Returns all receipt data including encrypted shipping info
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
        u64           // updated_at
    ) {
        order_receipt::get_receipt_info(receipt)
    }

    // ===== View Functions =====

    /// Verify if an address has admin capability
    public fun is_admin(admin_cap: &AdminCap, addr: address): bool {
        admin_cap.issued_to == addr
    }

    /// Get admin cap holder
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
