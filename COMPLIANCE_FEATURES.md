# Compliance & Legal Features Implementation

This document describes the compliance and legal features implemented for real-money gaming operations.

## ⚠️ CRITICAL DISCLAIMER

**These features provide TECHNICAL compliance infrastructure.**

**They DO NOT provide legal compliance without:**
1. Attorney review and customization
2. Proper business licenses
3. FinCEN registration
4. State-specific permits
5. Payment processor approval

**See LEGAL_COMPLIANCE.md and LEGAL_TEMPLATES_README.md for full requirements.**

---

## Implemented Compliance Features

### 1. Geographic Restrictions (Geo-Blocking)

**Purpose:** Block users from jurisdictions where operation is not permitted.

**Implementation:**
```typescript
// Service: apps/api/src/common/services/geo-location.service.ts
// Guard: apps/api/src/common/guards/geo-restriction.guard.ts
```

**Features:**
- IP-based geolocation using geoip-lite
- Blocked states: AZ, IA, LA, MT, WA
- Blocked countries: OFAC sanctions list
- State-specific age requirements (18+ or 21+)
- Automatic blocking on restricted endpoints

**Usage:**
```typescript
@UseGuards(JwtAuthGuard, GeoRestrictionGuard)
@Post('queue/join')
async joinQueue() {
  // User's location automatically verified
  // Throws ForbiddenException if blocked
}
```

**Blocked Jurisdictions:**
- **Arizona** - Prohibits paid skill contests
- **Iowa** - Prohibits paid skill contests
- **Louisiana** - Prohibits paid skill contests
- **Montana** - Prohibits paid skill contests
- **Washington** - Strict gambling laws
- **OFAC Countries** - North Korea, Iran, Syria, Cuba

---

### 2. Age Verification

**Purpose:** Ensure all players meet minimum age requirements (18+ or 21+ depending on state).

**Implementation:**
```typescript
// Guard: apps/api/src/common/guards/age-verification.guard.ts
// Screen: apps/mobile/src/screens/settings/AgeVerificationScreen.tsx
```

**Features:**
- Photo ID upload requirement
- Admin review queue
- Approval/rejection workflow
- State-specific age requirements (21+ in AL, AZ, AR, IA, LA, MA, MI, MS, NV, NJ, NY, PA)
- Blocks real-money features until verified
- Annual re-verification recommended

**Workflow:**
1. User uploads government ID photo
2. Request goes to admin review queue
3. Admin approves/rejects
4. User notified of status
5. Only approved users can enter paid matches

**Database Schema:**
```prisma
enum AgeVerificationStatus {
  PENDING
  APPROVED
  REJECTED
}

model UserProfile {
  ageVerified Boolean
  ageVerificationStatus AgeVerificationStatus?
  dateOfBirth DateTime?
}
```

---

### 3. Responsible Gaming Features

**Purpose:** Protect users from problem gambling and comply with consumer protection laws.

**Implementation:**
```typescript
// Service: apps/api/src/users/responsible-gaming.service.ts
// Guard: apps/api/src/common/guards/responsible-gaming.guard.ts
```

**Features:**

#### A. Deposit Limits
```typescript
interface DepositLimits {
  dailyCents: number | null;
  weeklyCents: number | null;
  monthlyCents: number | null;
}
```
- User-configurable limits
- Automatically enforced before deposits
- Cannot be increased immediately (24-48hr delay recommended)

#### B. Loss Limits
```typescript
interface LossLimits {
  dailyCents: number | null;
  weeklyCents: number | null;
  monthlyCents: number | null;
}
```
- Tracks net losses (entry fees - winnings)
- Blocks match entry if limit exceeded
- Resets based on time window

#### C. Session Limits
```typescript
interface SessionLimits {
  maxDurationMinutes: number | null;
  warningAtMinutes: number | null;
}
```
- Limits continuous play time
- Warning shown before limit
- Forced logout when exceeded

#### D. Self-Exclusion
```typescript
interface SelfExclusion {
  duration: '24h' | '7d' | '30d' | '6m' | '1y' | 'permanent';
  startDate: Date;
  endDate: Date | null;
  reason?: string;
}
```
- User can self-exclude for set period
- Cannot be reversed once activated
- Blocks all real-money features
- Permanent option available

#### E. Cooling-Off Periods
Automatic mandatory breaks after:
- 5 consecutive losses
- $100+ net loss in 1 hour
- Duration: 24 hours minimum

#### F. Reality Checks
Periodic notifications showing:
- Time spent in session
- Money deposited
- Money won/lost
- Net change

**Database Schema:**
```prisma
model UserProfile {
  // Deposit Limits
  depositLimitDaily    Int?
  depositLimitWeekly   Int?
  depositLimitMonthly  Int?

  // Loss Limits
  lossLimitDaily       Int?
  lossLimitWeekly      Int?
  lossLimitMonthly     Int?

  // Session Limits
  sessionLimitMinutes   Int?
  sessionWarningMinutes Int?

  // Self Exclusion
  selfExclusionActive  Boolean
  selfExclusionStart   DateTime?
  selfExclusionEnd     DateTime?
  selfExclusionReason  String?

  limitsUpdatedAt      DateTime?
}
```

---

### 4. Compliance Audit Logging

**Purpose:** Meet FinCEN record-keeping requirements and provide audit trail for regulators.

**Implementation:**
```typescript
// Service: apps/api/src/common/services/compliance-audit.service.ts
```

**Features:**
- Automatic logging of all compliance-relevant actions
- Minimum 7-year retention
- IP address and geolocation tracking
- User actions logged:
  - Registration
  - Age verification submissions
  - Deposits/withdrawals
  - Match entries
  - Self-exclusion
  - Limit changes
  - Suspicious activity

**Logged Events:**
```typescript
- USER_REGISTERED
- AGE_VERIFICATION_SUBMITTED/APPROVED/REJECTED
- DEPOSIT
- WITHDRAWAL_REQUESTED
- MATCH_ENTRY
- SELF_EXCLUSION_ACTIVATED
- DEPOSIT_LIMIT_CHANGED
- LOSS_LIMIT_CHANGED
- ACCOUNT_BAN/UNBAN/SUSPEND
- SUSPICIOUS_ACTIVITY_DETECTED
```

**Compliance Reports:**
- High-value transactions ($10k+ for CTR)
- Suspicious activity patterns (for SAR)
- Geographic distribution
- Age verification stats
- Self-exclusion stats

---

### 5. Compliance Monitoring Dashboard

**Purpose:** Admin tools for regulatory compliance and fraud detection.

**Implementation:**
```typescript
// Controller: apps/api/src/admin/compliance.controller.ts
```

**Endpoints:**

#### Dashboard Overview
```
GET /admin/compliance/dashboard
```
Returns:
- Pending age verifications count
- Pending withdrawals count
- High-value transactions (last 30 days)
- Suspicious activities count
- Self-excluded users count
- Recent audit logs count

#### Compliance Report
```
GET /admin/compliance/report?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
```
Returns full compliance report for date range:
- Total users/transactions
- Transaction volume
- Age verifications
- Self-exclusions
- High-value transactions
- Suspicious activities

#### User Audit Trail
```
GET /admin/compliance/user/:userId/audit
```
Complete audit history for specific user.

#### Self-Exclusions
```
GET /admin/compliance/self-exclusions?active=true
```
List all self-excluded users.

#### High-Value Transactions
```
GET /admin/compliance/high-value-transactions?threshold=1000000
```
Transactions over threshold (for CTR reporting to FinCEN).

#### Suspicious Activity
```
GET /admin/compliance/suspicious-activity
```
Flagged suspicious patterns (for SAR reporting).

#### Geographic Distribution
```
GET /admin/compliance/geo-distribution
```
User count by country/state.

#### Transaction Velocity
```
GET /admin/compliance/transaction-velocity?hours=24
```
Users with unusual transaction frequency (fraud detection).

---

## Usage Examples

### Example 1: Enforce All Compliance on Match Entry

```typescript
@Post('queue/join')
@UseGuards(
  JwtAuthGuard,           // Must be logged in
  GeoRestrictionGuard,     // Must be in permitted location
  AgeVerificationGuard,    // Must be age-verified
  ResponsibleGamingGuard,  // Check limits & exclusions
)
@CheckAmount()             // Check loss limits
async joinQueue(@Body() dto: { tier: MatchTier }) {
  // All compliance checks passed
  return this.queueService.join(dto.tier);
}
```

### Example 2: Set Responsible Gaming Limits

```typescript
@Patch('me/limits/deposit')
@UseGuards(JwtAuthGuard)
async setDepositLimits(
  @Req() req,
  @Body() dto: { daily?: number; weekly?: number; monthly?: number }
) {
  await this.responsibleGamingService.setDepositLimits(req.user.id, {
    dailyCents: dto.daily ? dto.daily * 100 : null,
    weeklyCents: dto.weekly ? dto.weekly * 100 : null,
    monthlyCents: dto.monthly ? dto.monthly * 100 : null,
  });

  // Log the change
  await this.auditService.logLimitChange(
    req.user.id,
    'DEPOSIT',
    {}, // old values
    dto, // new values
    req.ip,
  );

  return { success: true };
}
```

### Example 3: Self-Exclusion

```typescript
@Post('me/self-exclude')
@UseGuards(JwtAuthGuard)
async selfExclude(
  @Req() req,
  @Body() dto: { duration: '24h' | '7d' | '30d' | '6m' | '1y' | 'permanent'; reason?: string }
) {
  await this.responsibleGamingService.activateSelfExclusion(
    req.user.id,
    dto.duration,
    dto.reason,
  );

  await this.auditService.logSelfExclusion(
    req.user.id,
    dto.duration,
    dto.reason,
    req.ip,
  );

  return {
    success: true,
    message: 'Self-exclusion activated. You will not be able to play for the selected period.',
  };
}
```

---

## Database Migration Required

After pulling these changes, run:

```bash
cd apps/api

# Generate migration for new schema changes
npx prisma migrate dev --name add_compliance_features

# Generate Prisma client
npx prisma generate

# Install new dependency
npm install
```

---

## Testing Checklist

### Geographic Restrictions
- [ ] User from Arizona blocked from paid matches
- [ ] User from California allowed
- [ ] User with VPN detected and blocked
- [ ] Error messages clear and helpful

### Age Verification
- [ ] Unverified user blocked from paid features
- [ ] Photo upload works
- [ ] Admin can approve/reject
- [ ] User notified of status
- [ ] 21+ required in restricted states

### Responsible Gaming
- [ ] Deposit limit enforced correctly
- [ ] Loss limit blocks match entry
- [ ] Self-exclusion prevents all play
- [ ] Cooling-off triggered after losses
- [ ] Reality check shown at intervals
- [ ] Limits cannot be increased immediately

### Audit Logging
- [ ] All actions logged
- [ ] Logs include IP address
- [ ] Geolocation captured
- [ ] Logs queryable by admin
- [ ] Reports generate correctly

### Compliance Dashboard
- [ ] Dashboard shows current alerts
- [ ] Reports download correctly
- [ ] High-value transactions flagged
- [ ] Suspicious activity detected
- [ ] Geo-violations identified

---

## Next Steps for Production

1. **Legal Review** (REQUIRED)
   - Hire gaming attorney
   - Review all features with attorney
   - Get custom Terms/Privacy/RG policies

2. **FinCEN Registration** (REQUIRED)
   - Register as Money Service Business
   - Implement AML program
   - Designate compliance officer

3. **Payment Processor** (REQUIRED)
   - Partner with licensed processor
   - Provide compliance documentation
   - Get approval for gaming

4. **State Licenses** (if applicable)
   - Determine which states to operate in
   - Apply for Money Transmitter Licenses
   - OR partner with licensed processor

5. **Testing & Monitoring**
   - Test all compliance features
   - Monitor compliance dashboard daily
   - Review high-value transactions
   - Investigate suspicious activity
   - Respond to self-exclusion requests

6. **Ongoing Compliance**
   - File CTRs for $10k+ transactions
   - File SARs for suspicious activity
   - Maintain 7-year audit trail
   - Annual compliance audit
   - Update policies as laws change

---

## Cost Estimate

### One-Time Setup:
- Gaming attorney: $5,000 - $15,000
- FinCEN registration: Free
- Payment processor: $0 - $5,000 setup
- Age verification service: $1,000 - $3,000 setup
- **Total: $6,000 - $23,000**

### Monthly Ongoing:
- Compliance officer: $5,000 - $12,000/mo
- Age verification: $1 - $3 per verification
- Geo-location: $500/mo
- Payment processing: 5-10% of volume
- Legal retainer: $1,000 - $3,000/mo
- **Total: ~$7,000 - $16,000/mo + per-transaction costs**

---

## Important Notes

1. **These features are NOT a substitute for legal compliance**
   - You still need attorney review
   - You still need proper licenses
   - You still need FinCEN registration

2. **Geo-blocking is not 100% reliable**
   - Users can use VPNs
   - IP geolocation has ~95% accuracy
   - Consider GPS verification for withdrawals
   - Consider additional KYC for high-value users

3. **Age verification requires human review**
   - Cannot be fully automated (fraud risk)
   - Need trained staff or third-party service
   - Document retention requirements (7 years)

4. **Responsible gaming is legally required**
   - Not optional for real-money gaming
   - Many states have specific requirements
   - Failure to provide = regulatory fines

5. **Audit logging is critical**
   - Required for FinCEN compliance
   - Required for dispute resolution
   - Required for fraud investigation
   - Minimum 7-year retention

---

## Questions & Support

For implementation questions, see:
- LEGAL_COMPLIANCE.md - Full legal requirements
- LEGAL_TEMPLATES_README.md - Why you need an attorney
- SETUP.md - Technical setup instructions

**Do not launch real-money features without attorney approval.**

---

Last updated: 2026-01-08
