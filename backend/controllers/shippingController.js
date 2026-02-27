import ShippingZone from '../models/ShippingZone.js';
import ShippingMethod from '../models/ShippingMethod.js';
import Settings from '../models/Settings.js';

/**
 * Match address to a zone. Returns first matching zone by sortOrder.
 * country: ISO 2-letter (e.g. IN, US). state and zip optional.
 */
function findZoneForAddress(zones, country, state, zip) {
  const countryUpper = (country || '').trim().toUpperCase();
  const stateTrim = (state || '').trim();
  const zipTrim = (zip || '').trim();

  for (const zone of zones) {
    const codes = zone.countryCodes || [];
    const allCountries = codes.length === 0 || codes.includes('*');
    const countryMatch = allCountries || codes.some((c) => (c || '').toUpperCase() === countryUpper);
    if (!countryMatch) continue;

    if (Array.isArray(zone.stateCodes) && zone.stateCodes.length > 0) {
      const stateMatch = zone.stateCodes.some((s) => (s || '').trim().toLowerCase() === stateTrim.toLowerCase());
      if (!stateMatch) continue;
    }

    if (Array.isArray(zone.zipPrefixes) && zone.zipPrefixes.length > 0 && zipTrim) {
      const zipMatch = zone.zipPrefixes.some((p) => (zipTrim || '').startsWith((p || '').trim()));
      if (!zipMatch) continue;
    }

    return zone;
  }
  return null;
}

/**
 * Calculate shipping cost for a method given subtotal and item count.
 */
function calculateMethodCost(method, subtotal, itemCount) {
  if (method.minOrderForFree > 0 && subtotal >= method.minOrderForFree) {
    return 0;
  }
  const rateValue = method.rateValue ?? 0;
  switch (method.rateType) {
    case 'per_item':
      return Math.round(rateValue * itemCount * 100) / 100;
    case 'per_order':
    case 'flat':
    default:
      return rateValue;
  }
}

// ============ Public: get shipping options for address ============
export const getShippingOptions = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    if (!settings.shippingEnabled) {
      return res.json({ success: true, data: { enabled: false, methods: [] } });
    }

    const { country = '', state = '', zip = '', city = '' } = req.query;
    const subtotal = Math.max(0, parseFloat(req.query.subtotal) || 0);
    const itemCount = Math.max(0, parseInt(req.query.itemCount, 10) || 0);

    const zones = await ShippingZone.find({ isActive: true }).sort({ sortOrder: 1 }).lean();
    const zone = findZoneForAddress(zones, country, state, zip);

    // No zones configured or no zone matches: use 0 shipping (free)
    if (!zone) {
      return res.json({
        success: true,
        data: {
          enabled: true,
          zoneMatched: false,
          methods: [],
          useZeroShipping: true,
          message: zones.length === 0
            ? 'No shipping zones configured. Shipping will be free.'
            : 'No shipping zone matches this address. Shipping will be free.',
        },
      });
    }

    const methods = await ShippingMethod.find({ zoneId: zone._id, isActive: true })
      .sort({ sortOrder: 1 })
      .lean();

    const options = methods.map((m) => {
      const amount = calculateMethodCost(m, subtotal, itemCount);
      return {
        _id: m._id,
        name: m.name,
        description: m.description || '',
        rateType: m.rateType,
        rateValue: m.rateValue,
        minOrderForFree: m.minOrderForFree || 0,
        estimatedDaysMin: m.estimatedDaysMin,
        estimatedDaysMax: m.estimatedDaysMax,
        amount: Math.round(amount * 100) / 100,
      };
    });

    // Zone exists but has no methods: use 0 shipping (free)
    if (options.length === 0) {
      return res.json({
        success: true,
        data: {
          enabled: true,
          zoneMatched: true,
          zoneId: zone._id,
          zoneName: zone.name,
          methods: [],
          useZeroShipping: true,
          message: 'No shipping methods in this zone. Shipping will be free.',
        },
      });
    }

    res.json({
      success: true,
      data: {
        enabled: true,
        zoneMatched: true,
        zoneId: zone._id,
        zoneName: zone.name,
        methods: options,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Admin: zones CRUD ============
export const adminListZones = async (req, res) => {
  try {
    const zones = await ShippingZone.find().sort({ sortOrder: 1 }).lean();
    res.json({ success: true, data: zones });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminCreateZone = async (req, res) => {
  try {
    const { name, description, countryCodes, stateCodes, zipPrefixes, sortOrder, isActive } = req.body;
    const zone = await ShippingZone.create({
      name: (name || '').trim() || 'New Zone',
      description: (description || '').trim(),
      countryCodes: Array.isArray(countryCodes) ? countryCodes.map((c) => (c || '').trim().toUpperCase()).filter(Boolean) : ['*'],
      stateCodes: Array.isArray(stateCodes) ? stateCodes.map((s) => (s || '').trim()).filter(Boolean) : [],
      zipPrefixes: Array.isArray(zipPrefixes) ? zipPrefixes.map((z) => (z || '').trim()).filter(Boolean) : [],
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      isActive: isActive !== false,
    });
    res.status(201).json({ success: true, data: zone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminUpdateZone = async (req, res) => {
  try {
    const { name, description, countryCodes, stateCodes, zipPrefixes, sortOrder, isActive } = req.body;
    const update = {};
    if (name !== undefined) update.name = (name || '').trim() || 'New Zone';
    if (description !== undefined) update.description = (description || '').trim();
    if (countryCodes !== undefined) {
      update.countryCodes = Array.isArray(countryCodes) ? countryCodes.map((c) => (c || '').trim().toUpperCase()).filter(Boolean) : ['*'];
    }
    if (stateCodes !== undefined) {
      update.stateCodes = Array.isArray(stateCodes) ? stateCodes.map((s) => (s || '').trim()).filter(Boolean) : [];
    }
    if (zipPrefixes !== undefined) {
      update.zipPrefixes = Array.isArray(zipPrefixes) ? zipPrefixes.map((z) => (z || '').trim()).filter(Boolean) : [];
    }
    if (sortOrder !== undefined) update.sortOrder = typeof sortOrder === 'number' ? sortOrder : 0;
    if (isActive !== undefined) update.isActive = isActive !== false;

    const zone = await ShippingZone.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    res.json({ success: true, data: zone });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminDeleteZone = async (req, res) => {
  try {
    const zone = await ShippingZone.findByIdAndDelete(req.params.id);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });
    await ShippingMethod.deleteMany({ zoneId: zone._id });
    res.json({ success: true, message: 'Zone and its methods deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============ Admin: methods by zone ============
export const adminListMethods = async (req, res) => {
  try {
    const methods = await ShippingMethod.find({ zoneId: req.params.zoneId }).sort({ sortOrder: 1 }).lean();
    res.json({ success: true, data: methods });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminCreateMethod = async (req, res) => {
  try {
    const zoneId = req.params.zoneId;
    const zone = await ShippingZone.findById(zoneId);
    if (!zone) return res.status(404).json({ success: false, message: 'Zone not found' });

    const {
      name, description, rateType, rateValue, minOrderForFree,
      estimatedDaysMin, estimatedDaysMax, sortOrder, isActive,
    } = req.body;

    const method = await ShippingMethod.create({
      zoneId,
      name: (name || '').trim() || 'New Method',
      description: (description || '').trim(),
      rateType: ['flat', 'per_item', 'per_order'].includes(rateType) ? rateType : 'flat',
      rateValue: Math.max(0, parseFloat(rateValue) || 0),
      minOrderForFree: Math.max(0, parseFloat(minOrderForFree) || 0),
      estimatedDaysMin: typeof estimatedDaysMin === 'number' ? estimatedDaysMin : undefined,
      estimatedDaysMax: typeof estimatedDaysMax === 'number' ? estimatedDaysMax : undefined,
      sortOrder: typeof sortOrder === 'number' ? sortOrder : 0,
      isActive: isActive !== false,
    });
    res.status(201).json({ success: true, data: method });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminUpdateMethod = async (req, res) => {
  try {
    const {
      name, description, rateType, rateValue, minOrderForFree,
      estimatedDaysMin, estimatedDaysMax, sortOrder, isActive,
    } = req.body;
    const update = {};
    if (name !== undefined) update.name = (name || '').trim() || 'New Method';
    if (description !== undefined) update.description = (description || '').trim();
    if (rateType !== undefined) update.rateType = ['flat', 'per_item', 'per_order'].includes(rateType) ? rateType : 'flat';
    if (rateValue !== undefined) update.rateValue = Math.max(0, parseFloat(rateValue) || 0);
    if (minOrderForFree !== undefined) update.minOrderForFree = Math.max(0, parseFloat(minOrderForFree) || 0);
    if (estimatedDaysMin !== undefined) update.estimatedDaysMin = typeof estimatedDaysMin === 'number' ? estimatedDaysMin : undefined;
    if (estimatedDaysMax !== undefined) update.estimatedDaysMax = typeof estimatedDaysMax === 'number' ? estimatedDaysMax : undefined;
    if (sortOrder !== undefined) update.sortOrder = typeof sortOrder === 'number' ? sortOrder : 0;
    if (isActive !== undefined) update.isActive = isActive !== false;

    const method = await ShippingMethod.findByIdAndUpdate(req.params.id, { $set: update }, { new: true, runValidators: true });
    if (!method) return res.status(404).json({ success: false, message: 'Method not found' });
    res.json({ success: true, data: method });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const adminDeleteMethod = async (req, res) => {
  try {
    const method = await ShippingMethod.findByIdAndDelete(req.params.id);
    if (!method) return res.status(404).json({ success: false, message: 'Method not found' });
    res.json({ success: true, message: 'Method deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
