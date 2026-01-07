import { io, Socket } from 'socket.io-client';
import ENV from '../config/env';
import { ServerToClientEvents, ClientToServerEvents } from '@solitaire/shared';

class WebSocketService {
  private socket: Socket | null = null;

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

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
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
}

export default new WebSocketService();
