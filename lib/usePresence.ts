'use client';

import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { API_URL } from './api';

let socket: Socket | null = null;

/** Live count of people currently on the site (real WebSocket presence). */
export function usePresence(): number {
  const [online, setOnline] = useState(0);

  useEffect(() => {
    if (!socket) {
      socket = io(API_URL, { transports: ['websocket', 'polling'] });
    }
    const onCount = (n: number) => setOnline(n);
    socket.on('online', onCount);
    return () => {
      socket?.off('online', onCount);
    };
  }, []);

  return online;
}
