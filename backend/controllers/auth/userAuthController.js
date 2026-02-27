import jwt from 'jsonwebtoken';
import { validationResult } from 'express-validator';
import User from '../../models/User.js';
import Settings from '../../models/Settings.js';
import { saveOtp, verifyOtp } from '../../utils/otp.js';
import { sendOtp } from '../../utils/sendOtp.js';
import { sendNotification } from '../../utils/notificationService.js';
import { normalizePhoneTo10Digits } from '../../utils/phone.js';

async function getLoginSettings() {
  const settings = await Settings.getSettings();
  const l = settings.login || {};
  return {
    loginIdentifier: l.loginIdentifier === 'phone' ? 'phone' : 'email',
    loginMethod: l.loginMethod === 'otp' ? 'otp' : 'password',
  };
}

const generateToken = (id) => {
  return jwt.sign(
    { id, type: 'user' },
    process.env.JWT_SECRET || 'jwt-secret-key',
    { expiresIn: '7d' }
  );
};

export const getMe = async (req, res) => {
  try {
    res.json({
      success: true,
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }

    const { name, email, phone } = req.body;

    if (!email && !phone) {
      return res.status(400).json({ success: false, message: 'Either email or phone is required' });
    }

    const user = req.user;

    if (name !== undefined && name.trim()) user.name = name.trim();
    if (email !== undefined) user.email = email ? email.toLowerCase() : undefined;
    if (phone !== undefined) {
      const normalized = phone ? normalizePhoneTo10Digits(phone) : null;
      if (phone && !normalized) {
        return res.status(400).json({ success: false, message: 'Phone must be a valid 10-digit number (digits only, no country code or leading zero).' });
      }
      user.phone = normalized || undefined;
    }

    if (!user.email && !user.phone) {
      return res.status(400).json({ success: false, message: 'Either email or phone is required' });
    }

    const existing = await User.findOne({
      _id: { $ne: user._id },
      $or: [
        ...(user.email ? [{ email: user.email }] : []),
        ...(user.phone ? [{ phone: user.phone }] : []),
      ].filter(Boolean),
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: existing.email === user.email ? 'Email already in use' : 'Phone already in use',
      });
    }

    await user.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
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

    const normalizedPhone = phone ? normalizePhoneTo10Digits(phone) : null;
    if (phone && !normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Phone must be a valid 10-digit number (digits only, no country code or leading zero).' });
    }

    if (!email && !normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    const existing = await User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
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

    const user = await User.create({
      name,
      email: email?.toLowerCase() || undefined,
      phone: normalizedPhone || undefined,
      password: password || undefined,
    });

    sendNotification({
      email: user.email || undefined,
      phone: user.phone || undefined,
      type: 'signup',
      data: { userName: user.name },
    });

    const token = generateToken(user._id);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
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

    const normalizedPhone = phone ? normalizePhoneTo10Digits(phone) : null;
    if (loginCfg.loginIdentifier === 'phone' && phone && !normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Phone must be a valid 10-digit number.' });
    }
    if (!email && !normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    const loginCfg = await getLoginSettings();
    if (loginCfg.loginMethod !== 'password') {
      return res.status(400).json({ success: false, message: 'Password login is disabled. Please use OTP to sign in.' });
    }
    if (loginCfg.loginIdentifier === 'email' && phone) {
      return res.status(400).json({ success: false, message: 'Login with phone is disabled. Use email.' });
    }
    if (loginCfg.loginIdentifier === 'phone' && email) {
      return res.status(400).json({ success: false, message: 'Login with email is disabled. Use phone.' });
    }
    if (loginCfg.loginIdentifier === 'email' && !email) {
      return res.status(400).json({ success: false, message: 'Email is required.' });
    }
    if (loginCfg.loginIdentifier === 'phone' && !normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Phone is required.' });
    }

    const user = await User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ].filter(Boolean),
    }).select('+password');

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Account uses OTP login. Please use OTP to sign in.',
      });
    }

    const match = await user.comparePassword(password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
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

    const normalizedPhone = phone ? normalizePhoneTo10Digits(phone) : null;
    if (!email && !normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    const loginCfg = await getLoginSettings();
    if (loginCfg.loginMethod !== 'otp') {
      return res.status(400).json({ success: false, message: 'OTP login is disabled.' });
    }
    if (loginCfg.loginIdentifier === 'email' && (phone || !email)) {
      return res.status(400).json({ success: false, message: 'Login with email only. Provide your email.' });
    }
    if (loginCfg.loginIdentifier === 'phone' && (email || !normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Login with phone only. Provide your phone.' });
    }

    const identifier = email || normalizedPhone;
    const type = email ? 'email' : 'phone';

    const user = await User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ].filter(Boolean),
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please sign up first.' });
    }

    const otp = await saveOtp(identifier, type, 'user');
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

    const normalizedPhone = phone ? normalizePhoneTo10Digits(phone) : null;
    if (!email && !normalizedPhone) {
      return res.status(400).json({ success: false, message: 'Email or phone is required' });
    }

    const loginCfg = await getLoginSettings();
    if (loginCfg.loginMethod !== 'otp') {
      return res.status(400).json({ success: false, message: 'OTP login is disabled.' });
    }
    if (loginCfg.loginIdentifier === 'email' && (phone || !email)) {
      return res.status(400).json({ success: false, message: 'Login with email only. Provide your email.' });
    }
    if (loginCfg.loginIdentifier === 'phone' && (email || !normalizedPhone)) {
      return res.status(400).json({ success: false, message: 'Login with phone only. Provide your phone.' });
    }

    const identifier = email || normalizedPhone;

    const valid = await verifyOtp(identifier, otp, 'user');
    if (!valid) {
      return res.status(400).json({ success: false, message: 'Invalid or expired OTP' });
    }

    const user = await User.findOne({
      $or: [
        ...(email ? [{ email: email.toLowerCase() }] : []),
        ...(normalizedPhone ? [{ phone: normalizedPhone }] : []),
      ].filter(Boolean),
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const token = generateToken(user._id);
    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        phone: user.phone,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
