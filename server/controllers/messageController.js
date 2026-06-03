import User from '../models/User.js';
import Message from '../models/Message.js';

// GET /api/messages/history/:partnerId
export const getHistory = async (req, res) => {
  try {
    const { partnerId } = req.params;
    const currentUserId = req.user.id;

    let partnerObjectId = partnerId;
    if (partnerId === 'admin') {
      const admin = await User.findOne({ username: 'ndlhoangndl' });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      partnerObjectId = admin._id;
    }

    // Fetch history
    const history = await Message.find({
      $or: [
        { sender: currentUserId, receiver: partnerObjectId },
        { sender: partnerObjectId, receiver: currentUserId }
      ]
    }).sort({ createdAt: 1 });

    // Mark as read ONLY if query param markAsRead is true
    if (req.query.markAsRead === 'true') {
      await Message.updateMany(
        { sender: partnerObjectId, receiver: currentUserId, isRead: false },
        { $set: { isRead: true } }
      );
    }

    res.json(history);
  } catch (error) {
    console.error('Fetch history error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/messages
export const sendMessage = async (req, res) => {
  try {
    const { content } = req.body;
    let { receiverId } = req.body;
    const senderId = req.user.id;

    if (!content || content.trim() === '') {
      return res.status(400).json({ message: 'Message content cannot be empty' });
    }

    // Default receiver to admin if user is a standard user and receiverId is not provided
    if (!receiverId) {
      if (req.user.role === 'ADMIN') {
        return res.status(400).json({ message: 'Receiver ID is required for admins' });
      }
      const admin = await User.findOne({ username: 'ndlhoangndl' });
      if (!admin) {
        return res.status(404).json({ message: 'System Admin account not found' });
      }
      receiverId = admin._id;
    }

    const newMessage = new Message({
      sender: senderId,
      receiver: receiverId,
      content: content.trim()
    });

    await newMessage.save();
    res.status(201).json(newMessage);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// GET /api/messages/admin/threads
export const getAdminThreads = async (req, res) => {
  try {
    const messages = await Message.find({
      $or: [{ sender: req.user.id }, { receiver: req.user.id }]
    })
      .populate('sender receiver', 'username fullName email')
      .sort({ createdAt: 1 });

    const threadsMap = new Map();

    messages.forEach(msg => {
      if (!msg.sender || !msg.receiver) return;

      const senderId = msg.sender._id.toString();
      const receiverId = msg.receiver._id.toString();
      
      const partner = senderId === req.user.id ? msg.receiver : msg.sender;
      const partnerId = partner._id.toString();

      const isUnread = (receiverId === req.user.id && !msg.isRead);

      const existing = threadsMap.get(partnerId);
      if (!existing || msg.createdAt > existing.lastMessageTime) {
        threadsMap.set(partnerId, {
          partnerId,
          username: partner.username,
          fullName: partner.fullName,
          email: partner.email,
          lastMessageContent: msg.content,
          lastMessageTime: msg.createdAt,
          unreadCount: (existing ? existing.unreadCount : 0) + (isUnread ? 1 : 0)
        });
      } else {
        if (isUnread) {
          existing.unreadCount++;
        }
      }
    });

    const threads = Array.from(threadsMap.values()).sort((a, b) => b.lastMessageTime - a.lastMessageTime);
    res.json(threads);
  } catch (error) {
    console.error('Fetch threads error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/messages/read/:partnerId
export const markAsRead = async (req, res) => {
  try {
    const { partnerId } = req.params;
    
    let partnerObjectId = partnerId;
    if (partnerId === 'admin') {
      const admin = await User.findOne({ username: 'ndlhoangndl' });
      if (!admin) {
        return res.status(404).json({ message: 'Admin not found' });
      }
      partnerObjectId = admin._id;
    }

    await Message.updateMany(
      { sender: partnerObjectId, receiver: req.user.id, isRead: false },
      { $set: { isRead: true } }
    );
    res.json({ message: 'Messages marked as read' });
  } catch (error) {
    console.error('Mark read error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
