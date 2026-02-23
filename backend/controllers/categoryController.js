import { validationResult } from 'express-validator';
import Category from '../models/Category.js';

export const getCategories = async (req, res) => {
  try {
    const { isActive, parent } = req.query;
    const query = {};
    if (isActive !== undefined) query.isActive = isActive === 'true';
    if (parent !== undefined) {
      if (parent === '' || parent === 'null') query.parent = null;
      else query.parent = parent;
    }

    const categories = await Category.find(query).populate('parent', 'name slug').sort({ name: 1 }).lean();
    res.json({ success: true, data: categories });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const getCategoryById = async (req, res) => {
  try {
    const category = await Category.findById(req.params.id).populate('parent', 'name slug').lean();
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, data: category });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const createCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { name, description, image, isActive, showOnHomepage, parent } = req.body;
    let slug = (name || '').toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || name?.toLowerCase();
    const parentId = parent && parent !== '' ? parent : null;

    if (parentId) {
      const parentCat = await Category.findById(parentId).lean();
      if (parentCat) slug = `${parentCat.slug}-${slug}`;
    }

    const category = await Category.create({
      parent: parentId,
      name: name.trim(),
      slug,
      description: description?.trim(),
      image: image?.trim() || undefined,
      isActive: isActive !== false,
      showOnHomepage: !!showOnHomepage,
    });
    const populated = await Category.findById(category._id).populate('parent', 'name slug').lean();
    res.status(201).json({ success: true, data: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Category with this name/slug already exists under this parent' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCategory = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ success: false, errors: errors.array() });
    }
    const { name, description, image, isActive, showOnHomepage, parent } = req.body;
    const updates = {};
    if (name !== undefined) updates.name = name.trim();
    if (description !== undefined) updates.description = description?.trim();
    if (image !== undefined) updates.image = image?.trim() || undefined;
    if (isActive !== undefined) updates.isActive = isActive;
    if (showOnHomepage !== undefined) updates.showOnHomepage = showOnHomepage;
    if (parent !== undefined) updates.parent = parent && parent !== '' ? parent : null;

    const existing = await Category.findById(req.params.id).lean();
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    if (name !== undefined) {
      let slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') || name.toLowerCase();
      const parentId = updates.parent !== undefined ? updates.parent : existing.parent;
      if (parentId) {
        const parentCat = await Category.findById(parentId).lean();
        if (parentCat) slug = `${parentCat.slug}-${slug}`;
      }
      updates.slug = slug;
    }

    const category = await Category.findByIdAndUpdate(
      req.params.id,
      updates,
      { returnDocument: 'after', runValidators: true }
    );
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const populated = await Category.findById(category._id).populate('parent', 'name slug').lean();
    res.json({ success: true, data: populated });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ success: false, message: 'Category with this name/slug already exists under this parent' });
    }
    res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const hasChildren = await Category.exists({ parent: req.params.id });
    if (hasChildren) {
      return res.status(400).json({ success: false, message: 'Cannot delete category that has subcategories. Remove or reassign subcategories first.' });
    }
    const category = await Category.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.json({ success: true, message: 'Category deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
