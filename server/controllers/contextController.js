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

// Initialize user contexts table
const initializeUserContextsTable = async () => {
  try {
    // Drop existing tables if they exist to recreate with correct schema
    await pool.query('DROP TABLE IF EXISTS user_contexts CASCADE');
    await pool.query('DROP TABLE IF EXISTS kubeconfig_files CASCADE');
    
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
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    console.log('✅ User contexts tables initialized');
  } catch (error) {
    console.error('❌ User contexts table initialization error:', error);
  }
};

// Initialize on startup
initializeUserContextsTable();

// Ensure ~/.kube directory exists
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
    // Get all available kubeconfig files
    const result = await pool.query('SELECT * FROM kubeconfig_files ORDER BY created_at DESC');
    const kubeconfigFiles = result.rows;
    
    const allContexts = [];
    
    for (const file of kubeconfigFiles) {
      try {
        const contextList = await execShell(`kubectl --kubeconfig="${file.file_path}" config get-contexts -o name`);
        const contexts = contextList.split('\n').filter(Boolean).map(name => ({
          name: name.trim(),
          kubeconfigFile: file.filename,
          kubeconfigPath: file.file_path,
          displayName: `${name.trim()} (${file.context_name})`
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

    // Verify the context exists in the kubeconfig file
    try {
      await execShell(`kubectl --kubeconfig="${kubeconfigPath}" config get-contexts ${contextName}`);
    } catch (error) {
      return res.status(400).json({ error: 'Invalid context or kubeconfig file' });
    }

    // Delete existing user context and insert new one (only one active context per user)
    await pool.query('DELETE FROM user_contexts WHERE user_id = $1', [userId]);
    
    await pool.query(`
      INSERT INTO user_contexts (user_id, context_name, kubeconfig_path, updated_at)
      VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
    `, [userId, contextName, kubeconfigPath]);

    res.json({ message: `Context set to ${contextName}` });
  } catch (error) {
    console.error('Set user context error:', error);
    res.status(500).json({ error: 'Failed to set user context' });
  }
};

const uploadKubeconfig = async (req, res) => {
  try {
    const { contextName } = req.body;
    
    if (!req.file) {
      return res.status(400).json({ error: 'No kubeconfig file uploaded' });
    }
    
    if (!contextName || contextName.trim() === '') {
      // Remove uploaded file if context name is missing
      if (req.file.path) {
        fs.unlinkSync(req.file.path);
      }
      return res.status(400).json({ error: 'Context name is required' });
    }

    const { originalname, path: tempFilePath } = req.file;
    const uploadedBy = req.user.id;

    // Verify it's a valid kubeconfig file
    try {
      await execShell(`kubectl --kubeconfig="${tempFilePath}" config get-contexts`);
    } catch (error) {
      // Remove invalid file
      fs.unlinkSync(tempFilePath);
      return res.status(400).json({ error: 'Invalid kubeconfig file' });
    }

    // Ensure ~/.kube directory exists
    const kubeDir = ensureKubeDirectory();
    
    // Create a safe filename for the kubeconfig
    const safeContextName = contextName.trim().replace(/[^a-zA-Z0-9-_]/g, '_');
    const kubeconfigFilename = `config_${safeContextName}`;
    const finalPath = path.join(kubeDir, kubeconfigFilename);

    // Move file from temp location to ~/.kube directory
    fs.copyFileSync(tempFilePath, finalPath);
    fs.unlinkSync(tempFilePath); // Remove temp file

    // Set proper permissions (readable by owner only)
    fs.chmodSync(finalPath, 0o600);

    // Store file info in database
    await pool.query(
      'INSERT INTO kubeconfig_files (filename, original_name, context_name, file_path, uploaded_by) VALUES ($1, $2, $3, $4, $5)',
      [kubeconfigFilename, originalname, contextName.trim(), finalPath, uploadedBy]
    );

    console.log(`✅ Kubeconfig saved to: ${finalPath}`);

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

const setContext = async (req, res) => {
  let { context } = req.body;
  context = encodeURI(context)
  
  if (!context) {
    return res.status(400).json({ error: 'No context provided' });
  }

  try {
    await execShell(`kubectl config use-context ${context}`);
    res.json({ message: `Context set to ${context}` });
  } catch (err) {
    console.error('Set context error:', err);
    res.status(500).json({ error: err.toString() });
  }
};

module.exports = {
  getContexts,
  setContext,
  uploadKubeconfig,
  getUserContext,
  setUserContext
};