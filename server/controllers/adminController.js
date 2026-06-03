import User from '../models/User.js';

// GET /api/admin/users
export const getUsers = async (req, res) => {
  try {
    const allUsers = await User.find({}).select('-passwordHash');
    res.json(allUsers);
  } catch (error) {
    console.error('Fetch admin stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// DELETE /api/admin/users/:userId
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot delete your own admin account!' });
    }

    const userToDelete = await User.findById(userId);
    if (!userToDelete) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToDelete.username === 'ndlhoangndl') {
      return res.status(400).json({ message: 'Cannot delete the master admin account!' });
    }

    await User.findByIdAndDelete(userId);
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// POST /api/admin/users/:userId/role
export const updateUserRole = async (req, res) => {
  try {
    const { userId } = req.params;
    const { role } = req.body;

    if (!['USER', 'ADMIN'].includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    if (userId === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own role!' });
    }

    const userToUpdate = await User.findById(userId);
    if (!userToUpdate) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (userToUpdate.username === 'ndlhoangndl') {
      return res.status(400).json({ message: 'Cannot change the role of the master admin account!' });
    }

    userToUpdate.role = role;
    await userToUpdate.save();

    res.json({ message: `Role updated to ${role}` });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
