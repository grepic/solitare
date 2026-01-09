# ⚠️ CRITICAL: Legal Templates Customization Checklist

## READ THIS FIRST

**These templates are NOT ready for production use as-is.**

Every item marked with [REQUIRED], [CUSTOMIZE], [STATE-SPECIFIC], or [LEGAL-REVIEW] **MUST** be updated before launch.

**Using these without customization = GUARANTEED legal problems**

---

## 🔴 ABSOLUTELY REQUIRED (App Won't Work Without These)

### Company Information
```
Location: Search all .tsx files for these tags

[ ] [REQUIRED: Your App Name]
    Replace with: Your actual app name
    Example: "Solitaire Smash Pro"

[ ] [REQUIRED: Your Legal Company Name]
    Replace with: Your registered business entity name
    Example: "Solitaire Gaming LLC"

[ ] [REQUIRED: Entity Type]
    Replace with: Your business structure
    Example: "Delaware limited liability company"

[ ] [REQUIRED: Company Address]
    Replace with: Your registered business address
    Example: "123 Main Street, Suite 100, Wilmington, DE 19801"

[ ] [REQUIRED: Contact Email]
    Replace with: Your official contact email
    Example: "legal@yourapp.com"

[ ] [REQUIRED: Support Email]
    Replace with: Your customer support email
    Example: "support@yourapp.com"

[ ] [REQUIRED: Current Date]
    Replace with: Today's date when you finalize
    Example: "January 15, 2026"
```

### Payment & Money Details
```
[ ] [REQUIRED: Your payment processor]
    Replace with: Actual processor name
    Example: "Stripe" or "PayPal" or "Dwolla"

[ ] [REQUIRED: Your fee percentage]
    Replace with: Your actual platform fee
    Example: "10%" or "15%"

[ ] [CUSTOMIZE: Minimum deposit]
    Replace with: Your minimum
    Example: "$5.00" or "$10.00"

[ ] [CUSTOMIZE: Maximum deposit]
    Replace with: Your maximum (consider daily/weekly)
    Example: "$500.00 per day"

[ ] [CUSTOMIZE: Minimum withdrawal]
    Replace with: Your minimum
    Example: "$10.00"

[ ] [CUSTOMIZE: Withdrawal processing time]
    Replace with: Your actual timeframe
    Example: "3-5 business days" or "1-3 business days"

[ ] [CUSTOMIZE: Your maximum tier]
    Replace with: Highest entry fee you offer
    Example: "$25" or "$100"
```

### Legal Jurisdiction
```
[ ] [REQUIRED: Your state]
    Replace with: State where your company is registered
    Example: "Delaware" or "Nevada" or "Texas"

[ ] [REQUIRED: Your city/state]
    Replace with: City for arbitration/court jurisdiction
    Example: "Wilmington, Delaware" or "Austin, Texas"

[ ] [REQUIRED: Your county and state]
    Replace with: For court jurisdiction
    Example: "Travis County, Texas"
```

---

## 🟡 HIGHLY RECOMMENDED (Should Customize)

### Timing & Limits
```
[ ] [CUSTOMIZE: Limit increase waiting period]
    Current: "24-hour"
    Recommended: 24-48 hours for safety

[ ] [CUSTOMIZE: Cooling-off loss amount]
    Current: "$100"
    Adjust based on your tiers

[ ] [CUSTOMIZE: Dispute window]
    Current: "48 hours"
    Recommended: 24-72 hours

[ ] [CUSTOMIZE: Notice period for Terms changes]
    Current: "30 days"
    Recommended: 30-60 days for material changes
```

### Features
```
[ ] [CUSTOMIZE: Add or modify features]
    Location: Section 3 "Service Description"
    Action: Describe YOUR specific features
    - Do you have tournaments?
    - Daily challenges?
    - Friend matches?
    - Different game modes?

[ ] [CUSTOMIZE: Support channels]
    Location: Section 17 "Contact Information"
    Action: Add all your support methods
    - Email
    - Live chat
    - Phone (if applicable)
    - Discord/community (if applicable)
```

---

## 🟠 STATE-SPECIFIC (Critical for Compliance)

### Age Requirements
```
[ ] [STATE-SPECIFIC: Age requirements]
    Current template lists common 21+ states
    Action: VERIFY for each state you operate in

    21+ Required States (verify this list):
    - Alabama, Arizona, Arkansas, Iowa, Louisiana
    - Massachusetts, Michigan, Mississippi, Nevada
    - New Jersey, New York, Pennsylvania

    [ ] Add any additional states where you'll operate
    [ ] Remove states you WON'T operate in
    [ ] Verify each state's current age requirement
```

### Prohibited Jurisdictions
```
[ ] [STATE-SPECIFIC: Prohibited states]
    Current template lists: AZ, IA, LA, MT, WA

    Action: Verify this list is current
    [ ] Arizona - Check current law
    [ ] Iowa - Check current law
    [ ] Louisiana - Check current law
    [ ] Montana - Check current law
    [ ] Washington - Check current law

    [ ] Add any additional prohibited states
    [ ] Update geo-blocking code to match
```

### Problem Gambling Resources
```
[ ] [STATE-SPECIFIC: Problem gambling hotlines]
    Location: Section 6 "Responsible Gaming"
    Action: Add state-specific resources

    Example state-specific additions:
    - California: 1-800-GAMBLER
    - New York: 1-877-8-HOPENY
    - Pennsylvania: 1-800-GAMBLER

    [ ] Research resources for each state you operate in
    [ ] Add state-specific websites
    [ ] Add state-specific hotline numbers
```

### Warranty Disclaimers
```
[ ] [STATE-SPECIFIC: Warranty disclaimer language]
    Location: Section 10 "Disclaimer of Warranties"
    Note: Some states (e.g., NJ, CA) limit disclaimer of implied warranties

    Action: Attorney must add state-specific language like:
    "Some states do not allow disclaimers of implied warranties,
    so the above limitation may not apply to you in those states."
```

### Liability Limitations
```
[ ] [STATE-SPECIFIC: Liability limitation language]
    Location: Section 11 "Limitation of Liability"
    Note: Some states don't allow limiting liability for certain damages

    Action: Attorney must add state-specific language
```

---

## 🔴 LEGAL-REVIEW (MUST Have Attorney Input)

### Critical Legal Sections
```
[ ] [LEGAL-REVIEW: Disclaimer of Warranties]
    Location: Section 10
    Why: Must comply with state consumer protection laws
    Attorney will: Add state-specific exceptions

[ ] [LEGAL-REVIEW: Limitation of Liability]
    Location: Section 11
    Why: Some states restrict liability limitations
    Attorney will: Add permissible limitations by state

[ ] [LEGAL-REVIEW: Indemnification]
    Location: Section 12
    Why: Must be enforceable under applicable law
    Attorney will: Verify language is enforceable

[ ] [LEGAL-REVIEW: Dispute Resolution]
    Location: Section 13
    Why: Arbitration vs. court jurisdiction varies by state
    Attorney will: Choose best option and customize

[ ] [LEGAL-REVIEW: Class Action Waiver]
    Location: Section 13 (currently missing)
    Why: Some states restrict class action waivers
    Attorney will: Add if permitted in your jurisdictions

[ ] [LEGAL-REVIEW: Tax Reporting]
    Location: Section 5 "Payments and Wallet"
    Why: IRS rules change; state tax rules vary
    Attorney will: Verify current reporting requirements
```

### Privacy Compliance
```
[ ] [LEGAL-REVIEW: CCPA Compliance]
    Location: Privacy Policy
    Why: Required if you have California users
    Attorney will: Add CCPA-specific rights and disclosures

[ ] [LEGAL-REVIEW: GDPR Compliance]
    Location: Privacy Policy
    Why: Required if you have EU users (even accidentally)
    Attorney will: Add GDPR-specific rights and disclosures

[ ] [LEGAL-REVIEW: Data Retention]
    Location: Privacy Policy
    Why: Gaming law requires 7-year minimum
    Attorney will: Specify retention periods by data type
```

### Responsible Gaming
```
[ ] [LEGAL-REVIEW: Self-Exclusion Language]
    Location: Responsible Gaming Policy
    Why: Some states have specific requirements
    Attorney will: Add state-mandated language

[ ] [LEGAL-REVIEW: Limit-Setting Requirements]
    Location: Responsible Gaming Policy
    Why: Some states require specific limits
    Attorney will: Ensure compliance with state rules
```

---

## 📝 Privacy Policy Specific

### Data Collection
```
[ ] [REQUIRED: List all data you collect]
    Current: Generic list
    Action: List EXACTLY what you collect:
    - Email, password, name, DOB
    - Payment info (what specifically?)
    - Device info (what specifically?)
    - Location data (IP? GPS?)
    - Gameplay data (what specifically?)

[ ] [REQUIRED: Third-party services]
    Current: Generic
    Action: List ALL third-parties:
    - Stripe (payment)
    - [Your analytics service]
    - [Your error tracking service]
    - [Your hosting provider]
    - [Any other services]

    For each, specify:
    - What data is shared
    - Why it's shared
    - Link to their privacy policy
```

### User Rights
```
[ ] [CUSTOMIZE: How users can access their data]
    Specify the exact process:
    - Email support@yourapp.com?
    - In-app settings page?
    - Both?

[ ] [CUSTOMIZE: How users can delete their data]
    Specify the exact process:
    - Account deletion button?
    - Email request?
    - How long does it take?

[ ] [CUSTOMIZE: How users can export their data]
    Specify the exact process:
    - Automatic export feature?
    - Email request?
    - What format (JSON, CSV)?
```

---

## 🧪 Testing After Customization

Once you've made all changes:

### Text Verification
```
[ ] Search ALL files for "[REQUIRED" - should find ZERO results
[ ] Search ALL files for "[CUSTOMIZE" - should find ZERO results
[ ] Search ALL files for "[STATE-SPECIFIC" - should find ZERO results
[ ] Search ALL files for "[LEGAL-REVIEW" - should find ZERO results
[ ] Search for "CHANGE THIS" - should find ZERO results
[ ] Search for "Your App" - should find ZERO results (should be replaced)
[ ] Search for "Your Company" - should find ZERO results (should be replaced)
```

### Content Verification
```
[ ] All company info matches your legal entity EXACTLY
[ ] All email addresses are real and monitored
[ ] All dollar amounts match your actual pricing
[ ] All timeframes (3-5 days, 24 hours, etc.) match your actual processes
[ ] All states listed match where you actually operate
[ ] All blocked states match your geo-blocking code
[ ] All features described actually exist in your app
[ ] All third-party services mentioned are actually used
```

### Legal Verification (REQUIRED)
```
[ ] Attorney has reviewed ALL documents
[ ] Attorney has customized dispute resolution
[ ] Attorney has added state-specific language
[ ] Attorney has verified warranty disclaimers
[ ] Attorney has verified liability limitations
[ ] Attorney has added class action waiver (if applicable)
[ ] Attorney has reviewed for current law compliance
[ ] Attorney has signed off on final versions
```

### Code Integration
```
[ ] Terms of Service link working in app
[ ] Privacy Policy link working in app
[ ] Responsible Gaming link working in app
[ ] Users must accept during registration
[ ] Users can access anytime from settings
[ ] Version/date displayed correctly
[ ] Changes logged and users notified
```

---

## ⏱️ Timeline for Customization

### If Doing It Yourself (NOT RECOMMENDED)
```
Time Required: 10-20 hours
Risk Level: VERY HIGH
Confidence Level: LOW

Steps:
1. Fill in all [REQUIRED] tags - 2 hours
2. Customize all [CUSTOMIZE] tags - 3 hours
3. Research all [STATE-SPECIFIC] items - 5 hours
4. Attempt [LEGAL-REVIEW] items - ??? hours
5. Test and verify - 2 hours
6. Cross your fingers and hope it's correct - priceless

Total: Still legally exposed, may face:
- Lawsuits: $50k-500k
- Regulatory fines: $25k-250k
- Criminal charges: Possible
```

### If Using Attorney (RECOMMENDED)
```
Time Required: 2-4 weeks
Cost: $5,000 - $15,000
Risk Level: LOW
Confidence Level: HIGH

Steps:
1. Send attorney these templates - 1 hour
2. Fill in basic [REQUIRED] info for attorney - 2 hours
3. Attorney customizes everything - 1-2 weeks
4. Review attorney's draft - 2 hours
5. Attorney makes revisions - 1 week
6. Final version ready - Done!

Total: Legally protected, peace of mind
```

---

## 🚀 Deployment Checklist

Before going live:

```
[ ] ALL placeholders replaced
[ ] Attorney approval received (if applicable)
[ ] Terms version dated with today's date
[ ] Privacy Policy version dated with today's date
[ ] Responsible Gaming Policy version dated
[ ] Links working in production app
[ ] Acceptance flow tested
[ ] Email notifications configured
[ ] Support email monitored
[ ] Compliance dashboard configured
[ ] Geo-blocking tested
[ ] Age verification tested
```

---

## 📞 If You Get Stuck

### Common Questions

**Q: Can I skip [LEGAL-REVIEW] items if I'm not using an attorney?**
A: Technically yes, but you're taking HUGE risk. These are the most important sections for your legal protection.

**Q: Can I use "TBD" or "N/A" for items I'm not sure about?**
A: NO. Using placeholder text in production = no legal protection. If unsure, make your best guess but know you're exposed.

**Q: Can ChatGPT/AI really customize these well enough?**
A: It can help fill in basic info, but AI is NOT a lawyer and cannot provide legal advice. The AI won't know:
- Current state laws
- Recent court decisions
- Industry-specific regulations
- Your specific legal exposure
**AI can reduce attorney hours (and cost), but NOT replace attorney review.**

**Q: Which items are MOST critical?**
Priority order:
1. [REQUIRED] items - Without these, docs are useless
2. [STATE-SPECIFIC] items - Wrong state rules = illegal operation
3. [LEGAL-REVIEW] items - These protect you in lawsuits
4. [CUSTOMIZE] items - Important but less critical

**Q: Can I launch and fix these later?**
A: NO NO NO. Once you launch with bad Terms:
- Users agreed to those Terms
- Can't retroactively change what they agreed to
- You're stuck with the bad version
- Have to grandfather old users or force re-acceptance

---

## ⚠️ FINAL WARNING

**These templates are educational tools, NOT legal documents.**

**Using them without attorney review is like:**
- Performing surgery after watching YouTube videos
- Building a bridge after reading a Wikipedia article
- Flying a plane after playing a flight simulator

**You might get lucky. But probably not.**

**The $5,000-15,000 for an attorney is CHEAP compared to:**
- $50,000-500,000 in lawsuit damages
- $25,000-250,000 in regulatory fines
- 5 years in prison (Illegal Gambling Business Act)
- Losing your entire business

**Make the smart choice. Hire an attorney.**

---

Last updated: 2026-01-08
