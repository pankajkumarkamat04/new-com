import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import Admin from '../../models/Admin.js';
import { saveOtp, verifyOtp } from '../../utils/otp.js';
import { sendOtp } from '../../utils/sendOtp.js';

const generateToken = (id) => {
  return jwt.sign(
    { id, type: 'admin' },
    process.env.JWT_SECRET || 'jwt-secret-key',
    { expiresIn: '7d' }
  );
};

export const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      admin: {
        id: req.admin._id,
        name: req.admin.name,
        email: req.admin.email,
        phone: req.admin.phone,
        role: req.admin.role || 'admin',
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const signup = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, phone, password } = req.body;

    const existing = await Admin.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone }] : []),
      ].filter(Boolean),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: email && existing.email === email.toLowerCase()
          ? 'Email already registered'
          : 'Phone already registered',
      });
    }

    const admin = await Admin.create({
      name,
      email: email?.toLowerCase(),
      phone: phone || undefined,
      password: password || undefined,
    });

    const token = generateToken(admin._id);
    res.status(201).json({
      success: true,
      message: 'Admin registered successfully',
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginPassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, phone, password } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    const admin = await Admin.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone }] : []),
      ].filter(Boolean),
    }).select('+password');

    if (!admin) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!admin.password) {
      return res.status(400).json({
        success: false,
        message: 'Account uses OTP login. Please use OTP to sign in.',
      });
    }

    const match = await admin.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(admin._id);
    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const requestOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    const identifier = email || phone;
    const type = email ? 'email' : 'phone';

    const admin = await Admin.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone }] : []),
      ].filter(Boolean),
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found. Please sign up first.' });
    }

    const otp = await saveOtp(identifier, type, 'admin');
    await sendOtp(identifier, otp, type);

    res.json({
      success: true,
      message: `OTP sent to your ${type}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const loginOtp = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { email, phone, otp } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    const identifier = email || phone;

    const valid = await verifyOtp(identifier, otp, 'admin');
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const admin = await Admin.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(phone ? [{ phone }] : []),
      ].filter(Boolean),
    });

    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }

    const token = generateToken(admin._id);
    res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        name: admin.name,
        email: admin.email,
        phone: admin.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
