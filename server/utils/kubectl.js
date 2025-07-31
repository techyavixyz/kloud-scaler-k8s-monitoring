const { exec } = require('child_process');
const { pool } = require('../controllers/authController');

async function getUserKubeconfigPath(userId) {
  try {
    const result = await pool.query(
      'SELECT kubeconfig_path FROM user_contexts WHERE user_id = $1 LIMIT 1',
      [userId]
    );
    return result.rows[0]?.kubeconfig_path || null;
  } catch (error) {
    console.error('Error getting user kubeconfig path:', error);
    return null;
  }
}

function execShell(command, userId = null) {
  return new Promise((resolve, reject) => {
    exec(command, { maxBuffer: 1024 * 5000 }, async (error, stdout, stderr) => {
      if (error) return reject(`❌ Error: ${error.message}`);
      if (stderr && !stdout) return reject(`❌ stderr: ${stderr}`);
      resolve(stdout.trim());
    });
  });
}
