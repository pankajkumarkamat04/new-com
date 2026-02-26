import { validationResult } from 'express-validator';
import bcrypt from 'bcryptjs';
import Admin from '../models/Admin.js';

export const listAdmins = async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (search && typeof search === 'string' && search.trim()) {
      const s = search.trim();
      query.$or = [
        { name: { $regex: s, $options: 'i' } },
        { email: { $regex: s, $options: 'i' } },
        { phone: { $regex: s, $options: 'i' } },
      ];
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    const [admins, total] = await Promise.all([
      Admin.find(query).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Admin.countDocuments(query),
    ]);

    res.json({
      success: true,
      data: admins,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        pages: Math.ceil(total / limitNum),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, phone, password, role } = req.body;

    const existing = await Admin.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Email already registered' });
    }

    const admin = await Admin.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      phone: phone?.trim() || undefined,
      password: password?.trim() || undefined,
      role: role === 'superadmin' ? 'superadmin' : 'admin',
    });

    const adminObj = admin.toObject();
    delete adminObj.password;

    res.status(201).json({ success: true, data: adminObj });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateAdmin = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, phone, password, role, isActive } = req.body;
    const targetId = req.params.id;

    const target = await Admin.findById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (target.role === 'superadmin' && target._id.toString() !== req.admin._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot modify another superadmin' });
    }

    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (email !== undefined) {
      const newEmail = email.toLowerCase().trim();
      const existing = await Admin.findOne({ email: newEmail, _id: { $ne: targetId } });
      if (existing) {
        return res.status(400).json({ success: false, message: 'Email already registered' });
      }
      updates.email = newEmail;
    }
    if (phone !== undefined) updates.phone = phone?.trim() || undefined;
    if (role !== undefined && target._id.toString() !== req.admin._id.toString()) {
      updates.role = role === 'superadmin' ? 'superadmin' : 'admin';
    }
    if (isActive !== undefined && target._id.toString() !== req.admin._id.toString()) {
      if (target.role === 'superadmin') {
        return res.status(403).json({ success: false, message: 'Cannot deactivate a superadmin' });
      }
      updates.isActive = !!isActive;
    }
    if (password !== undefined && password?.trim()) {
      updates.password = await bcrypt.hash(password.trim(), 12);
    }

    const admin = await Admin.findByIdAndUpdate(
      targetId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password').lean();

    res.json({ success: true, data: admin });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteAdmin = async (req, res) => {
  try {
    const targetId = req.params.id;

    const target = await Admin.findById(targetId);
    if (!target) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    if (target.role === 'superadmin') {
      return res.status(403).json({ success: false, message: 'Cannot delete a superadmin' });
    }

    if (target._id.toString() === req.admin._id.toString()) {
      return res.status(403).json({ success: false, message: 'Cannot delete your own account' });
    }

    await Admin.findByIdAndDelete(targetId);
    res.json({ success: true, message: 'Admin deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
