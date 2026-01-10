# 🔧 Co Vyladit - Priority List

## 🔴 KRITICKÉ (Musí se vyřešit)

### 1. Prisma Client Blocker ⚠️
**Problém:** Backend se nemůže zkompilovat bez Prisma Client

**Aktuální stav:**
- ✅ Database běží a tabulky existují
- ✅ Prisma schema je správné
- ❌ Prisma Client engines chybí (403 Forbidden)

**Možná řešení:**

#### A) Zkusit offline generaci (RYCHLÉ):
```bash
cd apps/api
# Export enginesOFFLINE=1 PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 \
PRISMA_SKIP_POSTINSTALL_GENERATE=1 \
npx prisma generate
```

#### B) Použít binary Prisma engines z jiného projektu:
```bash
# Najít projekt s funkčním Prisma
find ~/projects -name "libquery_engine*.node" -o -name "schema-engine*"

# Zkopírovat do:
# /home/user/solitare/apps/api/node_modules/.prisma/client/
```

#### C) Downgrade na starší Prisma (DOPORUČENO):
```bash
cd apps/api
npm install @prisma/client@5.8.0 prisma@5.8.0
npx prisma generate
```

#### D) Použít mock PrismaService pro vývoj:
Vytvořit dočasný mock pro testování UI.

---

### 2. TypeScript Strict Errors 🔴
**Problém:** 100+ TypeScript chyb v kódu

**Hlavní kategorie:**

#### A) Implicit `any` typy (60+ chyb):
```typescript
// ❌ Špatně:
async approveWithdrawal(@Req() req) {

// ✅ Správně:
async approveWithdrawal(@Req() req: Request) {
```

**Oprava:**
```bash
# Dočasně povolit v tsconfig.json:
"noImplicitAny": false,
"strict": false
```

#### B) Chybějící Prisma accessory (40+ chyb):
```
Property 'user' does not exist on type 'PrismaService'
Property 'game' does not exist on type 'PrismaService'
```

**Příčina:** Prisma Client není vygenerovaný
**Řešení:** Viz bod 1 výše

#### C) Chybějící type definitions:
```bash
# Instalovat chybějící typy:
npm install --save-dev @types/geoip-lite
```

---

### 3. WalletService Missing Methods 🟠
**Problém:** `debit()` a `credit()` metody neexistují

**Soubor:** `apps/api/src/wallet/wallet.service.ts`

**Chybí:**
```typescript
async debit(userId: string, amountCents: number, type: TransactionType): Promise<void> {
  // Implementace
}

async credit(userId: string, amountCents: number, type: TransactionType): Promise<void> {
  // Implementace
}
```

**Současný stav:**
- GamesService volá `walletService.debit()` - neexistuje!
- GamesService volá `walletService.credit()` - neexistuje!

**Priority:** VYSOKÁ - bez toho entry fee/payouts nefungují

---

## 🟡 STŘEDNÍ PRIORITA (Mělo by se opravit)

### 4. Missing Guards & Decorators 🟡
**Chybí:**
- `src/common/guards/roles.guard.ts`
- `src/common/decorators/roles.decorator.ts`

**Kde se používá:**
- `ComplianceController` - admin endpoints
- `AdminController` - revenue stats

**Impact:** Admin endpoints jsou nezabezpečené!

**Rychlá oprava:**
```typescript
// src/common/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>('roles', context.getHandler());
    if (!requiredRoles) return true;

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    return requiredRoles.some((role) => user.role === role);
  }
}
```

---

### 5. Stripe API Version Mismatch 🟡
**Soubor:** `apps/api/src/stripe/stripe.service.ts:19`

```typescript
// ❌ Error:
apiVersion: '2024-12-18.acacia',  // Type error

// ✅ Oprava:
apiVersion: '2023-10-16' as any,  // nebo upgradovat @types/stripe
```

---

### 6. SolitaireEngine Import Error 🟡
```
Cannot find module '@solitaire/solitaire-engine'
```

**Problém:** Package se jmenuje `@solitaire/engine`, ne `@solitaire/solitaire-engine`

**Oprava v:**
- `apps/api/src/games/games.service.ts:12`
- `apps/api/src/match/match.service.ts:6`

```typescript
// ❌ Špatně:
import { SolitaireEngine } from '@solitaire/solitaire-engine';

// ✅ Správně:
import { SolitaireEngine } from '@solitaire/engine';
```

---

### 7. Responsible Gaming Guard Return Type 🟡
**Soubor:** `src/common/guards/responsible-gaming.guard.ts:24`

```typescript
// ❌ Error:
async canActivate(context: ExecutionContext): boolean {

// ✅ Oprava:
async canActivate(context: ExecutionContext): Promise<boolean> {
```

---

## 🟢 NÍZKÁ PRIORITA (Nice to have)

### 8. Unused Variables & Imports 🟢
**Úklid kódu:**
- 20+ unused parameters (`target`, `key`, `refreshToken`, etc.)
- 15+ unused imports (`ForbiddenException`, `Patch`, `Post`, etc.)

**Oprava:**
```bash
cd apps/api
npm run lint -- --fix
```

---

### 9. Welcome Bonuses UI 🟢
**Status:** Backend hotový, UI chybí

**Potřeba vytvořit:**
```typescript
// apps/mobile/src/screens/main/ClaimCouponScreen.tsx

export function ClaimCouponScreen() {
  const [code, setCode] = useState('');

  const handleClaim = async () => {
    const response = await fetch(`${API_URL}/coupons/claim`, {
      method: 'POST',
      body: JSON.stringify({ code }),
    });
    // Show success/error
  };

  return (
    <View>
      <TextInput
        placeholder="Enter coupon code"
        value={code}
        onChangeText={setCode}
      />
      <Button title="Claim Bonus" onPress={handleClaim} />
    </View>
  );
}
```

**Čas:** 1-2 hodiny

---

### 10. Missing Database Models 🟢
**Chybějící tabulky (optional):**
- `DailyChallenge` - daily challenges system
- `RateLimitEntry` - rate limiting storage
- `RestrictedRegion` - geo-blocking rules

**Backend je na ně připravený, ale tabulky neexistují v DB.**

**Řešení:**
Přidat do `schema.prisma` a spustit migration.

---

## 📊 DOPORUČENÉ POŘADÍ OPRAV

### Fáze 1: Zprovoznit Backend (2-3 hodiny)
1. ✅ **Vyřešit Prisma** - zkusit downgrade nebo offline generaci
2. ✅ **Doplnit WalletService.debit/credit** - kritické pro payouts
3. ✅ **Opravit @solitaire/solitaire-engine imports**
4. ✅ **Přidat chybějící guards** (RolesGuard, Roles decorator)
5. ✅ **Dočasně vypnout strict TypeScript** - aby se zkompiloval

### Fáze 2: Otestovat Core Features (1 hodina)
1. ✅ Spustit backend: `npm run dev`
2. ✅ Spustit mobile: `npm start`
3. ✅ Vytvořit test hru
4. ✅ Připojit 2 hráče
5. ✅ Dokončit hru → zkontrolovat payouts

### Fáze 3: Vyladit TypeScript (1-2 hodiny)
1. ✅ Přidat `@types/geoip-lite`
2. ✅ Opravit všechny `@Req() req: Request` typy
3. ✅ Odstranit unused variables
4. ✅ Zapnout zpět strict mode

### Fáze 4: Polish (volitelné)
1. 🟡 Welcome bonuses UI
2. 🟡 Admin dashboard grafy
3. 🟡 Missing DB models
4. 🟡 Error handling improvements

---

## 🚀 QUICK FIX Script

Vytvořil jsem ti skript pro rychlé opravy:

```bash
#!/bin/bash
echo "🔧 Vylaďování Solitaire App..."

# 1. Fix Prisma
cd /home/user/solitare/apps/api
echo "📦 Downgrading Prisma..."
npm install @prisma/client@5.8.0 prisma@5.8.0 --legacy-peer-deps

# 2. Try generate
echo "🔨 Generating Prisma Client..."
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate || echo "⚠️ Stále blocker"

# 3. Install missing types
echo "📚 Installing types..."
npm install --save-dev @types/geoip-lite

# 4. Relax TypeScript
echo "⚙️ Relaxing TypeScript..."
cat > tsconfig.temp.json <<EOF
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "noImplicitAny": false,
    "strict": false
  }
}
EOF

# 5. Try build
echo "🏗️ Building..."
npm run build 2>&1 | head -50

echo "✅ Done! Zkus teď: npm run dev"
```

---

## 📋 CHECKLIST - Co Udělat TEĎ

- [ ] **Zkusit downgrade Prisma na 5.8.0**
- [ ] **Doplnit WalletService.debit/credit metody**
- [ ] **Opravit @solitaire/solitaire-engine → @solitaire/engine**
- [ ] **Přidat RolesGuard a Roles decorator**
- [ ] **Vypnout strict TypeScript dočasně**
- [ ] **Zkusit zkompilovat backend**
- [ ] **Otestovat vytvoření hry**
- [ ] **Ověřit platform fee tracking**

---

## 💡 TL;DR

**Hlavní problémy:**
1. 🔴 **Prisma Client** - nelze vygenerovat (403)
2. 🔴 **WalletService** - chybí debit/credit metody
3. 🟡 **TypeScript** - 100+ chyb (většinou kvůli Prismě)
4. 🟡 **Chybějící guards** - admin endpoints nezabezpečené

**Nejrychlejší cesta vpřed:**
1. Zkus downgrade Prisma na 5.8.0
2. Doplň WalletService metody
3. Vypni strict TypeScript
4. Spusť backend v "dev mode"
5. Testuj!

**Čas do funkčního prototypu:** 2-3 hodiny práce 🚀
