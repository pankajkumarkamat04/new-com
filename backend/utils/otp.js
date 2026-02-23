import Otp from '../models/Otp.js';

export const OTP_EXPIRY_MINUTES = 10;
const OTP_LENGTH = 6;

function generateOtp() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function saveOtp(identifier, type, userType) {
  const otp = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

  await Otp.deleteMany({ identifier, userType });

  await Otp.create({
    identifier: identifier.toLowerCase ? identifier.toLowerCase() : identifier,
    otp,
    type,
    userType,
    expiresAt,
  });

  return otp;
}

export async function verifyOtp(identifier, otp, userType) {
  const record = await Otp.findOne({
    identifier: identifier.toLowerCase ? identifier.toLowerCase() : identifier,
    otp,
    userType,
    expiresAt: { $gt: new Date() },
  });

  if (!record) return false;
  await Otp.deleteOne({ _id: record._id });
  return true;
}
