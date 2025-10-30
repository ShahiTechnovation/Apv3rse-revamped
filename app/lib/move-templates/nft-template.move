// NFT Collection Template for Aptos
// Optimized for minimal context while maintaining functionality

module nft_addr::nft_collection {
    use std::signer;
    use std::string::{String, utf8};
    use std::vector;
    use aptos_framework::object::{Self, Object};
    use aptos_framework::event;
    use aptos_token_objects::collection;
    use aptos_token_objects::token;
    use aptos_token_objects::royalty;
    
    // Error codes
    const E_NOT_OWNER: u64 = 1;
    const E_COLLECTION_DOES_NOT_EXIST: u64 = 2;
    const E_INSUFFICIENT_BALANCE: u64 = 3;
    const E_TOKEN_DOES_NOT_EXIST: u64 = 4;
    const E_NOT_AUTHORIZED: u64 = 5;
    
    // Constants
    const COLLECTION_NAME: vector<u8> = b"MyNFTCollection";
    const COLLECTION_DESCRIPTION: vector<u8> = b"A unique NFT collection";
    const COLLECTION_URI: vector<u8> = b"https://example.com/collection";
    const TOKEN_PREFIX: vector<u8> = b"Token #";
    const MAX_SUPPLY: u64 = 10000;
    const ROYALTY_NUMERATOR: u64 = 5; // 5%
    const ROYALTY_DENOMINATOR: u64 = 100;
    
    // Resources
    struct CollectionConfig has key {
        collection: Object<collection::Collection>,
        minted_tokens: u64,
        paused: bool,
        whitelist: vector<address>,
        mint_price: u64,
    }
    
    struct TokenMetadata has key, store {
        name: String,
        description: String,
        uri: String,
        properties: vector<String>,
    }
    
    // Events
    struct MintEvent has drop, store {
        recipient: address,
        token_id: u64,
        timestamp: u64,
    }
    
    struct TransferEvent has drop, store {
        from: address,
        to: address,
        token_id: u64,
        timestamp: u64,
    }
    
    // Initialize collection
    public entry fun initialize_collection(
        creator: &signer,
        royalty_payee: address,
    ) {
        let creator_addr = signer::address_of(creator);
        
        // Create collection
        let collection = collection::create_unlimited_collection(
            creator,
            utf8(COLLECTION_DESCRIPTION),
            utf8(COLLECTION_NAME),
            option::none(),
            utf8(COLLECTION_URI),
        );
        
        // Set up royalty
        let royalty = royalty::create(
            ROYALTY_NUMERATOR,
            ROYALTY_DENOMINATOR,
            royalty_payee,
        );
        collection::set_royalty(&collection, royalty);
        
        // Store config
        let config = CollectionConfig {
            collection,
            minted_tokens: 0,
            paused: false,
            whitelist: vector::empty(),
            mint_price: 0,
        };
        move_to(creator, config);
    }
    
    // Mint NFT
    public entry fun mint_nft(
        creator: &signer,
        recipient: address,
        name: String,
        description: String,
        uri: String,
    ) acquires CollectionConfig {
        let creator_addr = signer::address_of(creator);
        let config = borrow_global_mut<CollectionConfig>(creator_addr);
        
        assert!(!config.paused, E_NOT_AUTHORIZED);
        assert!(config.minted_tokens < MAX_SUPPLY, E_INSUFFICIENT_BALANCE);
        
        // Create token
        let token = token::create_named_token(
            creator,
            utf8(COLLECTION_NAME),
            description,
            name,
            option::none(),
            uri,
        );
        
        // Update counter
        config.minted_tokens = config.minted_tokens + 1;
        
        // Transfer to recipient
        if (creator_addr != recipient) {
            object::transfer(creator, token, recipient);
        }
        
        // Emit event
        event::emit(MintEvent {
            recipient,
            token_id: config.minted_tokens,
            timestamp: timestamp::now_seconds(),
        });
    }
    
    // Batch mint
    public entry fun batch_mint(
        creator: &signer,
        recipients: vector<address>,
        names: vector<String>,
        descriptions: vector<String>,
        uris: vector<String>,
    ) acquires CollectionConfig {
        let len = vector::length(&recipients);
        let i = 0;
        
        while (i < len) {
            mint_nft(
                creator,
                *vector::borrow(&recipients, i),
                *vector::borrow(&names, i),
                *vector::borrow(&descriptions, i),
                *vector::borrow(&uris, i),
            );
            i = i + 1;
        }
    }
    
    // Transfer NFT
    public entry fun transfer_nft(
        owner: &signer,
        token: Object<token::Token>,
        recipient: address,
    ) {
        let owner_addr = signer::address_of(owner);
        assert!(object::owner(token) == owner_addr, E_NOT_OWNER);
        
        object::transfer(owner, token, recipient);
        
        event::emit(TransferEvent {
            from: owner_addr,
            to: recipient,
            token_id: 0, // Would need token ID tracking
            timestamp: timestamp::now_seconds(),
        });
    }
    
    // Burn NFT
    public entry fun burn_nft(
        owner: &signer,
        token: Object<token::Token>,
    ) {
        let owner_addr = signer::address_of(owner);
        assert!(object::owner(token) == owner_addr, E_NOT_OWNER);
        
        token::burn(owner, token);
    }
    
    // Admin functions
    public entry fun set_paused(
        admin: &signer,
        paused: bool,
    ) acquires CollectionConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<CollectionConfig>(admin_addr);
        config.paused = paused;
    }
    
    public entry fun set_mint_price(
        admin: &signer,
        price: u64,
    ) acquires CollectionConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<CollectionConfig>(admin_addr);
        config.mint_price = price;
    }
    
    public entry fun add_to_whitelist(
        admin: &signer,
        addresses: vector<address>,
    ) acquires CollectionConfig {
        let admin_addr = signer::address_of(admin);
        let config = borrow_global_mut<CollectionConfig>(admin_addr);
        vector::append(&mut config.whitelist, addresses);
    }
    
    // View functions
    #[view]
    public fun get_collection_info(creator: address): (u64, bool, u64) acquires CollectionConfig {
        let config = borrow_global<CollectionConfig>(creator);
        (config.minted_tokens, config.paused, config.mint_price)
    }
    
    #[view]
    public fun is_whitelisted(creator: address, user: address): bool acquires CollectionConfig {
        let config = borrow_global<CollectionConfig>(creator);
        vector::contains(&config.whitelist, &user)
    }
    
    #[view]
    public fun get_remaining_supply(creator: address): u64 acquires CollectionConfig {
        let config = borrow_global<CollectionConfig>(creator);
        MAX_SUPPLY - config.minted_tokens
    }
}
