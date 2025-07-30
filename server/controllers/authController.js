import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pgPool } from '../config/database.js';

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    // Find user
    const result = await pgPool.query(
      'SELECT id, username, email, password_hash, role, permissions, is_active FROM users WHERE username = $1 OR email = $1',
      [username]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];

    if (!user.is_active) {
      return res.status(401).json({ error: 'Account is deactivated' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Generate JWT token
    const token = jwt.sign(
      { userId: user.id, username: user.username, role: user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '24h' }
    );

    // Update last login
    await pgPool.query(
      'UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE id = $1',
      [user.id]
    );

    // Remove password hash from response
    delete user.password_hash;

    res.json({
      token,
      user,
      message: 'Login successful'
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
};

export const register = async (req, res) => {
  try {
    const { username, email, password, role = 'viewer' } = req.body;

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

    // Get role permissions
    const roleResult = await pgPool.query(
      'SELECT permissions FROM roles WHERE name = $1',
      [role]
    );

    const permissions = roleResult.rows.length > 0 ? roleResult.rows[0].permissions : [];

    // Create user
    const result = await pgPool.query(
      'INSERT INTO users (username, email, password_hash, role, permissions) VALUES ($1, $2, $3, $4, $5) RETURNING id, username, email, role, permissions, created_at',
      [username, email, hashedPassword, role, permissions]
    );

    res.status(201).json({
      user: result.rows[0],
      message: 'User created successfully'
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
};

export const getProfile = async (req, res) => {
  try {
    const result = await pgPool.query(
      'SELECT id, username, email, role, permissions, created_at, last_login FROM users WHERE id = $1',
      [req.user.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user: result.rows[0] });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Failed to get profile' });
  }
};

export const updateProfile = async (req, res) => {
  try {
    const { email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // If changing password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({ error: 'Current password required' });
      }

      const userResult = await pgPool.query(
        'SELECT password_hash FROM users WHERE id = $1',
        [userId]
      );

      const isValidPassword = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid current password' });
      }

      const hashedNewPassword = await bcrypt.hash(newPassword, 10);
      await pgPool.query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [hashedNewPassword, userId]
      );
    }

    // Update email if provided
    if (email) {
      await pgPool.query(
        'UPDATE users SET email = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [email, userId]
      );
    }

    // Get updated user data
    const result = await pgPool.query(
      'SELECT id, username, email, role, permissions, updated_at FROM users WHERE id = $1',
      [userId]
    );

    res.json({
      user: result.rows[0],
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
};

export const logout = async (req, res) => {
  // In a more complex setup, you might want to blacklist the token
  res.json({ message: 'Logged out successfully' });
};