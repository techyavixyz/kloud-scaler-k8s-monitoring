const { exec } = require('child_process');
const { pool } = require('../controllers/authController');

async function getUserKubeconfigPath(userId) {
  try {
    const result = await pool.query(
      'SELECT kubeconfig_path FROM user_contexts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [userId]
    );
    return result.rows[0]?.kubeconfig_path || null;
  } catch (error) {
    console.error('Error getting user kubeconfig path:', error);
    return null;
  }
}

function execShellWithKubeconfig(command, kubeconfigPath = null) {
  return new Promise((resolve, reject) => {
    let finalCommand = command;
    
    // If kubeconfig path is provided, use it
    if (kubeconfigPath) {
      // Insert --kubeconfig flag after kubectl
      finalCommand = command.replace(/^kubectl/, `kubectl --kubeconfig="${kubeconfigPath}"`);
    }
    
    console.log('🔧 Executing command:', finalCommand);
    
    exec(finalCommand, { maxBuffer: 1024 * 5000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Command failed:', finalCommand);
        console.error('❌ Error:', error.message);
        return reject(`❌ Error: ${error.message}`);
      }
      if (stderr && !stdout) {
        console.error('❌ Command stderr:', finalCommand);
        console.error('❌ stderr:', stderr);
        return reject(`❌ stderr: ${stderr}`);
      }
      console.log('✅ Command success:', finalCommand);
      resolve(stdout.trim());
    });
  });
}

async function execKubectl(command, userId = null) {
  let kubeconfigPath = null;
  
  if (userId) {
    kubeconfigPath = await getUserKubeconfigPath(userId);
    console.log(`🔍 User ${userId} kubeconfig path:`, kubeconfigPath || 'default');
  }
  
  return execShellWithKubeconfig(command, kubeconfigPath);
}

module.exports = {
  getUserKubeconfigPath,
  execShellWithKubeconfig,
  execKubectl
};