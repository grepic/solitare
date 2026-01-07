# Gameplay Documentation

## How the Game Works

### Match Flow (End-to-End)

```
1. User selects match tier ($1, $5, $10, $25, or Practice)
   ↓
2. Client sends QUEUE_JOIN via WebSocket
   ↓
3. Backend locks entry fee in wallet
   ↓
4. Matchmaking finds opponent (same tier)
   ↓
5. Backend creates Match with:
   - Unique seed (cryptographically random)
   - Identical deck for both players
   - Entry fees locked
   ↓
6. Server sends MATCH_FOUND to both clients
   ↓
7. Clients show ready-check (30s timeout)
   ↓
8. Both clients send MATCH_READY
   ↓
9. Server sends MATCH_START with 3-second countdown
   ↓
10. Game begins - identical shuffled deck for both players
    ↓
11. Players make moves (tap-to-move system)
    ↓
12. Each move sent to server via WebSocket
    ↓
13. Server validates move and broadcasts progress
    ↓
14. First player to complete wins
    ↓
15. Server calculates:
    - Winner determination
    - Final time & score
    - Payout distribution
    ↓
16. Server sends MATCH_END to both clients
    ↓
17. Backend processes:
    - Deduct entry fees
    - Award prize to winner
    - Update XP & stats
    - Create transaction records
    ↓
18. Clients show results screen
```

## Game Rules (Klondike Solitaire)

### Objective
Move all cards to the 4 foundation piles, building up from Ace to King by suit.

### Setup
- **Stock**: 24 cards face down (after dealing tableau)
- **Waste**: Empty initially
- **Tableau**: 7 piles (1, 2, 3, 4, 5, 6, 7 cards)
  - Top card of each pile is face up
  - Rest are face down
- **Foundation**: 4 empty piles (one per suit)

### Valid Moves

#### 1. Draw from Stock
- Tap the stock pile
- Draws 1 card to waste pile
- If stock is empty, recycles waste back to stock

#### 2. Waste to Tableau
- Card must be opposite color
- Card must be one rank lower than target
- Kings can only go on empty tableau piles

#### 3. Waste to Foundation
- Must start with Ace
- Must be same suit
- Must be next rank in sequence (A→2→3...→K)

#### 4. Tableau to Foundation
- Same rules as Waste to Foundation
- Flips next card in tableau if available

#### 5. Tableau to Tableau
- Move sequences of face-up cards
- Bottom card must be opposite color
- Bottom card must be one rank lower
- Kings only go on empty piles

#### 6. Foundation to Tableau
- Allowed but discouraged (score penalty)
- Follow tableau placement rules

### Scoring

| Action | Points |
|--------|--------|
| Waste/Tableau → Foundation | +10 |
| Flip tableau card | +5 |
| Foundation → Tableau | -15 |
| Complete game | +100 XP |

### Win Conditions

**Primary**: First to complete all 4 foundations (Ace to King)

**Tie-breakers** (if both complete):
1. Fastest time (milliseconds)
2. Highest score
3. Fewest moves

**Maximum Time**: 10 minutes per match

### Fair Play Guarantees

✅ **Identical Decks**: Both players get same shuffle via seed
✅ **Server-Authoritative**: All moves validated on backend
✅ **Rate Limited**: Max 10 moves/second
✅ **Audit Trail**: All moves logged in database
✅ **Reconnection**: 30-second grace period
✅ **Anti-Cheat**: Impossible move detection

## UI Controls

### Tap-to-Move System

1. **Select Source**
   - Tap stock pile to draw
   - Tap waste pile to select top card
   - Tap tableau pile to select top card/sequence

2. **Select Destination**
   - Tap foundation pile to move there
   - Tap tableau pile to move there
   - Tap again to deselect

3. **Auto-Detection**
   - System determines valid move based on selection
   - Invalid moves are rejected with no penalty

### Visual Indicators

- **Selected Pile**: Highlighted border
- **Valid Moves**: (Future: highlight valid targets)
- **Opponent Progress**: Move counter at top
- **Your Progress**: Score & move count

### Game Controls

- **Resign**: Bottom-left button (forfeits match)
- **No Pause**: Matches run continuously
- **No Undo**: Moves are final

## Reconnection

### If You Disconnect

1. **Grace Period**: 30 seconds to reconnect
2. **Resume**: App auto-reconnects to match
3. **State Sync**: Server sends current game state
4. **Continue**: Game resumes from where you left off

### If Opponent Disconnects

- You continue playing
- If they don't reconnect in 30s, you win by forfeit
- Full payout awarded

## Match Types

### Practice Mode (Free)
- No entry fee
- No prize pool
- Perfect for learning
- Full game mechanics
- No wallet required

### Cash Matches ($1, $5, $10, $25)
- Entry fee deducted from wallet
- Prize pool = (entry fee × 2) - platform fee
- Winner takes full prize pool
- Transaction recorded
- Stats & XP updated

## Example Match

```
Player A selects $5 match
  → Queue: Player A waiting

Player B selects $5 match
  → Match Found!

Both players:
  → $5 locked in wallet
  → Seed: "a7f3e9d2..."
  → Deck shuffled identically
  → Ready check (30s)

Both ready:
  → 3... 2... 1... START

Player A:
  - Completes in 3:24.567
  - Score: 285
  - Moves: 87

Player B:
  - Completes in 3:31.892
  - Score: 270
  - Moves: 92

Result:
  → Player A wins (faster time)
  → Player A gets $9.00
  → Player B gets $0.00
  → Platform keeps $1.00

Both players:
  → Entry fees deducted ($5)
  → Player A: +$9.00, +100 XP, +1 win
  → Player B: +25 XP, +1 loss
```

## Scoring Examples

### Basic Game
```
Initial: 0 points

Move waste Ace♠ to foundation: +10 → 10 points
Flip tableau 7♥: +5 → 15 points
Move 2♠ to foundation: +10 → 25 points
Move 3♠ to foundation: +10 → 35 points
...
Complete all foundations: 52 cards × ~10 avg = ~520 points

Actual score varies based on:
- How many flips needed
- Moves from waste vs tableau
- Any foundation → tableau penalties
```

### Score vs Time

Higher score ≠ automatic win

**Example:**
- Player A: 650 points, 5:00 time
- Player B: 520 points, 3:30 time
- **Winner**: Player B (faster completion)

Score only matters for tie-breaking!

## Strategy Tips

### For Speed
- ✅ Plan ahead before moving
- ✅ Uncover tableau cards quickly
- ✅ Move to foundations when safe
- ✅ Minimize waste cycling

### For Success
- ✅ Kings on empty spaces strategically
- ✅ Don't rush - invalid moves waste time
- ✅ Watch opponent progress (motivation!)
- ✅ Practice mode to learn patterns

### Common Mistakes
- ❌ Moving to foundation too early (blocks tableau)
- ❌ Filling all tableau spaces with Kings
- ❌ Not planning ahead
- ❌ Panic when behind

## Technical Details

### Move Validation

Server checks:
1. **Card exists** at source location
2. **Card is face up** (for tableau)
3. **Target follows rules** (color, rank, suit)
4. **Sequence is valid** (for multi-card moves)
5. **Rate limit** not exceeded

Invalid moves are rejected with error message.

### State Synchronization

Every move:
```typescript
Client:
  1. Update local state optimistically
  2. Send move to server

Server:
  3. Validate move
  4. Record in database
  5. Send ACK to client
  6. Broadcast progress to opponent

Client:
  7. Show opponent's move count
```

### Win Detection

**Client-side**:
- Checks after each move
- If won, shows victory screen

**Server-side**:
- Tracks both players' progress
- First to send winning move = winner
- Calculates final stats
- Processes payouts

### Anti-Cheat Measures

1. **Impossible Moves**: Server validates all rules
2. **Speed Hacks**: Rate limiting (10 moves/sec max)
3. **State Manipulation**: Server is source of truth
4. **Replay Attacks**: Move sequence numbers
5. **Disconnect Abuse**: Tracked & logged

## Troubleshooting

### Game Won't Start
- Check internet connection
- Verify wallet has sufficient balance
- Wait for ready-check timeout (30s)
- Try rejoining queue

### Moves Not Registering
- Check WebSocket connection
- Try tapping again (may be rate limited)
- Verify move is valid (color, rank rules)

### Opponent Not Moving
- They may be thinking
- Check their move counter
- They may have disconnected (30s grace period)

### Match Ended Unexpectedly
- Opponent may have resigned
- Disconnect timeout reached
- Server error (rare - match refunded)

## Limitations (Current Version)

- ⚠️ **No Drag & Drop**: Tap-to-move only
- ⚠️ **No Hints**: Must know valid moves
- ⚠️ **No Undo**: All moves final
- ⚠️ **Single Card Moves**: Multi-card tableau moves simplified
- ⚠️ **No Spectating**: Can't watch other matches

## Future Enhancements

- [ ] Drag & drop support
- [ ] Hint system (practice mode)
- [ ] Replay viewer
- [ ] Multi-card selection
- [ ] Statistics tracking
- [ ] Achievements
- [ ] Tournament mode
- [ ] Friend challenges

---

**Last Updated**: 2026-01-07
**Game Engine Version**: 1.0.0
