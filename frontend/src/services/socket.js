// ✅ CORRECT
import io from 'socket.io-client';
const socket = io('http://localhost:5000', {
  transports: ['websocket', 'polling'],
  secure: true
});

export default socket;