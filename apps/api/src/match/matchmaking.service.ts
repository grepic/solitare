import { Injectable } from '@nestjs/common';
import { RedisService } from '../redis/redis.service';
import { MatchTier } from '@prisma/client';

interface QueueEntry {
  userId: string;
  tier: MatchTier;
  joinedAt: number;
}

@Injectable()
export class MatchmakingService {
  constructor(private redis: RedisService) {}

  async joinQueue(userId: string, tier: MatchTier): Promise<void> {
    const queueKey = `queue:${tier}`;
    const entry: QueueEntry = {
      userId,
      tier,
      joinedAt: Date.now(),
    };

    await this.redis.rpush(queueKey, JSON.stringify(entry));
  }

  async leaveQueue(userId: string, tier: MatchTier): Promise<void> {
    const queueKey = `queue:${tier}`;
    const entries = await this.redis.lrange(queueKey, 0, -1);

    // Remove user from queue
    for (const entryStr of entries) {
      const entry: QueueEntry = JSON.parse(entryStr);
      if (entry.userId === userId) {
        // This is inefficient but simple for MVP
        // In production, use a sorted set or more efficient structure
        await this.redis.srem(queueKey, entryStr);
        break;
      }
    }
  }

  async findMatch(tier: MatchTier): Promise<[string, string] | null> {
    const queueKey = `queue:${tier}`;

    // Get two players from queue
    const player1Str = await this.redis.lpop(queueKey);
    if (!player1Str) return null;

    const player2Str = await this.redis.lpop(queueKey);
    if (!player2Str) {
      // Put player1 back
      await this.redis.lpush(queueKey, player1Str);
      return null;
    }

    const player1: QueueEntry = JSON.parse(player1Str);
    const player2: QueueEntry = JSON.parse(player2Str);

    return [player1.userId, player2.userId];
  }

  async getQueuePosition(userId: string, tier: MatchTier): Promise<number> {
    const queueKey = `queue:${tier}`;
    const entries = await this.redis.lrange(queueKey, 0, -1);

    for (let i = 0; i < entries.length; i++) {
      const entry: QueueEntry = JSON.parse(entries[i]);
      if (entry.userId === userId) {
        return i;
      }
    }

    return -1;
  }

  async getQueueSize(tier: MatchTier): Promise<number> {
    const queueKey = `queue:${tier}`;
    const entries = await this.redis.lrange(queueKey, 0, -1);
    return entries.length;
  }
}
