const User = require('../models/User');

// Get pending users based on approver's role
exports.getPendingUsers = async (req, res) => {
    try {
        const { role, _id, instituteId } = req.user;
        let query = { status: 'pending' };

        // Role-based filtering
        if (role === 'admin') {
            // Admin sees all pending users (or filter by query param)
            if (req.query.role) {
                query.role = req.query.role;
            }
        } else if (role === 'institute') {
            // Institute sees pending teachers and students linked to their institute
            query.role = { $in: ['teacher', 'student'] };
            query.instituteId = _id; // Assuming institute users have their own ID as instituteId or similar logic
            // Note: If 'institute' is a role of a User, then students/teachers should have instituteId pointing to this User's ID
        } else if (role === 'teacher') {
            // Teacher sees pending students linked to them
            query.role = 'student';
            query.teacherId = _id;
        } else {
            return res.status(403).json({ message: 'Unauthorized to view pending users' });
        }

        const users = await User.find(query).select('-password');
        res.json(users);
    } catch (error) {
        console.error('Error fetching pending users:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Approve a user
exports.approveUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const approver = req.user;

        const userToApprove = await User.findById(userId);
        if (!userToApprove) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Permission check
        if (!canApprove(approver, userToApprove)) {
            return res.status(403).json({ message: 'You do not have permission to approve this user' });
        }

        userToApprove.status = 'active';
        userToApprove.approvedBy = approver._id;
        userToApprove.approvedAt = Date.now();
        userToApprove.rejectionReason = null; // Clear any previous rejection reason

        // Auto-assign student to approving teacher if not already assigned
        if (!userToApprove.teacherId && approver.role === 'teacher' && userToApprove.role === 'student') {
            userToApprove.teacherId = approver._id;
        }

        await userToApprove.save();

        res.json({ message: 'User approved successfully', user: userToApprove });
    } catch (error) {
        console.error('Error approving user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Reject a user
exports.rejectUser = async (req, res) => {
    try {
        const { userId } = req.params;
        const { reason } = req.body;
        const approver = req.user;

        const userToReject = await User.findById(userId);
        if (!userToReject) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Permission check
        if (!canApprove(approver, userToReject)) {
            return res.status(403).json({ message: 'You do not have permission to reject this user' });
        }

        userToReject.status = 'rejected';
        userToReject.rejectionReason = reason || 'No reason provided';
        // We might want to keep approvedBy null or set it to rejector? 
        // Let's keep approvedBy null as they are not approved. 
        // Maybe we need rejectedBy? For now, let's just update status.

        await userToReject.save();

        res.json({ message: 'User rejected successfully', user: userToReject });
    } catch (error) {
        console.error('Error rejecting user:', error);
        res.status(500).json({ message: 'Server error' });
    }
};

// Helper function to check permissions
const canApprove = (approver, targetUser) => {
    const approverRole = approver.role;
    const targetRole = targetUser.role;

    if (approverRole === 'admin') {
        return ['institute', 'teacher', 'student'].includes(targetRole);
    }

    if (approverRole === 'institute') {
        // Institute can approve teachers and students belonging to it
        // Check if target belongs to this institute
        // For now, assuming simple role check, but ideally check instituteId match
        if (['teacher', 'student'].includes(targetRole)) {
            // If target has instituteId, it must match approver's ID
            if (targetUser.instituteId && targetUser.instituteId.toString() !== approver._id.toString()) {
                return false;
            }
            return true;
        }
        return false;
    }

    if (approverRole === 'teacher') {
        // Teacher can approve students belonging to them
        if (targetRole === 'student') {
            if (targetUser.teacherId && targetUser.teacherId.toString() !== approver._id.toString()) {
                return false;
            }
            return true;
        }
        return false;
    }

    return false;
};
