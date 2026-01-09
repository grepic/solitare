# 🚀 Quick Start Guide - Solitaire Multi-Player App

## ⚡ TL;DR - Nejrychlejší Start (30 minut)

```bash
# 1. Automatický setup (vše nastaví)
./setup.sh

# 2. Spusť backend
cd apps/api
npm run start:dev

# 3. Spusť mobile (v novém terminálu)
cd apps/mobile
npm start
# Pak stiskni 'i' pro iOS nebo 'a' pro Android
```

**Hotovo!** 🎉 Můžeš testovat multi-player lobbies!

---

## 📋 Co Setup Script Dělá:

✅ Nainstaluje všechny npm dependencies
✅ Vytvoří PostgreSQL databázi
✅ Spustí database migration (Game, GamePlayer, Coupon tables)
✅ Vygeneruje Prisma client
✅ Zkontroluje Redis
✅ Vytvoří .env soubor

---

## 🛠️ Manuální Setup (pokud setup.sh nefunguje)

### Krok 1: PostgreSQL Database

```bash
# Spusť PostgreSQL
sudo systemctl start postgresql

# Vytvoř databázi a uživatele
sudo -u postgres psql
CREATE DATABASE solitaire_db;
CREATE USER solitaire WITH PASSWORD 'solitaire_dev_password';
GRANT ALL PRIVILEGES ON DATABASE solitaire_db TO solitaire;
\q
```

### Krok 2: Database Migration

```bash
cd apps/api

# Spusť SQL migration ručně
psql -U solitaire -d solitaire_db -h localhost < prisma/migrations/manual_multiplayer_migration.sql

# Nebo zkus Prisma migrate (pokud funguje)
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma migrate deploy
```

### Krok 3: Install Dependencies

```bash
# Backend
cd apps/api
npm install

# Mobile
cd ../mobile
npm install
```

### Krok 4: .env Configuration

Soubor `apps/api/.env` už existuje s testovacími hodnotami!

**Důležité pro real-money:**
```env
STRIPE_SECRET_KEY=sk_test_your_real_key
STRIPE_WEBHOOK_SECRET=whsec_your_real_secret
```

### Krok 5: Start Redis (optional)

```bash
# Na většině systémů:
sudo systemctl start redis

# Nebo přímo:
redis-server --daemonize yes
```

---

## 🎮 Jak Spustit App

### Backend:
```bash
cd apps/api
npm run start:dev

# Měl bys vidět:
# [Nest] Nest application successfully started
# [Nest] Lobby broadcast started
# [Nest] LobbyGateway listening on /lobby namespace
```

**Backend běží na:** http://localhost:3000

### Mobile:
```bash
cd apps/mobile
npm start

# Pak stiskni:
# - 'i' pro iOS simulator
# - 'a' pro Android emulator
# - 'w' pro web browser (development)
```

---

## 🧪 Testování Multi-Player Lobby

### Test #1: Browse Lobbies

1. **Login** do aplikace
2. Tap **"Browse Multi-Player Lobbies"** na home screen
3. Měl bys vidět:
   - Prázdný seznam (ještě žádné hry)
   - Tabs: All, Practice, $1, $5, $10
   - "Create Game" button

### Test #2: Create Game

1. Tap **"Create Game"**
2. Nastav:
   - Name: "Test Game"
   - Tier: Practice (Free)
   - Max Players: 4
3. Tap **"Create Game"**
4. Měl bys vidět "Success" alert
5. Vrať se do lobby browseru - tvoje hra tam je!

### Test #3: Multi-Device Join

**Zařízení 1:**
1. Vytvoř 4-player hru (Practice)
2. Počkej na další hráče...

**Zařízení 2:**
1. Otevři app
2. Browse lobbies
3. Uvidíš hru z Zařízení 1
4. Tap "Join Now"

**Obě zařízení:**
- Progress bar se aktualizuje (2/4 Players, 50%)
- Když 4/4 → 10s countdown → HRA ZAČNE!

### Test #4: Admin Dashboard

1. Login jako admin user
2. Tap **💰 button** v home screen
3. Měl bys vidět:
   - Today's revenue: $0.00 (zatím žádné hry)
   - Week/Month/All-time revenue
   - Active games count
   - Example earnings breakdown

---

## 🔍 Troubleshooting

### "WebSocket connection failed"
```bash
# Zkontroluj že backend běží:
curl http://localhost:3000

# Zkontroluj WebSocket:
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:3000/lobby
```

### "Database connection failed"
```bash
# Zkontroluj PostgreSQL:
sudo systemctl status postgresql

# Zkontroluj databázi existuje:
psql -U solitaire -d solitaire_db -h localhost -c "SELECT 1"
```

### "Prisma migration error"
```bash
# Spusť SQL migration ručně:
cd apps/api
psql -U solitaire -d solitaire_db -h localhost < \
  prisma/migrations/manual_multiplayer_migration.sql
```

### "Redis connection error"
```bash
# Redis není nutný pro vývoj
# Ale pokud chceš:
sudo apt-get install redis-server
sudo systemctl start redis
redis-cli ping  # mělo by vrátit "PONG"
```

---

## 📱 Features Checklist

Po spuštění zkontroluj že funguje:

### Backend:
- [ ] Server běží na :3000
- [ ] Prisma připojeno k DB
- [ ] WebSocket /lobby namespace aktivní
- [ ] Lobby broadcast každých 5s

### Mobile:
- [ ] App se spustí
- [ ] Login funguje
- [ ] Home screen zobrazí balance
- [ ] "Browse Lobbies" button viditelný

### Multi-Player:
- [ ] Browse lobbies screen
- [ ] Create game screen
- [ ] Game cards s animacemi
- [ ] Join game funguje
- [ ] Real-time updates (každých 5s)

### Admin:
- [ ] 💰 button viditelný (admin only)
- [ ] Dashboard zobrazuje revenue
- [ ] Stats card fungují

---

## 💰 Platform Revenue Info

### Jak to funguje:

**Každá hra automaticky:**
1. Vybere entry fees (např. 9 × $10 = $90)
2. Odpočítá 10% platform fee ($9 = TVOJE!)
3. Rozdělí zbytek mezi hráče ($81)

**Příklad 9-player $10 game:**
```
Total collected: $90.00
--------------------------
Platform Fee:     $9.00  ← Tvůj příjem! 💰
Prize Pool:      $81.00  ← Hráči dostanou:
  1st: $24.30 (30%)
  2nd: $16.20 (20%)
  3rd: $10.53 (13%)
  ...atd
```

**Projekce:**
- 100 her/den × $3 avg fee = **$300/den**
- **$9,000/měsíc**
- **$108,000/rok**

---

## 🎯 Next Steps Po Spuštění:

### 1. Testuj vše! ✅
- Vytvoř různé hry (2, 4, 6, 8 hráčů)
- Zkus time-limited tournaments
- Otestuj cancelaci
- Zkontroluj payouts v admin dashboard

### 2. Customize Game Names 🎨
Edituj `apps/mobile/src/screens/main/CreateGameScreen.tsx`:
```typescript
const GAME_NAMES = [
  'Gem-a-zing',  // ← Změň na svoje názvy!
  'Easy Gains',
  ...
];
```

### 3. Adjust Platform Fee 💰
Edituj `apps/api/.env`:
```env
PLATFORM_FEE_PERCENTAGE=10  # ← Změň na 15% pro vyšší příjmy!
```

### 4. Add Stripe Keys (pro real-money) 💳
```env
STRIPE_SECRET_KEY=sk_live_your_real_key
STRIPE_WEBHOOK_SECRET=whsec_your_real_secret
```

### 5. Legal Docs (NUTNÉ pro launch!) ⚖️
- Customize Terms of Service
- Customize Privacy Policy
- Get attorney review! ($5k-15k)
- FinCEN registration (if USA)
- MTL licenses (if needed)

---

## 🚨 IMPORTANT NOTES:

### Pro Development/Testing:
✅ **Můžeš spustit TEĎ!**
- Practice mode (free)
- Test multi-player
- Test admin dashboard
- Vše funguje locally

### Pro Production Launch:
⚠️ **POTŘEBUJEŠ:**
- [ ] Legal review (attorney)
- [ ] FinCEN registration
- [ ] Stripe production keys
- [ ] SSL certificates
- [ ] Production database
- [ ] Domain + hosting

### Pro Real-Money:
🔴 **KRITICKÉ:**
- [ ] Attorney customization ($5k-15k)
- [ ] Money Transmitter Licenses
- [ ] Age verification workflow
- [ ] Compliance testing
- [ ] State blocking (AZ, IA, LA, MT, WA)

---

## 📞 Support:

**Dokumentace:**
- `WHAT_IS_MISSING.md` - Co ještě chybí
- `MULTI_PLAYER_IMPLEMENTATION.md` - Technical details
- `PLATFORM_REVENUE_MODEL.md` - Revenue examples
- `LEGAL_COMPLIANCE.md` - Legal requirements

**Problémy?**
1. Zkontroluj logs v terminálu
2. Zkontroluj .env konfiguraci
3. Zkontroluj database připojení
4. Spusť setup.sh znovu

---

**🎉 Happy Launching!**

Všechno je připravené!
Jen spusť `./setup.sh` a můžeš testovat! 🚀

**Platform fee je automatický - každá hra ti přinese 10%!** 💰
