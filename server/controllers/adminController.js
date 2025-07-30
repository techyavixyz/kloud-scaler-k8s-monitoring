import bcrypt from 'bcryptjs';
import { pgPool } from '../config/database.js';

export const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 10, search = '' } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT id, username, email, role, permissions, created_at, last_login, is_active
      FROM users
    `;
    let countQuery = 'SELECT COUNT(*) FROM users';
    let params = [];

    if (search) {
      query += ' WHERE username ILIKE $1 OR email ILIKE $1';
      countQuery += ' WHERE username ILIKE $1 OR email ILIKE $1';
      params.push(`%${search}%`);
    }

    query += ` ORDER BY created_at DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
    params.push(limit, offset);

    const [users, count] = await Promise.all([
      pgPool.query(query, params),
      pgPool.query(countQuery, search ? [`%${search}%`] : [])
    ]);

    res.json({
      users: users.rows,
      total: parseInt(count.rows[0].count),
      page: parseInt(page),
      totalPages: Math.ceil(count.rows[0].count / limit)
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to get users' });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role = 'viewer', permissions = [] } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({ error: 'Username, email, and password required' });
    }

    // Check if user exists
    const existingUser = await pgPool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    );

    if (existingUser.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const result = await pgPool.query(
      'INSERT INTO users (username, email, password_hash, role, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, permissions, created_at',
      [username, email, hashedPassword, role, JSON.stringify(permissions)]
    );

    res.status(201).json({
      user: result.rows[0],
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { email, role, permissions, is_active, password } = req.body;

    let updateFields = [];
    let params = [];
    let paramIndex = 1;

    if (email) {
      updateFields.push(`email = $${paramIndex++}`);
      params.push(email);
    }

    if (role) {
      updateFields.push(`role = $${paramIndex++}`);
      params.push(role);
    }

    if (permissions) {
      updateFields.push(`permissions = $${paramIndex++}`);
      params.push(JSON.stringify(permissions));
    }

    if (typeof is_active === 'boolean') {
      updateFields.push(`is_active = $${paramIndex++}`);
      params.push(is_active);
    }

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      updateFields.push(`password_hash = $${paramIndex++}`);
      params.push(hashedPassword);
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ error: 'No fields to update' });
    }

    updateFields.push(`updated_at = CURRENT_TIMESTAMP`);
    params.push(id);

    const query = `
      UPDATE users 
      SET ${updateFields.join(', ')} 
      WHERE id = $${paramIndex}
      RETURNING id, username, email, role, permissions, is_active, updated_at
    `;

    const result = await pgPool.query(query, params);

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      user: result.rows[0],
      message: 'User updated successfully'
    });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ error: 'Failed to update user' });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // Don't allow deleting the current user
    if (parseInt(id) === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    const result = await pgPool.query(
      'DELETE FROM users WHERE id = $1 RETURNING username',
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: `User ${result.rows[0].username} deleted successfully` });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
};

export const getRoles = async (req, res) => {
  try {
    const result = await pgPool.query(
      'SELECT * FROM roles ORDER BY name'
    );

    res.json({ roles: result.rows });
  } catch (error) {
    console.error('Get roles error:', error);
    res.status(500).json({ error: 'Failed to get roles' });
  }
};

export const createRole = async (req, res) => {
  try {
    const { name, description, permissions } = req.body;

    if (!name || !permissions) {
      return res.status(400).json({ error: 'Name and permissions required' });
    }

    const result = await pgPool.query(
      'INSERT INTO roles (name, description, permissions) VALUES ($1, $2, $3) RETURNING *',
      [name, description, JSON.stringify(permissions)]
    );

    res.status(201).json({
      role: result.rows[0],
      message: 'Role created successfully'
    });
  } catch (error) {
    console.error('Create role error:', error);
    res.status(500).json({ error: 'Failed to create role' });
  }
};

export const updateRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { description, permissions } = req.body;

    const result = await pgPool.query(
      'UPDATE roles SET description = $1, permissions = $2 WHERE id = $3 RETURNING *',
      [description, JSON.stringify(permissions), id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Role not found' });
    }

    res.json({
      role: result.rows[0],
      message: 'Role updated successfully'
    });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ error: 'Failed to update role' });
  }
};