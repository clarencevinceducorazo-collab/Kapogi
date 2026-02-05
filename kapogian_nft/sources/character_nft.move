module kapogian_nft::character_nft {
    use sui::tx_context::TxContext;
    use sui::object::{UID, ID};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use std::string::{Self, String};
    use sui::display;
    use sui::package;
    use sui::clock::{Self, Clock};
    
    use kapogian_nft::order_receipt;
    use kapogian_nft::treasury;

    // ===== Error Codes =====
    const EInsufficientPayment: u64 = 1;

    // ===== Structs =====
    
    /// One-time witness for creating Display
    public struct CHARACTER_NFT has drop {}

    /// Main Character NFT object
    public struct Character has key, store {
        id: UID,
        name: String,
        description: String,
        image_url: String,           // IPFS CID: ipfs://...
        attributes: String,           // JSON string of traits
        edition: u64,                 // Unique edition number
        minted_at: u64,              // Timestamp
    }

    /// Global counter for tracking editions (SHARED OBJECT)
    public struct MintCounter has key {
        id: UID,
        total_minted: u64,
    }

    /// Mint capability - OPTIONAL, only for admin functions if needed
    public struct MintCap has key, store {
        id: UID,
    }

    // ===== Events =====
    
    public struct CharacterMinted has copy, drop {
        nft_id: ID,
        owner: address,
        name: String,
        edition: u64,
        timestamp: u64,
    }

    // ===== Init Function =====
    
    /// Initialize the module - creates Publisher, Display, and shared MintCounter
    fun init(otw: CHARACTER_NFT, ctx: &mut TxContext) {
        // Create Publisher for collection
        let publisher = package::claim(otw, ctx);

        // Create Display standard for Tradeport
        let mut display = display::new<Character>(&publisher, ctx);
        
        display::add(&mut display, string::utf8(b"name"), string::utf8(b"{name}"));
        display::add(&mut display, string::utf8(b"description"), string::utf8(b"{description}"));
        display::add(&mut display, string::utf8(b"image_url"), string::utf8(b"{image_url}"));
        display::add(&mut display, string::utf8(b"attributes"), string::utf8(b"{attributes}"));
        display::add(&mut display, string::utf8(b"project_url"), string::utf8(b"https://kapogian.xyz"));
        display::add(&mut display, string::utf8(b"creator"), string::utf8(b"Kapogian Team"));
        
        display::update_version(&mut display);

        // Transfer Publisher and Display to deployer
        transfer::public_transfer(publisher, ctx.sender());
        transfer::public_transfer(display, ctx.sender());

        // Create SHARED MintCounter (accessible by everyone)
        let mint_counter = MintCounter {
            id: object::new(ctx),
            total_minted: 0,
        };
        transfer::share_object(mint_counter);

        // Create MintCap for potential admin functions
        let mint_cap = MintCap {
            id: object::new(ctx),
        };
        transfer::public_transfer(mint_cap, ctx.sender());
    }

    // ===== Public Functions =====

    /// PUBLIC MINT - Anyone can mint by paying 20 SUI
    /// No MintCap required!
    public fun mint_character(
        mint_counter: &mut MintCounter,  // Shared object - anyone can access
        payment: Coin<SUI>,
        name: String,
        description: String,
        image_url: String,
        attributes: String,
        items_selected: String,
        encrypted_shipping_info: String,
        encryption_pubkey: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // Verify payment amount (20 SUI = 20_000_000_000 MIST)
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= treasury::base_mint_price(), EInsufficientPayment);

        // Process payment to treasury
        treasury::process_payment(payment, ctx);

        // Increment edition counter
        mint_counter.total_minted = mint_counter.total_minted + 1;
        let edition = mint_counter.total_minted;

        // Get current timestamp
        let timestamp = clock::timestamp_ms(clock);

        // Create Character NFT
        let nft_id = object::new(ctx);
        let nft_id_copy = object::uid_to_inner(&nft_id);
        
        let character = Character {
            id: nft_id,
            name,
            description,
            image_url,
            attributes,
            edition,
            minted_at: timestamp,
        };

        let sender = ctx.sender();

        // Emit minting event
        event::emit(CharacterMinted {
            nft_id: nft_id_copy,
            owner: sender,
            name: character.name,
            edition,
            timestamp,
        });

        // Transfer NFT to minter
        transfer::public_transfer(character, sender);

        // Create Order Receipt (Soulbound Token)
        order_receipt::create_receipt(
            nft_id_copy,
            sender,
            items_selected,
            encrypted_shipping_info,
            encryption_pubkey,
            payment_amount,
            clock,
            ctx
        );
    }

    /// Process bundle upgrade payment (additional 10 SUI)
    public fun upgrade_to_bundle(
        receipt_id: ID,
        payment: Coin<SUI>,
        new_encrypted_shipping_info: String,
        ctx: &mut TxContext
    ) {
        // Verify payment (10 SUI)
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= treasury::bundle_upgrade_price(), EInsufficientPayment);

        // Process payment
        treasury::process_payment(payment, ctx);

        // Update receipt with bundle upgrade
        order_receipt::upgrade_to_bundle(
            receipt_id,
            new_encrypted_shipping_info,
            payment_amount,
            ctx
        );
    }

    // ===== View Functions =====

    /// Get character details
    public fun get_character_info(character: &Character): (String, String, String, u64, u64) {
        (
            character.name,
            character.description,
            character.image_url,
            character.edition,
            character.minted_at
        )
    }

    /// Get total minted count
    public fun get_total_minted(mint_counter: &MintCounter): u64 {
        mint_counter.total_minted
    }

    // ===== Test Functions =====
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        let otw = CHARACTER_NFT {};
        init(otw, ctx);
    }
}