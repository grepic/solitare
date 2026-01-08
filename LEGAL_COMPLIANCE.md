# Legal Compliance Guide

**⚠️ IMPORTANT LEGAL DISCLAIMER:**
This document provides general information about legal requirements for operating a real-money skill-based gaming application. It is NOT legal advice. You MUST consult with a licensed attorney specializing in gaming law before launching this application for real money.

## Skill-Based Gaming vs. Gambling

### This Application is Designed as Skill-Based Gaming

**Key characteristics that make it skill-based:**
- Both players receive identical shuffled decks (same seed)
- Winner determined by completion time and moves (skill)
- No house edge or randomness favoring operator
- Outcome depends primarily on player skill, not chance

**Legal precedent:**
- Similar to chess, pool, or esports competitions
- Courts have ruled skill-based contests are NOT gambling (see *Humphrey v. Viacom* and *Langone v. Kaiser*)
- However, state laws vary significantly

## Required Licenses and Registrations (USA)

### Federal Requirements

#### 1. FinCEN Registration (REQUIRED)
```
Entity: Money Service Business (MSB)
Purpose: Anti-Money Laundering (AML) compliance
Cost: Free registration
Timeline: Register within 180 days of operation
Website: https://www.fincen.gov/
```

**Required procedures:**
- Customer Identification Program (CIP)
- Suspicious Activity Reporting (SAR)
- Currency Transaction Reporting (CTR) for $10k+ transactions
- Record keeping (5 years minimum)

#### 2. Bank Secrecy Act (BSA) Compliance
```
- Implement AML program
- Designate compliance officer
- Independent audit annually
- Employee training program
```

### State Requirements

#### Money Transmitter Licenses (MTL)
```
Required in: 48 states (all except MT, MS)
Cost per state: $5,000 - $100,000+ (varies by state)
Timeline: 3-12 months per state
Renewal: Annual in most states
```

**Most common states to prioritize:**
1. California (largest market)
2. Texas
3. Florida
4. New York (most expensive, ~$500k+ bond)
5. Illinois

**States where skill-gaming is PROHIBITED:**
- Arizona
- Iowa
- Louisiana
- Montana (also no MTL required)
- Washington

#### Alternative: Partner with Licensed Payment Processor

Instead of getting your own MTLs:
```
✅ Partner with licensed payment processor (Stripe Connect, PayPal, etc.)
✅ They handle money transmission under their licenses
✅ Much faster and cheaper to launch
⚠️ They may restrict gaming businesses or charge higher fees
```

## Age Verification Requirements

### Minimum Age by State
```
21+: Alabama, Arizona, Arkansas, Iowa, Louisiana, Massachusetts, etc.
18+: Most other states
```

**Implementation requirement:**
- Age verification BEFORE first paid entry
- Re-verification every 12 months
- Document retention (7 years)
- Acceptable methods:
  - Government ID verification (driver's license, passport)
  - SSN verification via credit bureau
  - Third-party age verification service (Jumio, Onfido, etc.)

**Already implemented in code:**
```typescript
// See: apps/api/src/auth/guards/age-verification.guard.ts
// See: apps/mobile/src/screens/settings/AgeVerificationScreen.tsx
```

## Geolocation and Geo-Blocking

### REQUIRED Features

**Must determine user's location at:**
1. Account registration
2. Every paid entry attempt
3. Every withdrawal request

**Implementation methods:**
```typescript
// 1. IP-based geolocation (primary)
const geoIP = require('geoip-lite');
const lookup = geoIP.lookup(req.ip);

// 2. GPS verification (mobile)
import * as Location from 'expo-location';
const location = await Location.getCurrentPositionAsync();

// 3. Both required for high-value transactions
```

**Blocked states configuration:**
```typescript
// apps/api/src/config/geo-restrictions.ts
export const BLOCKED_STATES = [
  'AZ', // Arizona
  'IA', // Iowa
  'LA', // Louisiana
  'MT', // Montana
  'WA', // Washington
];

export const BLOCKED_COUNTRIES = [
  // Add countries where operation is not permitted
  // Check OFAC sanctions list
];
```

## Tax Reporting Requirements

### IRS Form 1099-MISC

**Required when:**
- Player wins $600 or more in a calendar year
- Payments not from casino/gambling (this is skill-based)

**Implementation:**
```typescript
// Automatic 1099 generation
interface Tax1099 {
  userId: string;
  year: number;
  totalWinnings: number; // Winnings minus entry fees
  form1099Sent: boolean;
  sentAt?: Date;
}

// Generate annually (by January 31)
// Mail to users + file with IRS
```

### Withholding Requirements
```
Federal: Generally NOT required for skill-based gaming
State: Varies by state (some require withholding)
```

## Privacy and Data Protection

### Required Policies

#### 1. Privacy Policy (REQUIRED)
```
Must disclose:
- What data is collected
- How it's used
- Who it's shared with
- User rights (GDPR, CCPA)
- Data retention periods
- Security measures
```

**Already implemented:**
```
See: apps/mobile/src/screens/legal/PrivacyPolicyScreen.tsx
⚠️ This is TEMPLATE ONLY - must be reviewed by attorney
```

#### 2. Terms of Service (REQUIRED)
```
Must include:
- Eligibility requirements (age, location)
- Account terms
- Payment terms
- Dispute resolution
- Limitation of liability
- Governing law
```

**Already implemented:**
```
See: apps/mobile/src/screens/legal/TermsOfServiceScreen.tsx
⚠️ This is TEMPLATE ONLY - must be reviewed by attorney
```

#### 3. Responsible Gaming Policy (REQUIRED)
```
Must include:
- Self-exclusion options
- Deposit/spending limits
- Reality checks (time/money spent)
- Problem gambling resources
- Cooling-off periods
```

**Already implemented:**
```
See: apps/mobile/src/screens/legal/ResponsibleGamingScreen.tsx
See: apps/api/src/users/responsible-gaming.service.ts (needs to be created)
```

## Consumer Protection Requirements

### Mandatory Features

#### 1. Responsible Gaming Tools
```typescript
// Deposit limits
interface DepositLimits {
  daily: number;
  weekly: number;
  monthly: number;
}

// Loss limits
interface LossLimits {
  daily: number;
  weekly: number;
  monthly: number;
}

// Session limits
interface SessionLimits {
  maxDurationMinutes: number;
  warningAt: number; // Minutes
}

// Self-exclusion
interface SelfExclusion {
  duration: '24h' | '7d' | '30d' | '6m' | '1y' | 'permanent';
  startDate: Date;
  endDate?: Date;
  cannotReverse: boolean; // True for permanent
}
```

#### 2. Cooling-off Periods
```typescript
// After significant loss
const COOLING_OFF_TRIGGERS = {
  lossStreak: 5, // 5 losses in a row
  lossAmount: 100_00, // $100 in cents
  timeWindow: 60 * 60 * 1000, // 1 hour
};

// Mandatory break
const MANDATORY_BREAK_DURATION = 24 * 60 * 60 * 1000; // 24 hours
```

#### 3. Reality Checks
```typescript
// Show every X minutes
const REALITY_CHECK_INTERVAL = 60; // minutes

interface RealityCheck {
  timeSpent: number; // minutes
  moneySpent: number; // cents
  moneyWon: number; // cents
  netChange: number; // cents
}
```

## Payment Processing Compliance

### Stripe Compliance

**Stripe Terms for Gaming:**
- ✅ Skill-based gaming allowed
- ❌ Gambling/casino prohibited
- ⚠️ Must clearly demonstrate skill-based nature
- ⚠️ May require additional documentation

**Required documentation for Stripe:**
```
1. Business license
2. MTL licenses (or exemption documentation)
3. Terms of Service
4. Privacy Policy
5. Responsible Gaming Policy
6. Description of skill-based mechanics
7. Fairness documentation (same deck proof)
```

### Prohibited Practices

**❌ NEVER allow:**
```
- Players under 18 (or 21 in restricted states)
- Players in blocked jurisdictions
- Practice chips → Real money conversion
- Guaranteed returns/promotions
- Misleading advertising about win rates
- Playing against "house" (only P2P allowed)
```

## International Compliance (if expanding beyond USA)

### European Union

**Gambling Directive 2014/65/EU:**
- Each country has own gaming authority
- UK: Gambling Commission license required
- Malta: Malta Gaming Authority (popular for licensing)
- Gibraltar: Gibraltar Gambling Commissioner

**Cost: €25,000 - €100,000+ per country**

### Canada

**Provincial regulation:**
- Each province regulates separately
- Ontario: iGaming Ontario (iGO) registration
- Quebec: Loto-Québec permission required
- British Columbia: BCLC permission required

### Australia

**Interactive Gambling Act 2001:**
- ❌ Real-money gaming generally prohibited for Australians
- ⚠️ Block Australian players

## Recommended Legal Structure

### Step-by-step Launch Plan

#### Phase 1: Legal Foundation (Before ANY code launch)
```
1. Hire gaming law attorney (cost: $10k-50k)
2. Determine best business structure (LLC, C-Corp)
3. Register business entity (Delaware or Nevada)
4. Get EIN from IRS
5. Register with FinCEN
6. Open business bank account
7. Draft and review legal documents:
   - Terms of Service
   - Privacy Policy
   - Responsible Gaming Policy
   - User Agreement
```

#### Phase 2: Licensing (3-12 months)
```
Option A: Get your own MTLs
- Choose initial states (CA, TX, FL)
- Apply for MTL (3-6 months per state)
- Post surety bonds ($25k-500k per state)
- Hire compliance officer

Option B: Payment processor partnership
- Partner with licensed processor
- Much faster (weeks not months)
- Higher fees but lower upfront cost
```

#### Phase 3: Soft Launch (Initial states only)
```
1. Launch in 1-3 licensed states only
2. Geo-block all other locations
3. Monitor compliance closely
4. Test all responsible gaming features
5. Validate age verification flow
6. Test withdrawal process (30-90 day holds may be required)
```

#### Phase 4: Scale
```
1. Add more state licenses
2. Increase marketing spend
3. Add more payment methods
4. Consider international expansion
```

## Estimated Costs

### Initial Setup (Year 1)
```
Legal fees:                 $25,000 - $100,000
MTL licenses (3 states):    $15,000 - $300,000 (varies wildly)
Surety bonds:               $75,000 - $1,500,000 (total across states)
Compliance officer:         $80,000 - $150,000/year
Accounting/bookkeeping:     $10,000 - $30,000/year
Payment processor setup:    $5,000 - $20,000
Age verification service:   $1 - $3 per verification
Geo-location service:       $500 - $2,000/month
Insurance (E&O, Cyber):     $5,000 - $15,000/year
--------------------------------------------------
TOTAL ESTIMATE:             $215,000 - $2,115,000
```

### Alternative: Bootstrap with Payment Processor
```
Legal fees:                 $15,000 - $40,000
Payment processor partner:  $0 upfront (higher %)
FinCEN registration:        $0
Age verification:           $1 - $3 per verification
Geo-location service:       $500/month
Insurance:                  $5,000/year
--------------------------------------------------
TOTAL ESTIMATE:             $20,000 - $50,000
(But higher ongoing payment processing fees: 5-10% vs 2-3%)
```

## Red Flags to Avoid

### ❌ DO NOT:
1. Launch without attorney review
2. Accept players without age verification
3. Accept players from blocked states
4. Mix "free coins" with "paid coins" (sweepstakes rules)
5. Advertise guaranteed winnings
6. Allow minors (even in free practice)
7. Process payments without proper licensing
8. Ignore customer complaints
9. Delete user data too quickly (need 7-year retention)
10. Make changes to Terms without user notification

### ✅ DO:
1. Keep detailed compliance records
2. Document all decisions
3. Have attorney on retainer
4. Join industry associations (iDEA, Fantasy Sports & Gaming Association)
5. Stay updated on law changes
6. Over-communicate with regulators
7. Implement all responsible gaming features
8. Have crisis management plan
9. Maintain adequate insurance
10. Build relationships with compliant payment processors

## Conclusion

**To operate this legally:**

1. **Minimum viable compliance:**
   - Hire gaming attorney ($25k+)
   - Partner with licensed payment processor
   - Implement ALL responsible gaming features
   - Age verification service
   - Geo-blocking service
   - Launch in 1-2 friendly states only
   - FinCEN registration
   - Proper Terms/Privacy/RG policies

2. **Recommended timeline:**
   - Month 1-2: Legal consultation + business setup
   - Month 3-4: Payment processor partnership
   - Month 5-6: Soft launch in 1 state
   - Month 7-12: Scale carefully

3. **Absolute requirements:**
   - Attorney review before launch
   - Compliance with FinCEN
   - Age verification (21+ in most states)
   - Geo-blocking (blocked states)
   - Responsible gaming tools
   - Legal documentation
   - Payment processor with gaming experience

**⚠️ FINAL WARNING:**
Operating real-money gaming without proper licensing is a FEDERAL CRIME (Illegal Gambling Business Act, 18 U.S.C. § 1955). Penalties include up to 5 years imprisonment and $250,000 fines. DO NOT launch without attorney approval.

---

**Recommended Attorneys/Firms:**
- Ifrah Law (Washington DC) - Gaming specialists
- Becker & Poliakoff (Multiple states) - Gaming law
- Harris Hagan (Las Vegas) - Gaming/entertainment law
- Kelly Hart (Texas/Arizona) - Gaming law

**Industry Resources:**
- Fantasy Sports & Gaming Association (FSGA)
- American Gaming Association (AGA)
- International Masters of Gaming Law (IMGL)

Last updated: 2026-01-08
