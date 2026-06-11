const { Server } = require('socket.io');

let io;

const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: process.env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true
    }
  });

  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    // Customer joins their personal room for live updates
    socket.on('join_customer', (customerId) => {
      socket.join(`customer_${customerId}`);
      console.log(`Customer ${customerId} joined tracking room`);
    });

    // Technician joins their job room
    socket.on('join_technician', (technicianId) => {
      socket.join(`tech_${technicianId}`);
    });

    // Admin joins global room
    socket.on('join_admin', () => {
      socket.join('admin_room');
    });

    // Tracking by reference number (public)
    socket.on('track_vehicle', (trackingRef) => {
      socket.join(`track_${trackingRef}`);
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });

  return io;
};

const getIO = () => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

// Helper: notify customer of repair update
const notifyCustomer = (customerId, data) => {
  if (io) io.to(`customer_${customerId}`).emit('repair_update', data);
};

// Helper: notify tracking room
const notifyTracking = (trackingRef, data) => {
  if (io) io.to(`track_${trackingRef}`).emit('progress_update', data);
};

module.exports = { initSocket, getIO, notifyCustomer, notifyTracking };
