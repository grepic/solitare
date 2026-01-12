/**
 * Analytics Service
 *
 * Tracks user events, screen views, and custom metrics.
 * Supports Firebase Analytics and custom analytics providers.
 *
 * TODO: Install Firebase Analytics:
 * npm install @react-native-firebase/app @react-native-firebase/analytics
 */

// import analytics from '@react-native-firebase/analytics';

type EventParams = Record<string, string | number | boolean>;

class AnalyticsService {
  private enabled: boolean = true;

  /**
   * Initialize analytics
   */
  async initialize(): Promise<void> {
    console.log('📊 Initializing analytics...');

    /* TODO: Uncomment after installing Firebase

    // Set default event parameters
    await analytics().setDefaultEventParameters({
      app_version: '1.0.0',
      platform: Platform.OS,
    });

    */

    console.log('⚠️ Firebase Analytics not installed. Install with:');
    console.log('  npm install @react-native-firebase/app @react-native-firebase/analytics');
  }

  /**
   * Track custom event
   */
  async logEvent(eventName: string, params?: EventParams): Promise<void> {
    if (!this.enabled) return;

    console.log(`📊 Analytics event: ${eventName}`, params);

    /* TODO: Uncomment after installing Firebase
    await analytics().logEvent(eventName, params);
    */
  }

  /**
   * Track screen view
   */
  async logScreenView(screenName: string, screenClass?: string): Promise<void> {
    if (!this.enabled) return;

    console.log(`📺 Screen view: ${screenName}`);

    /* TODO: Uncomment after installing Firebase
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenClass || screenName,
    });
    */
  }

  /**
   * Set user ID
   */
  async setUserId(userId: string): Promise<void> {
    if (!this.enabled) return;

    console.log(`👤 Set user ID: ${userId}`);

    /* TODO: Uncomment after installing Firebase
    await analytics().setUserId(userId);
    */
  }

  /**
   * Set user property
   */
  async setUserProperty(name: string, value: string): Promise<void> {
    if (!this.enabled) return;

    console.log(`👤 Set user property: ${name} = ${value}`);

    /* TODO: Uncomment after installing Firebase
    await analytics().setUserProperty(name, value);
    */
  }

  /**
   * Enable/disable analytics
   */
  async setEnabled(enabled: boolean): Promise<void> {
    this.enabled = enabled;

    /* TODO: Uncomment after installing Firebase
    await analytics().setAnalyticsCollectionEnabled(enabled);
    */

    console.log(`📊 Analytics ${enabled ? 'enabled' : 'disabled'}`);
  }

  // ===================
  // Game Events
  // ===================

  /**
   * Track game start
   */
  async logGameStart(matchId: string, tier: string): Promise<void> {
    await this.logEvent('game_start', {
      match_id: matchId,
      tier,
    });
  }

  /**
   * Track game end
   */
  async logGameEnd(
    matchId: string,
    result: 'win' | 'loss',
    score: number,
    duration: number
  ): Promise<void> {
    await this.logEvent('game_end', {
      match_id: matchId,
      result,
      score,
      duration_seconds: Math.round(duration / 1000),
    });
  }

  /**
   * Track game move
   */
  async logGameMove(matchId: string, moveType: string): Promise<void> {
    // Don't log every move to save costs
    // Can sample or aggregate
    if (Math.random() < 0.1) { // 10% sampling
      await this.logEvent('game_move', {
        match_id: matchId,
        move_type: moveType,
      });
    }
  }

  // ===================
  // User Events
  // ===================

  /**
   * Track sign up
   */
  async logSignUp(method: string): Promise<void> {
    await this.logEvent('sign_up', {
      method, // 'email', 'google', 'apple'
    });
  }

  /**
   * Track login
   */
  async logLogin(method: string): Promise<void> {
    await this.logEvent('login', {
      method,
    });
  }

  /**
   * Track tutorial complete
   */
  async logTutorialComplete(): Promise<void> {
    await this.logEvent('tutorial_complete');
  }

  /**
   * Track tutorial skip
   */
  async logTutorialSkip(step: number): Promise<void> {
    await this.logEvent('tutorial_skip', {
      step,
    });
  }

  // ===================
  // Purchase Events
  // ===================

  /**
   * Track deposit
   */
  async logDeposit(amount: number, currency: string): Promise<void> {
    await this.logEvent('deposit', {
      value: amount,
      currency,
    });
  }

  /**
   * Track purchase
   */
  async logPurchase(
    tier: string,
    value: number,
    currency: string
  ): Promise<void> {
    await this.logEvent('purchase', {
      tier,
      value,
      currency,
    });
  }

  /**
   * Track withdrawal
   */
  async logWithdrawal(amount: number, currency: string): Promise<void> {
    await this.logEvent('withdrawal', {
      value: amount,
      currency,
    });
  }

  // ===================
  // Social Events
  // ===================

  /**
   * Track share
   */
  async logShare(
    contentType: string,
    method: string,
    contentId?: string
  ): Promise<void> {
    await this.logEvent('share', {
      content_type: contentType,
      method, // 'facebook', 'twitter', 'copy_link'
      item_id: contentId,
    });
  }

  /**
   * Track friend invite
   */
  async logInviteFriend(method: string): Promise<void> {
    await this.logEvent('invite_friend', {
      method,
    });
  }

  // ===================
  // Achievement Events
  // ===================

  /**
   * Track achievement unlock
   */
  async logAchievementUnlock(achievementId: string): Promise<void> {
    await this.logEvent('unlock_achievement', {
      achievement_id: achievementId,
    });
  }

  /**
   * Track level up
   */
  async logLevelUp(level: number): Promise<void> {
    await this.logEvent('level_up', {
      level,
    });
  }

  // ===================
  // Error Events
  // ===================

  /**
   * Track error
   */
  async logError(
    errorType: string,
    errorMessage: string,
    fatal: boolean = false
  ): Promise<void> {
    await this.logEvent('error', {
      error_type: errorType,
      error_message: errorMessage,
      fatal: fatal ? 1 : 0,
    });
  }

  /**
   * Track API error
   */
  async logAPIError(
    endpoint: string,
    statusCode: number,
    errorMessage: string
  ): Promise<void> {
    await this.logEvent('api_error', {
      endpoint,
      status_code: statusCode,
      error_message: errorMessage,
    });
  }

  // ===================
  // Engagement Events
  // ===================

  /**
   * Track search
   */
  async logSearch(searchTerm: string): Promise<void> {
    await this.logEvent('search', {
      search_term: searchTerm,
    });
  }

  /**
   * Track view item list (e.g., leaderboard)
   */
  async logViewItemList(listName: string, itemCount: number): Promise<void> {
    await this.logEvent('view_item_list', {
      item_list_name: listName,
      item_count: itemCount,
    });
  }

  /**
   * Track select content
   */
  async logSelectContent(
    contentType: string,
    contentId: string
  ): Promise<void> {
    await this.logEvent('select_content', {
      content_type: contentType,
      item_id: contentId,
    });
  }
}

export const analyticsService = new AnalyticsService();

// Pre-defined event names for consistency
export const AnalyticsEvents = {
  // Game
  GAME_START: 'game_start',
  GAME_END: 'game_end',
  GAME_MOVE: 'game_move',

  // User
  SIGN_UP: 'sign_up',
  LOGIN: 'login',
  TUTORIAL_COMPLETE: 'tutorial_complete',
  TUTORIAL_SKIP: 'tutorial_skip',

  // Purchase
  DEPOSIT: 'deposit',
  PURCHASE: 'purchase',
  WITHDRAWAL: 'withdrawal',

  // Social
  SHARE: 'share',
  INVITE_FRIEND: 'invite_friend',

  // Achievement
  UNLOCK_ACHIEVEMENT: 'unlock_achievement',
  LEVEL_UP: 'level_up',

  // Error
  ERROR: 'error',
  API_ERROR: 'api_error',

  // Engagement
  SEARCH: 'search',
  VIEW_ITEM_LIST: 'view_item_list',
  SELECT_CONTENT: 'select_content',
} as const;
