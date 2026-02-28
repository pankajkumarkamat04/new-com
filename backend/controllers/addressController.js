import Address from '../models/Address.js';

export const list = async (req, res) => {
  try {
    const addresses = await Address.find({ userId: req.user._id })
      .sort({ isDefault: -1, createdAt: -1 })
      .lean();
    res.json({ success: true, data: addresses });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const create = async (req, res) => {
  try {
    const { label, name, address, city, state, zip, phone, country, customFields, isDefault } = req.body;
    if (!name?.trim() || !address?.trim() || !city?.trim() || !zip?.trim() || !phone?.trim()) {
      return res.status(400).json({ success: false, message: 'Name, address, city, zip and phone are required.' });
    }
    const normalizedCustomFields = Array.isArray(customFields)
      ? customFields
          .filter((f) => f && (f.key || f.label) && f.value)
          .map((f) => ({
            key: String(f.key || '').trim(),
            label: String(f.label || '').trim() || String(f.key || '').trim(),
            value: String(f.value || '').trim(),
          }))
      : [];
    const doc = {
      userId: req.user._id,
      label: (label && String(label).trim()) || '',
      name: String(name).trim(),
      address: String(address).trim(),
      city: String(city).trim(),
      state: (state && String(state).trim()) || '',
      zip: String(zip).trim(),
      phone: String(phone).trim(),
      country: (country && String(country).trim()) || 'IN',
      customFields: normalizedCustomFields,
      isDefault: !!isDefault,
    };
    if (doc.isDefault) {
      await Address.updateMany({ userId: req.user._id }, { $set: { isDefault: false } });
    }
    const created = await Address.create(doc);
    res.status(201).json({ success: true, data: created.toObject ? created.toObject() : created });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const update = async (req, res) => {
  try {
    const { label, name, address, city, state, zip, phone, country, customFields, isDefault } = req.body;
    const existing = await Address.findOne({ _id: req.params.id, userId: req.user._id });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    if (name !== undefined) existing.name = String(name).trim();
    if (address !== undefined) existing.address = String(address).trim();
    if (city !== undefined) existing.city = String(city).trim();
    if (state !== undefined) existing.state = String(state).trim();
    if (zip !== undefined) existing.zip = String(zip).trim();
    if (phone !== undefined) existing.phone = String(phone).trim();
    if (country !== undefined) existing.country = (country && String(country).trim()) || 'IN';
    if (label !== undefined) existing.label = (label && String(label).trim()) || '';
    if (Array.isArray(customFields)) {
      existing.customFields = customFields
        .filter((f) => f && (f.key || f.label) && f.value)
        .map((f) => ({
          key: String(f.key || '').trim(),
          label: String(f.label || '').trim() || String(f.key || '').trim(),
          value: String(f.value || '').trim(),
        }));
    }
    if (isDefault === true) {
      await Address.updateMany({ userId: req.user._id }, { $set: { isDefault: false } });
      existing.isDefault = true;
    } else if (isDefault === false) {
      existing.isDefault = false;
    }
    await existing.save();
    res.json({ success: true, data: existing.toObject ? existing.toObject() : existing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const remove = async (req, res) => {
  try {
    const deleted = await Address.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    res.json({ success: true, message: 'Address deleted.' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const setDefault = async (req, res) => {
  try {
    const existing = await Address.findOne({ _id: req.params.id, userId: req.user._id });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Address not found.' });
    }
    await Address.updateMany({ userId: req.user._id }, { $set: { isDefault: false } });
    existing.isDefault = true;
    await existing.save();
    res.json({ success: true, data: existing.toObject ? existing.toObject() : existing });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
