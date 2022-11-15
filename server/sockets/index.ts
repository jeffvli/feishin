import { Socket, Server } from 'socket.io';

export const sockets = (socket: Socket, io: Server) => {
  socket.on('join', function (data) {
    socket.join(data.id); // We are using room of socket io
  });

  socket.broadcast.emit('user:receive:connect', {
    socketId: socket.id,
    userId: socket.handshake.query.id,
    userName: socket.handshake.query.username,
  });

  socket.on('disconnect', async () => {
    socket.broadcast.emit('user:receive:disconnect', {
      socketId: socket.id,
      userId: socket.handshake.query.id,
      userName: socket.handshake.query.username,
    });
  });

  socket.on('user:send:get_online', async (data) => {
    const sockets = await io.fetchSockets();
    const onlineSockets = sockets?.map((s) => s.handshake.query.id) || [];

    io.sockets
      .in(data?.userId)
      .emit('user:receive:get_online', { online: onlineSockets });
  });

  socket.on('user:send:change_song', async (data) => {
    socket.broadcast.emit('user:receive:change_song', {
      ...data,
      user: { ...data.user, socketId: socket.id },
    });
  });

  socket.on('user:send:status_idle', async (data) => {
    socket.broadcast.emit('user:receive:status_idle', {
      status: 'idle',
      user: { ...data.user, socketId: socket.id },
    });
  });

  socket.on('user:send:status_playing', async (data) => {
    socket.broadcast.emit('user:receive:status_playing', {
      status: 'playing',
      user: { ...data.user, socketId: socket.id },
    });
  });
};
