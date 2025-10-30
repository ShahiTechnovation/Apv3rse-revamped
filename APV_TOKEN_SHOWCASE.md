# 🪙 $APV Token - Pay-As-You-Go AI Payments (Showcase Feature)

## Overview
The $APV token is a revolutionary payment system for AI services on the Aptos blockchain. This testnet showcase demonstrates the future of subscription-free AI usage.

## 🎯 Vision
Replace traditional subscription models with transparent, on-chain micropayments. Users pay only for what they use, with full transaction visibility.

## ✨ Current Features (Testnet Showcase)

### 🎨 UI Components
- **Token Balance Display** - Shows your $APV balance in the navbar
- **Testnet Badge** - Clearly indicates this is a preview feature
- **Animated Icon** - Pulsing gradient icon for visual appeal
- **Detailed Tooltip** - Click to view feature information

### 💡 How It Works (Showcase Mode)

1. **Connect Wallet** - Connect your Petra wallet (testnet)
2. **View Balance** - See your mock $APV balance (1,247.5 APV)
3. **Use AI** - Token balance updates as you use LLM features
4. **Transparent Costs** - See exactly what each request costs

## 🚀 Roadmap to Mainnet

### Phase 1: Testnet Preview (Current)
- ✅ Token balance UI
- ✅ Mock payment flow
- ✅ User education
- ✅ Feedback collection

### Phase 2: Testnet Functional
- [ ] Deploy $APV token contract on testnet
- [ ] Payment escrow smart contract
- [ ] Real balance checking
- [ ] Transaction history
- [ ] Top-up functionality

### Phase 3: Mainnet Launch
- [ ] Security audit
- [ ] Deploy $APV token on mainnet
- [ ] Fiat off-ramp integration
- [ ] Support $APT and $USDC payments
- [ ] Liquidity provision

## 💰 Token Economics (Planned)

### $APV Token Utility
1. **Payment** - Pay for LLM API usage
2. **Discount** - 20% discount vs $USDC payments
3. **Governance** - Vote on model selection and features
4. **Staking** - Earn rewards and free credits

### Pricing Structure
```
Example Usage:
- GPT-4 message: ~0.5 $APV ($0.005)
- Claude 3.5: ~0.3 $APV ($0.003)
- Code generation: ~1.0 $APV ($0.010)
- Image analysis: ~0.8 $APV ($0.008)
```

### Multi-Token Support
- **$APV** - Native platform token (best rates)
- **$APT** - Aptos native token (standard rates)
- **$USDC** - Stablecoin (standard rates)

## 🛠️ Technical Architecture

### Smart Contracts (Planned)
```
/contracts/move/
├── apv_token.move           # Fungible Asset Standard token
├── payment_escrow.move      # User balance management
├── rate_oracle.move         # Dynamic pricing
└── governance.move          # Token holder voting
```

### Payment Flow
```
User Request
    ↓
Check Balance (on-chain)
    ↓
Reserve Estimated Cost
    ↓
Execute LLM Call
    ↓
Deduct Actual Cost
    ↓
Log Transaction
    ↓
Batch Settlement (hourly)
```

## 📊 Showcase Features

### Visual Elements
- **Gradient Design** - Purple-to-pink gradient matching Aptos branding
- **Pulse Animation** - Draws attention to the new feature
- **Testnet Badge** - Yellow badge for clarity
- **Interactive Tooltip** - Rich information on hover/click

### User Education
The tooltip explains:
- What $APV tokens are
- How the payment system works
- What's available now vs. future features
- Benefits of pay-as-you-go model

## 🎓 For Developers

### Using the Token Store
```typescript
import { tokenBalanceStore, formatTokenAmount } from '~/lib/stores/token';

// Get current balance
const balance = tokenBalanceStore.get();
console.log(balance.apv); // 1247.5

// Update balance
import { updateTokenBalance } from '~/lib/stores/token';
updateTokenBalance({ apv: 1000 });

// Format for display
const formatted = formatTokenAmount(1247.5); // "1,247.5"
```

### Simulating Token Usage
```typescript
import { simulateTokenUsage } from '~/lib/stores/token';

// Deduct cost after LLM call
simulateTokenUsage(0.5); // Deduct 0.5 APV
```

### Custom Hook
```typescript
import { useTokenUsage } from '~/lib/hooks/useTokenUsage';

function MyComponent() {
  const { handleTokenUsage } = useTokenUsage();
  
  // Call after LLM request
  handleTokenUsage(1000); // 1000 estimated tokens
}
```

## 🔒 Security Considerations

### Current (Showcase)
- Mock data only
- No real transactions
- Testnet wallets only

### Future (Mainnet)
- Smart contract audits
- Rate limiting
- Slippage protection
- Emergency pause functionality
- Multi-sig treasury

## 🌐 Integration Points

### Supported LLM Providers
- OpenAI (GPT-4, GPT-3.5)
- Anthropic (Claude 4.5, Claude 3.5)
- Google (Gemini)
- Mistral
- Cohere
- Open-source models via OpenRouter

### Payment Bridge
When mainnet launches, we'll integrate:
1. DEX for token swaps (APV → USDC)
2. Off-ramp provider (USDC → USD)
3. Automated settlement system
4. Real-time rate updates

## 📈 Benefits Over Subscriptions

### For Users
- ✅ No monthly commitments
- ✅ Pay only for actual usage
- ✅ Transparent costs
- ✅ Portable balance (on-chain)
- ✅ Lower barrier to entry

### For Platform
- ✅ Predictable revenue per request
- ✅ Reduced churn (no cancellations)
- ✅ Viral growth potential
- ✅ Web3-native monetization
- ✅ Community ownership via token

## 🎯 Success Metrics

### Testnet Goals
- [ ] 100+ wallets connected
- [ ] 1,000+ showcase interactions
- [ ] User feedback collected
- [ ] UX validated

### Mainnet Goals
- [ ] $10K+ in monthly token usage
- [ ] 1,000+ active token holders
- [ ] 50%+ users prefer pay-as-you-go
- [ ] <1% failed transactions

## 🆘 Support & Resources

### Documentation
- [Aptos Move Docs](https://aptos.dev/move/)
- [Petra Wallet Guide](https://petra.app/)
- [Fungible Asset Standard](https://aptos.dev/standards/fungible_asset)

### Community
- Discord: [Join our community]
- Twitter: [@apv3rse]
- GitHub: [Report issues]

## 🚨 Important Disclaimers

**This is a TESTNET SHOWCASE feature:**
- $APV tokens shown are MOCK data
- No real value or transactions
- For demonstration purposes only
- Not financial advice

**When mainnet launches:**
- Tokens will have real value
- Real transactions with gas fees
- Subject to market volatility
- Use at your own risk

## 🔮 Future Enhancements

### V2 Features
- [ ] Mobile wallet support
- [ ] Auto-recharge triggers
- [ ] Bulk purchase discounts
- [ ] Referral rewards in $APV
- [ ] Premium model access for stakers

### Advanced Features
- [ ] Multi-chain support (via bridges)
- [ ] Gasless transactions (meta-transactions)
- [ ] Subscription option with $APV discount
- [ ] Enterprise plans with invoicing
- [ ] API key management

## 📝 Changelog

### v0.1.0 (Current)
- ✅ Token balance display in navbar
- ✅ Testnet badge and showcase mode
- ✅ Interactive tooltip with information
- ✅ Mock balance (1,247.5 APV)
- ✅ Gradient design matching Aptos theme
- ✅ Pulse animation for attention

---

**Built with ❤️ on Aptos** | **Powered by Move Language** | **Secured by Blockchain**
