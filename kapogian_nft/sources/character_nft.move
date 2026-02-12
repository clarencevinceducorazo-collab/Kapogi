module kapogian_nft::character_nft {
    use sui::tx_context::TxContext;
    use sui::object::{Self, UID, ID};
    use sui::transfer;
    use sui::coin::{Self, Coin};
    use sui::sui::SUI;
    use sui::event;
    use std::string::{Self, String};
    use sui::display;
    use sui::package::{Self, Publisher};
    use sui::clock::{Self, Clock};
    
    // KIOSK & TRANSFER POLICY IMPORTS
    use sui::kiosk::{Self, Kiosk, KioskOwnerCap};
    use sui::transfer_policy::{Self, TransferPolicy, TransferPolicyCap};
    
    // ===== NEW: ROYALTY ENFORCEMENT IMPORTS =====
    // Note: These are part of sui-framework extensions
    // use sui::royalty_rule;  // Commented out - optional extension
    // use sui::kiosk_lock_rule;  // Commented out - optional extension
    
    use kapogian_nft::order_receipt::{Self, OrderReceipt};
    use kapogian_nft::treasury;

    // ===== Error Codes =====
    const EInsufficientPayment: u64 = 1;
    const EInvalidKioskOwner: u64 = 2;
    const EUnauthorizedReceiptAccess: u64 = 4;
    const EInvalidBundleUpgrade: u64 = 5;

    // ===== Structs =====
    
    /// One-time witness for creating Display
    public struct CHARACTER_NFT has drop {}

    /// Main Character NFT object
    /// IMPORTANT: Has 'store' ability so it CAN be locked in Kiosk
    public struct Character has key, store {
        id: UID,
        name: String,
        lore: String,
        image_url: String,
        attributes: String,
        mmr: u64,
        edition: u64,
        minted_at: u64,
    }

    /// Global counter for tracking editions (SHARED OBJECT)
    public struct MintCounter has key {
        id: UID,
        total_minted: u64,
    }

    /// Mint capability - for admin functions
    public struct MintCap has key, store {
        id: UID,
    }

    // ===== NEW: Collection Metadata =====
    /// Collection-level metadata for marketplace display
    public struct CollectionMetadata has key {
        id: UID,
        name: String,
        description: String,
        symbol: String,
        website: String,
        twitter: String,
        discord: String,
        total_supply: u64,           // Max supply (0 = unlimited)
        royalty_percentage: u64,     // Basis points (e.g., 500 = 5%)
    }

    // ===== Events =====
    
    public struct CharacterMinted has copy, drop {
        nft_id: ID,
        owner: address,
        name: String,
        edition: u64,
        kiosk_id: ID,
        timestamp: u64,
    }

    public struct TransferPolicyCreated has copy, drop {
        policy_id: ID,
        royalty_basis_points: u16,
        min_amount: u64,
    }

    public struct KioskCreated has copy, drop {
        kiosk_id: ID,
        owner: address,
        timestamp: u64,
    }

    public struct BundleUpgraded has copy, drop {
        receipt_id: ID,
        owner: address,
        additional_payment: u64,
        timestamp: u64,
    }

    // Note: Royalty information is stored in CollectionMetadata for marketplace reference

    public struct CollectionMetadataCreated has copy, drop {
        metadata_id: ID,
        name: String,
        symbol: String,
        royalty_percentage: u64,
    }

    // ===== Init Function =====
    
    /// Initialize the module - creates Publisher, Display, Transfer Policy, and MintCounter
    fun init(otw: CHARACTER_NFT, ctx: &mut TxContext) {
        // 1. Create Publisher for collection
        let publisher = package::claim(otw, ctx);

        // 2. Create Display standard for NFTs (TradePort compatible)
        let mut display = display::new<Character>(&publisher, ctx);
        
        // REQUIRED fields for TradePort
        display::add(&mut display, string::utf8(b"name"), string::utf8(b"{name}"));
        display::add(&mut display, string::utf8(b"description"), string::utf8(b"{lore}"));
        display::add(&mut display, string::utf8(b"image_url"), string::utf8(b"{image_url}"));
        
        // Attributes in JSON format (recommended for TradePort)
        display::add(&mut display, string::utf8(b"attributes"), string::utf8(b"{attributes}"));
        
        // Optional metadata
        display::add(&mut display, string::utf8(b"project_url"), string::utf8(b"https://kapogian.xyz"));
        display::add(&mut display, string::utf8(b"creator"), string::utf8(b"Kapogian Team"));
        display::add(&mut display, string::utf8(b"edition"), string::utf8(b"#{edition}"));
        display::add(&mut display, string::utf8(b"mmr"), string::utf8(b"{mmr}"));
        
        display::update_version(&mut display);

        // 3. Create Transfer Policy (CRITICAL for TradePort)
        let (mut policy, policy_cap) = transfer_policy::new<Character>(&publisher, ctx);
        
        // ===== ROYALTY ENFORCEMENT (OPTIONAL) =====
        // TradePort supports royalties, but they must be configured through the marketplace UI
        // or by using Sui's royalty policy extensions. For now, we're using a basic policy.
        // 
        // To add on-chain royalty enforcement later, you can:
        // 1. Use Sui Kiosk extensions (requires additional dependencies)
        // 2. Or configure royalties through TradePort's collection settings
        //
        // For marketplace compatibility, the basic Transfer Policy is sufficient.
        
        let policy_id = object::id(&policy);
        let royalty_amount = 500u16; // 5% royalty (for reference)
        let min_amount = 1_000_000u64; // Minimum 0.001 SUI royalty (for reference)

        // Emit policy creation event
        event::emit(TransferPolicyCreated {
            policy_id,
            royalty_basis_points: royalty_amount, // Reference value for marketplace
            min_amount,
        });

        // Note: Actual royalty enforcement is handled by TradePort marketplace settings

        // 4. ===== NEW: Create Collection Metadata =====
        let metadata_id = object::new(ctx);
        let metadata_id_copy = object::uid_to_inner(&metadata_id);
        
        let collection_metadata = CollectionMetadata {
            id: metadata_id,
            name: string::utf8(b"Kapogian Characters"),
            description: string::utf8(b"Official Kapogian Character NFT Collection with physical merchandise redemption"),
            symbol: string::utf8(b"KAPO"),
            website: string::utf8(b"https://kapogian.xyz"),
            twitter: string::utf8(b"https://twitter.com/kapogian"),
            discord: string::utf8(b"https://discord.gg/kapogian"),
            total_supply: 0,  // Unlimited supply
            royalty_percentage: (royalty_amount as u64),
        };

        event::emit(CollectionMetadataCreated {
            metadata_id: metadata_id_copy,
            name: string::utf8(b"Kapogian Characters"),
            symbol: string::utf8(b"KAPO"),
            royalty_percentage: (royalty_amount as u64),
        });

        // Share collection metadata (for marketplace queries)
        transfer::share_object(collection_metadata);

        // 5. Transfer Publisher and Display to deployer
        transfer::public_transfer(publisher, ctx.sender());
        transfer::public_transfer(display, ctx.sender());

        // 6. Share Transfer Policy (MUST be shared for marketplace access)
        transfer::public_share_object(policy);
        
        // 7. Transfer Policy Cap to deployer (for future updates)
        transfer::public_transfer(policy_cap, ctx.sender());

        // 8. Create SHARED MintCounter
        let mint_counter = MintCounter {
            id: object::new(ctx),
            total_minted: 0,
        };
        transfer::share_object(mint_counter);

        // 9. Create MintCap for admin functions
        let mint_cap = MintCap {
            id: object::new(ctx),
        };
        transfer::public_transfer(mint_cap, ctx.sender());
    }

    // ===== Public Mint Functions =====

    /// Mint NFT with AUTOMATIC Kiosk creation
    public fun mint_character(
        mint_counter: &mut MintCounter,
        payment: Coin<SUI>,
        name: String,
        lore: String,
        image_url: String,
        attributes: String,
        mmr: u64,
        items_selected: String,
        encrypted_shipping_info: String,
        encryption_pubkey: String,
        transfer_policy: &TransferPolicy<Character>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // 1. Verify payment amount
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= treasury::base_mint_price(), EInsufficientPayment);

        // 2. Create NEW Kiosk for user
        let (mut kiosk, kiosk_cap) = kiosk::new(ctx);
        let kiosk_id = object::id(&kiosk);
        let sender = ctx.sender();

        // Emit kiosk creation event
        event::emit(KioskCreated {
            kiosk_id,
            owner: sender,
            timestamp: clock::timestamp_ms(clock),
        });

        // 3. Process payment to treasury
        treasury::process_payment(payment, ctx);

        // 4. Increment edition counter
        mint_counter.total_minted = mint_counter.total_minted + 1;
        let edition = mint_counter.total_minted;

        // 5. Get current timestamp
        let timestamp = clock::timestamp_ms(clock);

        // 6. Create Character NFT
        let nft_id = object::new(ctx);
        let nft_id_copy = object::uid_to_inner(&nft_id);
        
        let character = Character {
            id: nft_id,
            name,
            lore,
            image_url,
            attributes,
            mmr,
            edition,
            minted_at: timestamp,
        };

        // 7. LOCK NFT in Kiosk (makes it tradeable on TradePort)
        kiosk::lock(&mut kiosk, &kiosk_cap, transfer_policy, character);

        // 8. Share the Kiosk (so marketplaces can access it)
        transfer::public_share_object(kiosk);
        
        // 9. Transfer KioskOwnerCap to user (proves ownership)
        transfer::public_transfer(kiosk_cap, sender);

        // 10. Emit minting event
        event::emit(CharacterMinted {
            nft_id: nft_id_copy,
            owner: sender,
            name: string::utf8(b"Character"),
            edition,
            kiosk_id,
            timestamp,
        });

        // 11. Create Order Receipt with encrypted shipping data
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

    /// Mint to EXISTING Kiosk (for users who already have one)
    public fun mint_to_existing_kiosk(
        mint_counter: &mut MintCounter,
        payment: Coin<SUI>,
        name: String,
        lore: String,
        image_url: String,
        attributes: String,
        mmr: u64,
        items_selected: String,
        encrypted_shipping_info: String,
        encryption_pubkey: String,
        kiosk: &mut Kiosk,
        kiosk_cap: &KioskOwnerCap,
        transfer_policy: &TransferPolicy<Character>,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // 1. Verify payment amount
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= treasury::base_mint_price(), EInsufficientPayment);

        // 2. Verify kiosk ownership
        assert!(kiosk::has_access(kiosk, kiosk_cap), EInvalidKioskOwner);

        // 3. Process payment to treasury
        treasury::process_payment(payment, ctx);

        // 4. Increment edition counter
        mint_counter.total_minted = mint_counter.total_minted + 1;
        let edition = mint_counter.total_minted;

        // 5. Get current timestamp
        let timestamp = clock::timestamp_ms(clock);

        // 6. Create Character NFT
        let nft_id = object::new(ctx);
        let nft_id_copy = object::uid_to_inner(&nft_id);
        
        let character = Character {
            id: nft_id,
            name,
            lore,
            image_url,
            attributes,
            mmr,
            edition,
            minted_at: timestamp,
        };

        let sender = ctx.sender();
        let kiosk_id = object::id(kiosk);

        // 7. LOCK NFT in EXISTING Kiosk
        kiosk::lock(kiosk, kiosk_cap, transfer_policy, character);

        // 8. Emit minting event
        event::emit(CharacterMinted {
            nft_id: nft_id_copy,
            owner: sender,
            name: string::utf8(b"Character"),
            edition,
            kiosk_id,
            timestamp,
        });

        // 9. Create Order Receipt with encrypted shipping data
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

    /// Process bundle upgrade payment with NEW encrypted shipping info
    public fun upgrade_to_bundle(
        receipt: &mut OrderReceipt,
        payment: Coin<SUI>,
        new_encrypted_shipping_info: String,
        clock: &Clock,
        ctx: &mut TxContext
    ) {
        // 1. Verify payment (10 SUI)
        let payment_amount = coin::value(&payment);
        assert!(payment_amount >= treasury::bundle_upgrade_price(), EInvalidBundleUpgrade);

        // 2. Verify caller owns the receipt
        let buyer = order_receipt::get_buyer(receipt);
        assert!(buyer == ctx.sender(), EUnauthorizedReceiptAccess);

        // 3. Process payment
        treasury::process_payment(payment, ctx);

        // 4. Update receipt with new encrypted shipping info
        order_receipt::update_encrypted_shipping(
            receipt,
            new_encrypted_shipping_info,
            clock,
            ctx
        );

        // 5. Emit bundle upgrade event
        event::emit(BundleUpgraded {
            receipt_id: order_receipt::get_receipt_id(receipt),
            owner: ctx.sender(),
            additional_payment: payment_amount,
            timestamp: clock::timestamp_ms(clock),
        });
    }

    // ===== Kiosk Helper Functions =====

    /// Helper: Create a standalone Kiosk
    public fun create_kiosk(ctx: &mut TxContext) {
        let (kiosk, kiosk_cap) = kiosk::new(ctx);
        let kiosk_id = object::id(&kiosk);
        
        // Emit creation event
        event::emit(KioskCreated {
            kiosk_id,
            owner: ctx.sender(),
            timestamp: 0,
        });
        
        // Share the Kiosk
        transfer::public_share_object(kiosk);
        
        // Transfer KioskOwnerCap to user
        transfer::public_transfer(kiosk_cap, ctx.sender());
    }

    // ===== View Functions =====

    /// Get character details
    public fun get_character_info(character: &Character): (String, String, String, String, u64, u64, u64) {
        (
            character.name,
            character.lore,
            character.image_url,
            character.attributes,
            character.mmr,
            character.edition,
            character.minted_at
        )
    }

    /// Get total minted count
    public fun get_total_minted(mint_counter: &MintCounter): u64 {
        mint_counter.total_minted
    }

    /// Get MMR only
    public fun get_mmr(character: &Character): u64 {
        character.mmr
    }

    /// Update MMR (for future game mechanics)
    public(package) fun update_mmr(character: &mut Character, new_mmr: u64) {
        character.mmr = new_mmr;
    }

    /// Get edition number
    public fun get_edition(character: &Character): u64 {
        character.edition
    }

    /// Get name
    public fun get_name(character: &Character): String {
        character.name
    }

    /// Get image URL
    public fun get_image_url(character: &Character): String {
        character.image_url
    }

    // ===== NEW: Collection Metadata View Functions =====

    /// Get collection metadata
    public fun get_collection_info(metadata: &CollectionMetadata): (String, String, String, u64, u64) {
        (
            metadata.name,
            metadata.description,
            metadata.symbol,
            metadata.total_supply,
            metadata.royalty_percentage
        )
    }

    /// Get collection name
    public fun get_collection_name(metadata: &CollectionMetadata): String {
        metadata.name
    }

    /// Get collection royalty percentage
    public fun get_royalty_percentage(metadata: &CollectionMetadata): u64 {
        metadata.royalty_percentage
    }

    // ===== Test Functions =====
    
    #[test_only]
    public fun init_for_testing(ctx: &mut TxContext) {
        let otw = CHARACTER_NFT {};
        init(otw, ctx);
    }

    #[test_only]
    public fun create_test_character(ctx: &mut TxContext): Character {
        Character {
            id: object::new(ctx),
            name: string::utf8(b"Test Character"),
            lore: string::utf8(b"Test lore"),
            image_url: string::utf8(b"https://nft.kapogian.xyz/ipfs/test"),
            attributes: string::utf8(b"{}"),
            mmr: 1000,
            edition: 1,
            minted_at: 0,
        }
    }
}
