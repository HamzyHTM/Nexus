
import { SocketEvent } from '../types';

type Handler = (payload: any) => void;

class SocketService {
  private channel: BroadcastChannel;
  private handlers: Map<string, Handler[]> = new Map();

  constructor() {
    this.channel = new BroadcastChannel('nexus_socket_v1');
    this.channel.onmessage = (event) => {
      const { type, payload } = event.data as SocketEvent;
      const typeHandlers = this.handlers.get(type) || [];
      typeHandlers.forEach(h => h(payload));
    };
  }

  on(event: SocketEvent['type'], handler: Handler) {
    const current = this.handlers.get(event) || [];
    this.handlers.set(event, [...current, handler]);
  }

  off(event: SocketEvent['type'], handler: Handler) {
    const current = this.handlers.get(event) || [];
    this.handlers.set(event, current.filter(h => h !== handler));
  }

  emit(type: SocketEvent['type'], payload: any) {
    // In a real app, this would be: this.socket.emit(type, payload)
    this.channel.postMessage({ type, payload });
    
    // Also trigger locally for the same tab
    const typeHandlers = this.handlers.get(type) || [];
    typeHandlers.forEach(h => h(payload));
  }
}

export const socket = new SocketService();
