// OTP sending utilities
// For production: integrate nodemailer (email) and Twilio (SMS)

async function sendEmailOtp(email, otp) {
  // TODO: Integrate nodemailer for production
  // For development - log to console
  console.log(`[DEV] Email OTP for ${email}: ${otp}`);
  return true;
}

async function sendPhoneOtp(phone, otp) {
  // TODO: Integrate Twilio for production
  // For development - log to console
  console.log(`[DEV] SMS OTP for ${phone}: ${otp}`);
  return true;
}

export async function sendOtp(identifier, otp, type) {
  if (type === 'email') {
    return sendEmailOtp(identifier, otp);
  }
  return sendPhoneOtp(identifier, otp);
}

export { sendEmailOtp, sendPhoneOtp };
