import { io, Socket } from 'socket.io-client';
import ENV from '../config/env';
import { ServerToClientEvents, ClientToServerEvents } from '@solitaire/shared';

class WebSocketService {
  private socket: Socket | null = null;
  private lobbySocket: Socket | null = null;

  connect(accessToken: string) {
    if (this.socket?.connected) {
      return this.socket;
    }

    this.socket = io(ENV.WS_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.socket?.emit('AUTH', { accessToken });
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
    });

    return this.socket;
  }

  /**
   * Connect to lobby namespace for multi-player lobbies
   */
  connectLobby(accessToken: string) {
    if (this.lobbySocket?.connected) {
      return this.lobbySocket;
    }

    // Connect to /lobby namespace
    const lobbyUrl = ENV.WS_URL.replace(/\/$/, '') + '/lobby';

    this.lobbySocket = io(lobbyUrl, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      auth: {
        token: accessToken,
      },
    });

    this.lobbySocket.on('connect', () => {
      console.log('Lobby WebSocket connected');
    });

    this.lobbySocket.on('disconnect', () => {
      console.log('Lobby WebSocket disconnected');
    });

    this.lobbySocket.on('connect_error', (error) => {
      console.error('Lobby WebSocket connection error:', error);
    });

    return this.lobbySocket;
  }

  disconnectLobby() {
    this.lobbySocket?.disconnect();
    this.lobbySocket = null;
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
    this.disconnectLobby();
  }

  emit<K extends keyof ClientToServerEvents>(event: K, data: ClientToServerEvents[K]) {
    this.socket?.emit(event as string, data);
  }

  on<K extends keyof ServerToClientEvents>(
    event: K,
    callback: (data: ServerToClientEvents[K]) => void,
  ) {
    this.socket?.on(event as string, callback);
  }

  off(event: string, callback?: Function) {
    this.socket?.off(event, callback as any);
  }

  getSocket() {
    return this.socket;
  }

  getLobbySocket() {
    return this.lobbySocket;
  }

  /**
   * Emit event on lobby socket
   */
  emitLobby(event: string, data: any, callback?: Function) {
    if (callback) {
      this.lobbySocket?.emit(event, data, callback);
    } else {
      this.lobbySocket?.emit(event, data);
    }
  }

  /**
   * Listen to lobby socket events
   */
  onLobby(event: string, callback: Function) {
    this.lobbySocket?.on(event, callback as any);
  }

  /**
   * Remove lobby socket listener
   */
  offLobby(event: string, callback?: Function) {
    this.lobbySocket?.off(event, callback as any);
  }
}

export default new WebSocketService();
