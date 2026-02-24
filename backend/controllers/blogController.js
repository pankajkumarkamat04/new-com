import Blog from '../models/Blog.js';
import Settings from '../models/Settings.js';

// Public: list published blog posts
export const listPublicPosts = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    if (!settings.blogEnabled) {
      return res.status(404).json({ success: false, message: 'Blog is disabled' });
    }

    const { page = 1, limit = 10 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10) || 10));
    const skip = (pageNum - 1) * limitNum;

    const [posts, total] = await Promise.all([
      Blog.find({ isPublished: true })
        .sort({ publishedAt: -1, createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Blog.countDocuments({ isPublished: true }),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Public: get single published post by slug
export const getPublicPostBySlug = async (req, res) => {
  try {
    const settings = await Settings.getSettings();
    if (!settings.blogEnabled) {
      return res.status(404).json({ success: false, message: 'Blog is disabled' });
    }

    const { slug } = req.params;
    const post = await Blog.findOne({ slug: slug.toLowerCase().trim(), isPublished: true }).lean();
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: list all posts
export const adminListPosts = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
    const skip = (pageNum - 1) * limitNum;

    const [posts, total] = await Promise.all([
      Blog.find().sort({ createdAt: -1 }).skip(skip).limit(limitNum).lean(),
      Blog.countDocuments(),
    ]);

    res.json({
      success: true,
      data: posts,
      pagination: { page: pageNum, limit: limitNum, total, pages: Math.ceil(total / limitNum) },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: get single post by id
export const adminGetPost = async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id).lean();
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: create post
export const adminCreatePost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, image, tags, isPublished, publishedAt } = req.body;
    if (!title || !String(title).trim()) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }
    if (!content || !String(content).trim()) {
      return res.status(400).json({ success: false, message: 'Content is required' });
    }
    const finalSlug = (slug || title)
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const existing = await Blog.findOne({ slug: finalSlug });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Slug already exists' });
    }

    const post = await Blog.create({
      title: String(title).trim(),
      slug: finalSlug,
      excerpt: excerpt ? String(excerpt).trim() : undefined,
      content: String(content),
      image: image ? String(image).trim() : undefined,
      tags: Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [],
      isPublished: !!isPublished,
      publishedAt: isPublished ? (publishedAt ? new Date(publishedAt) : new Date()) : undefined,
    });

    res.status(201).json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: update post
export const adminUpdatePost = async (req, res) => {
  try {
    const { title, slug, excerpt, content, image, tags, isPublished, publishedAt } = req.body;
    const updates = {};

    if (title !== undefined) updates.title = String(title).trim();
    if (excerpt !== undefined) updates.excerpt = String(excerpt).trim();
    if (content !== undefined) updates.content = String(content);
    if (image !== undefined) updates.image = image ? String(image).trim() : undefined;
    if (tags !== undefined) {
      updates.tags = Array.isArray(tags) ? tags.map((t) => String(t).trim()).filter(Boolean) : [];
    }
    if (isPublished !== undefined) updates.isPublished = !!isPublished;

    if (slug !== undefined || title !== undefined) {
      const source = slug || title;
      if (source) {
        const finalSlug = source
          .toString()
          .toLowerCase()
          .trim()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '');
        const existing = await Blog.findOne({ slug: finalSlug, _id: { $ne: req.params.id } });
        if (existing) {
          return res.status(400).json({ success: false, message: 'Slug already exists' });
        }
        updates.slug = finalSlug;
      }
    }

    if (isPublished) {
      updates.publishedAt = publishedAt ? new Date(publishedAt) : new Date();
    } else if (isPublished === false) {
      updates.publishedAt = undefined;
    }

    const post = await Blog.findByIdAndUpdate(req.params.id, updates, {
      new: true,
      runValidators: true,
    }).lean();

    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }

    res.json({ success: true, data: post });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Admin: delete post
export const adminDeletePost = async (req, res) => {
  try {
    const post = await Blog.findByIdAndDelete(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, message: 'Post deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

