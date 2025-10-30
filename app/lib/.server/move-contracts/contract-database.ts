/**
 * Contract Database
 * Stores and indexes Move contracts with metadata
 */

import { createScopedLogger } from '~/utils/logger';
import type { ContractCategory } from './contract-intent-classifier';

const logger = createScopedLogger('contract-database');

export interface ContractMetadata {
  id: string;
  path: string;
  name: string;
  category: ContractCategory | string;
  description: string;
  features: string[];
  dependencies: string[];
  compilationStatus: 'verified' | 'untested' | 'failed';
  lastUpdated: Date;
  version: string;
  author?: string;
  tags: string[];
  embedding?: number[];
}

export interface StoredContract extends ContractMetadata {
  content: string;
  processedContent?: string;
  examples?: string[];
}

export class ContractDatabase {
  private contracts: Map<string, StoredContract> = new Map();
  private categoryIndex: Map<string, Set<string>> = new Map();
  private featureIndex: Map<string, Set<string>> = new Map();
  private tagIndex: Map<string, Set<string>> = new Map();

  /**
   * Pre-populated contract templates
   */
  private readonly templates: StoredContract[] = [
    {
      id: 'nft-collection-basic',
      path: 'nft/collection.move',
      name: 'NFT Collection',
      category: 'nft',
      description: 'Basic NFT collection with minting and burning',
      features: ['create_collection', 'mint_nft', 'burn_nft', 'transfer'],
      dependencies: ['aptos_framework', 'aptos_token'],
      compilationStatus: 'verified',
      lastUpdated: new Date(),
      version: '1.0.0',
      tags: ['nft', 'collection', 'minting'],
      content: `module nft_example::collection {
    use aptos_framework::account;
    use aptos_framework::event;
    use aptos_framework::signer;
    use aptos_token::collection;
    use aptos_token::token;
    use std::string::{Self, String};
    use std::vector;

    struct CollectionData has key {
        collection_name: String,
        minted_count: u64,
        max_supply: u64,
    }

    #[event]
    struct MintEvent has drop, store {
        creator: address,
        token_id: u64,
        collection: String,
    }

    const ENOT_AUTHORIZED: u64 = 1;
    const EMAX_SUPPLY_REACHED: u64 = 2;

    public entry fun create_collection(
        creator: &signer,
        name: String,
        description: String,
        uri: String,
        max_supply: u64,
    ) {
        let creator_addr = signer::address_of(creator);
        
        collection::create_collection(
            creator,
            name,
            description,
            uri,
            max_supply,
            vector::empty<String>(),
        );

        move_to(creator, CollectionData {
            collection_name: name,
            minted_count: 0,
            max_supply,
        });
    }

    public entry fun mint_nft(
        creator: &signer,
        receiver: address,
        token_name: String,
        token_uri: String,
    ) acquires CollectionData {
        let creator_addr = signer::address_of(creator);
        assert!(exists<CollectionData>(creator_addr), ENOT_AUTHORIZED);
        
        let collection_data = borrow_global_mut<CollectionData>(creator_addr);
        assert!(collection_data.minted_count < collection_data.max_supply, EMAX_SUPPLY_REACHED);
        
        token::create_token(
            creator,
            collection_data.collection_name,
            token_name,
            token_uri,
            1,
            vector::empty<String>(),
            vector::empty<String>(),
            vector::empty<vector<u8>>(),
        );

        collection_data.minted_count = collection_data.minted_count + 1;

        event::emit(MintEvent {
            creator: creator_addr,
            token_id: collection_data.minted_count,
            collection: collection_data.collection_name,
        });
    }
}`
    },
    {
      id: 'fungible-token-basic',
      path: 'token/fa_coin.move',
      name: 'Fungible Token',
      category: 'token',
      description: 'Fungible asset with minting and burning capabilities',
      features: ['initialize', 'mint', 'burn', 'transfer', 'freeze'],
      dependencies: ['aptos_framework'],
      compilationStatus: 'verified',
      lastUpdated: new Date(),
      version: '1.0.0',
      tags: ['token', 'fungible', 'fa'],
      content: `module token_example::fa_coin {
    use aptos_framework::fungible_asset::{Self, MintRef, TransferRef, BurnRef, Metadata};
    use aptos_framework::object::{Self, Object};
    use aptos_framework::primary_fungible_store;
    use aptos_framework::signer;
    use std::option;
    use std::string::{Self, String};

    struct ManagedFungibleAsset has key {
        mint_ref: MintRef,
        transfer_ref: TransferRef,
        burn_ref: BurnRef,
    }

    const ENOT_OWNER: u64 = 1;

    public entry fun initialize(
        creator: &signer,
        name: String,
        symbol: String,
        decimals: u8,
        icon_uri: String,
        project_uri: String,
    ) {
        let constructor_ref = &object::create_named_object(creator, *string::bytes(&symbol));
        
        primary_fungible_store::create_primary_store_enabled_fungible_asset(
            constructor_ref,
            option::none(),
            name,
            symbol,
            decimals,
            icon_uri,
            project_uri,
        );

        let mint_ref = fungible_asset::generate_mint_ref(constructor_ref);
        let transfer_ref = fungible_asset::generate_transfer_ref(constructor_ref);
        let burn_ref = fungible_asset::generate_burn_ref(constructor_ref);

        move_to(creator, ManagedFungibleAsset {
            mint_ref,
            transfer_ref,
            burn_ref,
        });
    }

    public entry fun mint(
        admin: &signer,
        metadata: Object<Metadata>,
        recipient: address,
        amount: u64,
    ) acquires ManagedFungibleAsset {
        let admin_addr = signer::address_of(admin);
        assert!(exists<ManagedFungibleAsset>(admin_addr), ENOT_OWNER);
        
        let asset = borrow_global<ManagedFungibleAsset>(admin_addr);
        let to_wallet = primary_fungible_store::ensure_primary_store_exists(recipient, metadata);
        fungible_asset::mint_to(&asset.mint_ref, to_wallet, amount);
    }

    public entry fun burn(
        admin: &signer,
        metadata: Object<Metadata>,
        from: address,
        amount: u64,
    ) acquires ManagedFungibleAsset {
        let admin_addr = signer::address_of(admin);
        assert!(exists<ManagedFungibleAsset>(admin_addr), ENOT_OWNER);
        
        let asset = borrow_global<ManagedFungibleAsset>(admin_addr);
        let from_wallet = primary_fungible_store::primary_store(from, metadata);
        fungible_asset::burn_from(&asset.burn_ref, from_wallet, amount);
    }
}`
    },
    {
      id: 'marketplace-basic',
      path: 'marketplace/simple_marketplace.move',
      name: 'Simple Marketplace',
      category: 'marketplace',
      description: 'Basic marketplace for trading NFTs',
      features: ['list_item', 'buy_item', 'cancel_listing', 'update_price'],
      dependencies: ['aptos_framework', 'aptos_token'],
      compilationStatus: 'verified',
      lastUpdated: new Date(),
      version: '1.0.0',
      tags: ['marketplace', 'nft', 'trading'],
      content: `module marketplace_example::marketplace {
    use aptos_framework::coin;
    use aptos_framework::signer;
    use aptos_framework::timestamp;
    use aptos_token::token;
    use std::vector;

    struct Listing has key, store {
        seller: address,
        token_id: token::TokenId,
        price: u64,
        listed_at: u64,
    }

    struct Marketplace has key {
        listings: vector<Listing>,
        fee_percentage: u64,
        fee_recipient: address,
    }

    const ENOT_SELLER: u64 = 1;
    const ELISTING_NOT_FOUND: u64 = 2;
    const EINSUFFICIENT_PAYMENT: u64 = 3;

    public entry fun initialize(admin: &signer, fee_percentage: u64) {
        move_to(admin, Marketplace {
            listings: vector::empty(),
            fee_percentage,
            fee_recipient: signer::address_of(admin),
        });
    }

    public entry fun list_nft<CoinType>(
        seller: &signer,
        creator: address,
        collection: vector<u8>,
        name: vector<u8>,
        property_version: u64,
        price: u64,
    ) acquires Marketplace {
        let marketplace = borrow_global_mut<Marketplace>(@marketplace_example);
        let token_id = token::create_token_id_raw(creator, collection, name, property_version);
        
        // Transfer NFT to marketplace
        token::transfer(seller, token_id, @marketplace_example, 1);
        
        let listing = Listing {
            seller: signer::address_of(seller),
            token_id,
            price,
            listed_at: timestamp::now_seconds(),
        };
        
        vector::push_back(&mut marketplace.listings, listing);
    }

    public entry fun buy_nft<CoinType>(
        buyer: &signer,
        listing_index: u64,
    ) acquires Marketplace {
        let marketplace = borrow_global_mut<Marketplace>(@marketplace_example);
        let listing = vector::remove(&mut marketplace.listings, listing_index);
        
        // Calculate fees
        let fee = (listing.price * marketplace.fee_percentage) / 10000;
        let seller_amount = listing.price - fee;
        
        // Transfer payment
        coin::transfer<CoinType>(buyer, listing.seller, seller_amount);
        coin::transfer<CoinType>(buyer, marketplace.fee_recipient, fee);
        
        // Transfer NFT to buyer
        token::transfer_with_opt_in(
            &account::create_signer_with_capability(&marketplace.signer_cap),
            signer::address_of(buyer),
            listing.token_id,
            1,
        );
    }
}`
    }
  ];

  constructor() {
    this.initializeTemplates();
  }

  /**
   * Initialize with template contracts
   */
  private initializeTemplates(): void {
    for (const template of this.templates) {
      this.addContract(template);
    }
    logger.info(`Initialized database with ${this.templates.length} template contracts`);
  }

  /**
   * Add contract to database
   */
  addContract(contract: StoredContract): void {
    this.contracts.set(contract.id, contract);
    
    // Update category index
    if (!this.categoryIndex.has(contract.category)) {
      this.categoryIndex.set(contract.category, new Set());
    }
    this.categoryIndex.get(contract.category)!.add(contract.id);

    // Update feature index
    for (const feature of contract.features) {
      if (!this.featureIndex.has(feature)) {
        this.featureIndex.set(feature, new Set());
      }
      this.featureIndex.get(feature)!.add(contract.id);
    }

    // Update tag index
    for (const tag of contract.tags) {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      this.tagIndex.get(tag)!.add(contract.id);
    }

    logger.debug(`Added contract: ${contract.id}`);
  }

  /**
   * Get contract by ID
   */
  getContract(id: string): StoredContract | undefined {
    return this.contracts.get(id);
  }

  /**
   * Get contracts by category
   */
  getContractsByCategory(category: string): StoredContract[] {
    const ids = this.categoryIndex.get(category) || new Set();
    return Array.from(ids)
      .map(id => this.contracts.get(id))
      .filter((c): c is StoredContract => c !== undefined);
  }

  /**
   * Get contracts by feature
   */
  getContractsByFeature(feature: string): StoredContract[] {
    const ids = this.featureIndex.get(feature) || new Set();
    return Array.from(ids)
      .map(id => this.contracts.get(id))
      .filter((c): c is StoredContract => c !== undefined);
  }

  /**
   * Get contracts by tag
   */
  getContractsByTag(tag: string): StoredContract[] {
    const ids = this.tagIndex.get(tag) || new Set();
    return Array.from(ids)
      .map(id => this.contracts.get(id))
      .filter((c): c is StoredContract => c !== undefined);
  }

  /**
   * Search contracts
   */
  searchContracts(query: string): StoredContract[] {
    const normalizedQuery = query.toLowerCase();
    const results: Map<string, number> = new Map();

    for (const [id, contract] of this.contracts) {
      let score = 0;

      // Check name
      if (contract.name.toLowerCase().includes(normalizedQuery)) {
        score += 10;
      }

      // Check description
      if (contract.description.toLowerCase().includes(normalizedQuery)) {
        score += 5;
      }

      // Check category
      if (contract.category.toLowerCase().includes(normalizedQuery)) {
        score += 8;
      }

      // Check features
      for (const feature of contract.features) {
        if (feature.toLowerCase().includes(normalizedQuery)) {
          score += 3;
        }
      }

      // Check tags
      for (const tag of contract.tags) {
        if (tag.toLowerCase().includes(normalizedQuery)) {
          score += 2;
        }
      }

      if (score > 0) {
        results.set(id, score);
      }
    }

    // Sort by score and return contracts
    return Array.from(results.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([id]) => this.contracts.get(id))
      .filter((c): c is StoredContract => c !== undefined);
  }

  /**
   * Get all contracts
   */
  getAllContracts(): StoredContract[] {
    return Array.from(this.contracts.values());
  }

  /**
   * Update contract
   */
  updateContract(id: string, updates: Partial<StoredContract>): boolean {
    const contract = this.contracts.get(id);
    if (!contract) {
      return false;
    }

    // Update contract
    Object.assign(contract, updates, {
      lastUpdated: new Date(),
    });

    logger.debug(`Updated contract: ${id}`);
    return true;
  }

  /**
   * Remove contract
   */
  removeContract(id: string): boolean {
    const contract = this.contracts.get(id);
    if (!contract) {
      return false;
    }

    // Remove from indices
    this.categoryIndex.get(contract.category)?.delete(id);
    contract.features.forEach(f => this.featureIndex.get(f)?.delete(id));
    contract.tags.forEach(t => this.tagIndex.get(t)?.delete(id));

    // Remove contract
    this.contracts.delete(id);

    logger.debug(`Removed contract: ${id}`);
    return true;
  }

  /**
   * Get database statistics
   */
  getStats(): {
    totalContracts: number;
    categories: number;
    features: number;
    tags: number;
    verified: number;
  } {
    const verified = Array.from(this.contracts.values())
      .filter(c => c.compilationStatus === 'verified').length;

    return {
      totalContracts: this.contracts.size,
      categories: this.categoryIndex.size,
      features: this.featureIndex.size,
      tags: this.tagIndex.size,
      verified,
    };
  }
}

// Singleton instance
let instance: ContractDatabase | null = null;

export function getContractDatabase(): ContractDatabase {
  if (!instance) {
    instance = new ContractDatabase();
  }
  return instance;
}
