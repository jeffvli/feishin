import { Socket } from 'socket.io';

export const sockets = (socket: Socket) => {
  socket.broadcast.emit('user:connected', {
    userID: socket.id,
    username: socket.handshake.query.username,
  });

  socket.on('disconnect', () => {
    socket.broadcast.emit('user:disconnected', {
      userID: socket.id,
      username: socket.handshake.query.username,
    });
  });
};
