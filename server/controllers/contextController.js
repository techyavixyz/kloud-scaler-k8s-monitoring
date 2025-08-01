

// const { exec } = require('child_process');
// const path = require('path');
// const fs = require('fs');
// const os = require('os');
// const { pool } = require('./authController');

// function execShell(command) {
//   return new Promise((resolve, reject) => {
//     exec(command, { maxBuffer: 1024 * 5000 }, (error, stdout, stderr) => {
//       if (error) return reject(`❌ Error: ${error.message}`);
//       if (stderr && !stdout) return reject(`❌ stderr: ${stderr}`);
//       resolve(stdout.trim());
//     });
//   });
// }

// const initializeUserContextsTable = async () => {
//   try {
//     // Don't drop tables, just create if not exists
//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS user_contexts (
//         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//         user_id UUID REFERENCES users(id) ON DELETE CASCADE,
//         context_name VARCHAR(255) NOT NULL,
//         kubeconfig_path VARCHAR(500) NOT NULL,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//         UNIQUE(user_id, context_name)
//       )
//     `);


//     await pool.query(`
//       CREATE TABLE IF NOT EXISTS kubeconfig_files (
//         id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//         filename VARCHAR(255) NOT NULL UNIQUE,
//         original_name VARCHAR(255) NOT NULL,
//         context_name VARCHAR(255) NOT NULL,
//         file_path VARCHAR(500) NOT NULL,
//         uploaded_by UUID REFERENCES users(id),
//         is_active BOOLEAN DEFAULT true,
//         created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
//       )
//     `);

//     console.log('✅ User contexts tables initialized');
//   } catch (error) {
//     console.error('❌ User contexts table initialization error:', error);
//   }
// };

// initializeUserContextsTable();

// const ensureKubeDirectory = () => {
//   const kubeDir = path.join(os.homedir(), '.kube');
//   if (!fs.existsSync(kubeDir)) {
//     fs.mkdirSync(kubeDir, { recursive: true });
//     console.log('✅ Created ~/.kube directory');
//   }
//   return kubeDir;
// };

// const getContexts = async (req, res) => {
//   try {
//     const result = await pool.query('SELECT * FROM kubeconfig_files WHERE is_active = true ORDER BY created_at DESC');
//     const kubeconfigFiles = result.rows;

//     const allContexts = [];

//     for (const file of kubeconfigFiles) {
//       try {
//         const contextList = await execShell(`kubectl --kubeconfig="${file.file_path}" config get-contexts -o name`);
//         const contexts = contextList.split('\n').filter(Boolean).map(name => ({
//           name: name.trim(),
//           kubeconfigFile: file.filename,
//           kubeconfigPath: file.file_path,
//           displayName: `${name.trim()} (${file.context_name})`,
//           contextDescription: file.context_name,
//           fileId: file.id
//         }));
//         allContexts.push(...contexts);
//       } catch (error) {
//         console.error(`Error reading contexts from ${file.filename}:`, error);
//       }
//     }

//     res.json({ contexts: allContexts });
//   } catch (err) {
//     console.error('Get contexts error:', err);
//     res.status(500).json({ error: err.toString() });
//   }
// };

// const getUserContext = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const result = await pool.query(
//       'SELECT context_name, kubeconfig_path FROM user_contexts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
//       [userId]
//     );

//     const userContext = result.rows[0];
//     res.json({ 
//       currentContext: userContext ? userContext.context_name : null,
//       kubeconfigPath: userContext ? userContext.kubeconfig_path : null
//     });
//   } catch (error) {
//     console.error('Get user context error:', error);
//     res.status(500).json({ error: 'Failed to get user context' });
//   }
// };

// const setUserContext = async (req, res) => {
//   try {
//     const userId = req.user.id;
//     const { contextName, kubeconfigPath } = req.body;

//     if (!contextName || !kubeconfigPath) {
//       return res.status(400).json({ error: 'Context name and kubeconfig path are required' });
//     }

//     if (!fs.existsSync(kubeconfigPath)) {
//       return res.status(400).json({ error: 'Kubeconfig file not found' });
//     }

//     try {
//       await execShell(`kubectl --kubeconfig="${kubeconfigPath}" config get-contexts ${contextName}`);
//     } catch (error) {
//       return res.status(400).json({ error: 'Invalid context or kubeconfig file' });
//     }

//     await pool.query('DELETE FROM user_contexts WHERE user_id = $1', [userId]);

//     await pool.query(
//       'INSERT INTO user_contexts (user_id, context_name, kubeconfig_path, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
//       [userId, contextName, kubeconfigPath]
//     );

//     res.json({ message: `Context set to ${contextName}` });
//   } catch (error) {
//     console.error('Set user context error:', error);
//     res.status(500).json({ error: 'Failed to set user context' });
//   }
// };

// const uploadKubeconfig = async (req, res) => {
//   try {
//     const { contextName } = req.body;
//     const uploadedBy = req.user.id;

//     const userResult = await pool.query('SELECT roles FROM users WHERE id = $1', [uploadedBy]);
//     const userRoles = userResult.rows[0]?.roles || [];

//     if (!userRoles.includes('admin')) {
//       return res.status(403).json({ error: 'Only administrators can upload kubeconfig files' });
//     }

//     if (!req.file) {
//       return res.status(400).json({ error: 'No kubeconfig file uploaded' });
//     }

//     if (!contextName || contextName.trim() === '') {
//       if (req.file.path) {
//         fs.unlinkSync(req.file.path);
//       }
//       return res.status(400).json({ error: 'Context name is required' });
//     }

//     const { originalname, path: tempFilePath } = req.file;

//     try {
//       await execShell(`kubectl --kubeconfig="${tempFilePath}" config get-contexts`);
//     } catch (error) {
//       fs.unlinkSync(tempFilePath);
//       return res.status(400).json({ error: 'Invalid kubeconfig file' });
//     }

//     const kubeDir = ensureKubeDirectory();
//     const safeContextName = contextName.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
//     const timestamp = Date.now();
//     const kubeconfigFilename = `config_${safeContextName}_${timestamp}`;
//     const finalPath = path.join(kubeDir, kubeconfigFilename);

//     fs.copyFileSync(tempFilePath, finalPath);
//     fs.unlinkSync(tempFilePath);
//     fs.chmodSync(finalPath, 0o600);

//     const existingContext = await pool.query(
//       'SELECT id FROM kubeconfig_files WHERE context_name = $1',
//       [contextName.trim()]
//     );

//     if (existingContext.rows.length > 0) {
//       fs.unlinkSync(finalPath);
//       return res.status(400).json({ error: 'A kubeconfig with this context name already exists' });
//     }

//     await pool.query(
//       'INSERT INTO kubeconfig_files (filename, original_name, context_name, file_path, uploaded_by) VALUES ($1, $2, $3, $4, $5)',
//       [kubeconfigFilename, originalname, contextName.trim(), finalPath, uploadedBy]
//     );

//     res.json({ 
//       message: 'Kubeconfig file uploaded successfully',
//       filename: kubeconfigFilename,
//       originalName: originalname,
//       contextName: contextName.trim(),
//       path: finalPath
//     });
//   } catch (error) {
//     console.error('Upload kubeconfig error:', error);
//     if (req.file && req.file.path) {
//       fs.unlinkSync(req.file.path);
//     }
//     res.status(500).json({ error: 'Failed to upload kubeconfig file' });
//   }
// };

// const deleteKubeconfig = async (req, res) => {
//   try {
//     const { fileId } = req.params;
//     const userId = req.user.id;
    
//     // Check if user has admin role
//     const userResult = await pool.query('SELECT roles FROM users WHERE id = $1', [userId]);
//     const userRoles = userResult.rows[0]?.roles || [];
    
//     if (!userRoles.includes('admin')) {
//       return res.status(403).json({ error: 'Only administrators can delete kubeconfig files' });
//     }
    
//     // Get file info before deletion
//     const fileResult = await pool.query('SELECT * FROM kubeconfig_files WHERE id = $1', [fileId]);
//     const file = fileResult.rows[0];
    
//     if (!file) {
//       return res.status(404).json({ error: 'Kubeconfig file not found' });
//     }
    
//     // Mark as inactive instead of deleting (soft delete)
//     await pool.query('UPDATE kubeconfig_files SET is_active = false WHERE id = $1', [fileId]);
    
//     // Remove physical file
//     if (fs.existsSync(file.file_path)) {
//       fs.unlinkSync(file.file_path);
//     }
    
//     // Remove any user contexts using this file
//     await pool.query('DELETE FROM user_contexts WHERE kubeconfig_path = $1', [file.file_path]);
    
//     res.json({ message: 'Kubeconfig file deleted successfully' });
//   } catch (error) {
//     console.error('Delete kubeconfig error:', error);
//     res.status(500).json({ error: 'Failed to delete kubeconfig file' });
//   }
// };

// const getKubeconfigFiles = async (req, res) => {
//   try {
//     const userId = req.user.id;
    
//     // Check if user has admin role
//     const userResult = await pool.query('SELECT roles FROM users WHERE id = $1', [userId]);
//     const userRoles = userResult.rows[0]?.roles || [];
    
//     if (!userRoles.includes('admin')) {
//       return res.status(403).json({ error: 'Only administrators can view kubeconfig files' });
//     }
    
//     const result = await pool.query(`
//       SELECT kf.*, u.username as uploaded_by_username 
//       FROM kubeconfig_files kf 
//       LEFT JOIN users u ON kf.uploaded_by = u.id 
//       WHERE kf.is_active = true 
//       ORDER BY kf.created_at DESC
//     `);
    
//     res.json({ files: result.rows });
//   } catch (error) {
//     console.error('Get kubeconfig files error:', error);
//     res.status(500).json({ error: 'Failed to get kubeconfig files' });
//   }
// };

// module.exports = {
//   getContexts,
//   uploadKubeconfig,
//   getUserContext,
//   setUserContext,
//   deleteKubeconfig,
//   getKubeconfigFiles
// };

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { pool } = require('./authController');

function execShell(command) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 5000 }, (error, stdout, stderr) => {
      if (error) return reject(`❌ Error: ${error.message}`);
      if (stderr && !stdout) return reject(`❌ stderr: ${stderr}`);
      resolve(stdout.trim());
    });
  });
}

const initializeUserContextsTable = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS user_contexts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID REFERENCES users(id) ON DELETE CASCADE,
        context_name VARCHAR(255) NOT NULL,
        kubeconfig_path VARCHAR(500) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(user_id, context_name)
      )
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS kubeconfig_files (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        filename VARCHAR(255) NOT NULL UNIQUE,
        original_name VARCHAR(255) NOT NULL,
        context_name VARCHAR(255) NOT NULL,
        file_path VARCHAR(500) NOT NULL,
        uploaded_by UUID REFERENCES users(id),
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    await pool.query(`
      CREATE TABLE IF NOT EXISTS k8s_contexts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        name VARCHAR(255) NOT NULL,
        kubeconfig_path VARCHAR(500) NOT NULL,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ User context and kubeconfig tables initialized');
  } catch (error) {
    console.error('❌ Initialization error:', error);
  }
};

initializeUserContextsTable();

const ensureKubeDirectory = () => {
  const kubeDir = path.join(os.homedir(), '.kube');
  if (!fs.existsSync(kubeDir)) {
    fs.mkdirSync(kubeDir, { recursive: true });
    console.log('✅ Created ~/.kube directory');
  }
  return kubeDir;
};

const getContexts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM kubeconfig_files WHERE is_active = true ORDER BY created_at DESC');
    const kubeconfigFiles = result.rows;

    const allContexts = [];

    for (const file of kubeconfigFiles) {
      try {
        const contextList = await execShell(`kubectl --kubeconfig="${file.file_path}" config get-contexts -o name`);
        const contexts = contextList.split('\n').filter(Boolean).map(name => ({
          name: name.trim(),
          kubeconfigFile: file.filename,
          kubeconfigPath: file.file_path,
          displayName: `${name.trim()} (${file.context_name})`,
          contextDescription: file.context_name,
          fileId: file.id
        }));
        allContexts.push(...contexts);
      } catch (error) {
        console.error(`Error reading contexts from ${file.filename}:`, error);
      }
    }

    res.json({ contexts: allContexts });
  } catch (err) {
    console.error('Get contexts error:', err);
    res.status(500).json({ error: err.toString() });
  }
};

const getUserContext = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await pool.query(
      'SELECT context_name, kubeconfig_path FROM user_contexts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [userId]
    );

    const userContext = result.rows[0];
    res.json({ 
      currentContext: userContext ? userContext.context_name : null,
      kubeconfigPath: userContext ? userContext.kubeconfig_path : null
    });
  } catch (error) {
    console.error('Get user context error:', error);
    res.status(500).json({ error: 'Failed to get user context' });
  }
};

const setUserContext = async (req, res) => {
  try {
    const userId = req.user.id;
    const { contextName, kubeconfigPath } = req.body;

    if (!contextName || !kubeconfigPath) {
      return res.status(400).json({ error: 'Context name and kubeconfig path are required' });
    }

    if (!fs.existsSync(kubeconfigPath)) {
      return res.status(400).json({ error: 'Kubeconfig file not found' });
    }

    try {
      await execShell(`kubectl --kubeconfig="${kubeconfigPath}" config get-contexts ${contextName}`);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid context or kubeconfig file' });
    }

    await pool.query('DELETE FROM user_contexts WHERE user_id = $1', [userId]);

    await pool.query(
      'INSERT INTO user_contexts (user_id, context_name, kubeconfig_path, updated_at) VALUES ($1, $2, $3, CURRENT_TIMESTAMP)',
      [userId, contextName, kubeconfigPath]
    );

    res.json({ message: `Context set to ${contextName}` });
  } catch (error) {
    console.error('Set user context error:', error);
    res.status(500).json({ error: 'Failed to set user context' });
  }
};

const uploadKubeconfig = async (req, res) => {
  try {
    const { contextName } = req.body;
    const uploadedBy = req.user.id;

    const userResult = await pool.query('SELECT roles FROM users WHERE id = $1', [uploadedBy]);
    const userRoles = userResult.rows[0]?.roles || [];

    if (!userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Only administrators can upload kubeconfig files' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'No kubeconfig file uploaded' });
    }

    if (!contextName || contextName.trim() === '') {
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Context name is required' });
    }

    const { originalname, path: tempFilePath } = req.file;

    try {
      await execShell(`kubectl --kubeconfig="${tempFilePath}" config get-contexts`);
    } catch (error) {
      fs.unlinkSync(tempFilePath);
      return res.status(400).json({ error: 'Invalid kubeconfig file' });
    }

    const kubeDir = ensureKubeDirectory();
    const safeContextName = contextName.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
    const timestamp = Date.now();
    const kubeconfigFilename = `config_${safeContextName}_${timestamp}`;
    const finalPath = path.join(kubeDir, kubeconfigFilename);

    fs.copyFileSync(tempFilePath, finalPath);
    fs.unlinkSync(tempFilePath);
    fs.chmodSync(finalPath, 0o600);

    const existingContext = await pool.query(
      'SELECT id FROM kubeconfig_files WHERE context_name = $1',
      [contextName.trim()]
    );

    if (existingContext.rows.length > 0) {
      fs.unlinkSync(finalPath);
      return res.status(400).json({ error: 'A kubeconfig with this context name already exists' });
    }

    await pool.query(
      'INSERT INTO kubeconfig_files (filename, original_name, context_name, file_path, uploaded_by) VALUES ($1, $2, $3, $4, $5)',
      [kubeconfigFilename, originalname, contextName.trim(), finalPath, uploadedBy]
    );

    res.json({ 
      message: 'Kubeconfig file uploaded successfully',
      filename: kubeconfigFilename,
      originalName: originalname,
      contextName: contextName.trim(),
      path: finalPath
    });
  } catch (error) {
    console.error('Upload kubeconfig error:', error);
    if (req.file && req.file.path) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: 'Failed to upload kubeconfig file' });
  }
};

const deleteKubeconfig = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;
    
    const userResult = await pool.query('SELECT roles FROM users WHERE id = $1', [userId]);
    const userRoles = userResult.rows[0]?.roles || [];
    
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Only administrators can delete kubeconfig files' });
    }
    
    const fileResult = await pool.query('SELECT * FROM kubeconfig_files WHERE id = $1', [fileId]);
    const file = fileResult.rows[0];
    
    if (!file) {
      return res.status(404).json({ error: 'Kubeconfig file not found' });
    }
    
    await pool.query('UPDATE kubeconfig_files SET is_active = false WHERE id = $1', [fileId]);
    
    if (fs.existsSync(file.file_path)) {
      fs.unlinkSync(file.file_path);
    }
    
    await pool.query('DELETE FROM user_contexts WHERE kubeconfig_path = $1', [file.file_path]);
    
    res.json({ message: 'Kubeconfig file deleted successfully' });
  } catch (error) {
    console.error('Delete kubeconfig error:', error);
    res.status(500).json({ error: 'Failed to delete kubeconfig file' });
  }
};

const getKubeconfigFiles = async (req, res) => {
  try {
    const userId = req.user.id;
    const userResult = await pool.query('SELECT roles FROM users WHERE id = $1', [userId]);
    const userRoles = userResult.rows[0]?.roles || [];
    
    if (!userRoles.includes('admin')) {
      return res.status(403).json({ error: 'Only administrators can view kubeconfig files' });
    }
    
    const result = await pool.query(`
      SELECT kf.*, u.username as uploaded_by_username 
      FROM kubeconfig_files kf 
      LEFT JOIN users u ON kf.uploaded_by = u.id 
      WHERE kf.is_active = true 
      ORDER BY kf.created_at DESC
    `);
    
    res.json({ files: result.rows });
  } catch (error) {
    console.error('Get kubeconfig files error:', error);
    res.status(500).json({ error: 'Failed to get kubeconfig files' });
  }
};

// ✅ NEW: Get from k8s_contexts table
const getK8sContexts = async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM k8s_contexts WHERE is_active = true ORDER BY created_at DESC');
    res.json({ contexts: result.rows });
  } catch (error) {
    console.error('Get k8s_contexts error:', error);
    res.status(500).json({ error: 'Failed to get contexts' });
  }
};

module.exports = {
  getContexts,
  uploadKubeconfig,
  getUserContext,
  setUserContext,
  deleteKubeconfig,
  getKubeconfigFiles,
  getK8sContexts // ✅ make sure this is exported
};
