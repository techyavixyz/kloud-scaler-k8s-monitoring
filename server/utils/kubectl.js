// const { exec } = require('child_process');
// const { pool } = require('../controllers/authController');

// async function getUserKubeconfigPath(userId) {
//   try {
//     const result = await pool.query(
//       'SELECT kubeconfig_path FROM user_contexts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
//       [userId]
//     );
//     return result.rows[0]?.kubeconfig_path || null;
//   } catch (error) {
//     console.error('Error getting user kubeconfig path:', error);
//     return null;
//   }
// }

// function execShellWithKubeconfig(command, kubeconfigPath = null) {
//   return new Promise((resolve, reject) => {
//     let finalCommand = command;
    
//     // If kubeconfig path is provided, use it
//     if (kubeconfigPath && kubeconfigPath !== 'default') {
//       // Insert --kubeconfig flag after kubectl
//       finalCommand = command.replace(/^kubectl/, `kubectl --kubeconfig="${kubeconfigPath}"`);
//     } else if (!kubeconfigPath || kubeconfigPath === 'default') {
//       // If no kubeconfig path or 'default', reject the command
//       return reject('❌ Error: No kubeconfig file configured for this user. Please upload a kubeconfig file first.');
//     }
    
//     console.log('🔧 Executing command:', finalCommand);
    
//     exec(finalCommand, { maxBuffer: 1024 * 5000 }, (error, stdout, stderr) => {
//       if (error) {
//         console.error('❌ Command failed:', finalCommand);
//         console.error('❌ Error:', error.message);
//         return reject(`❌ Error: ${error.message}`);
//       }
//       if (stderr && !stdout) {
//         console.error('❌ Command stderr:', finalCommand);
//         console.error('❌ stderr:', stderr);
//         return reject(`❌ stderr: ${stderr}`);
//       }
//       console.log('✅ Command success:', finalCommand);
//       resolve(stdout.trim());
//     });
//   });
// }

// async function execKubectl(command, userId = null) {
//   let kubeconfigPath = null;
  
//   if (userId) {
//     kubeconfigPath = await getUserKubeconfigPath(userId);
//     console.log(`🔍 User ${userId} kubeconfig path:`, kubeconfigPath || 'none configured');
//   }
  
//   return execShellWithKubeconfig(command, kubeconfigPath);
// }

// module.exports = {
//   getUserKubeconfigPath,
//   execShellWithKubeconfig,
//   execKubectl
// };


const { exec } = require('child_process');
const { pool } = require('../controllers/authController');

// Get user's kubeconfig + context
async function getUserKubeContext(userId) {
  try {
    const result = await pool.query(
      'SELECT context_name, kubeconfig_path FROM user_contexts WHERE user_id = $1 ORDER BY updated_at DESC LIMIT 1',
      [userId]
    );
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error getting user kube context:', error);
    return null;
  }
}

// Run kubectl command using user's kubeconfig + context
function execShellWithKubeconfig(command, kubeconfigPath = null, contextName = null) {
  return new Promise((resolve, reject) => {
    let finalCommand = command;

    if (!kubeconfigPath || kubeconfigPath === 'default') {
      return reject('❌ Error: No kubeconfig file configured for this user. Please upload one.');
    }

    // Ensure both --kubeconfig and --context are injected
    finalCommand = command.replace(/^kubectl/, 
      `kubectl --kubeconfig="${kubeconfigPath}"${contextName ? ` --context="${contextName}"` : ''}`);

    console.log('🔧 Executing command:', finalCommand);

    exec(finalCommand, { maxBuffer: 1024 * 5000 }, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Error running command:', finalCommand);
        return reject(`❌ Error: ${error.message}`);
      }
      if (stderr && !stdout) {
        console.error('❌ stderr:', stderr);
        return reject(`❌ stderr: ${stderr}`);
      }
      resolve(stdout.trim());
    });
  });
}

// Main function for controller usage
async function execKubectl(command, userId = null) {
  let kubeconfigPath = null;
  let contextName = null;

  if (userId) {
    const kubeContext = await getUserKubeContext(userId);
    if (!kubeContext) {
      throw new Error('❌ No context set for this user.');
    }

    kubeconfigPath = kubeContext.kubeconfig_path;
    contextName = kubeContext.context_name;
    console.log(`🔍 User ${userId} using context: ${contextName}, kubeconfig: ${kubeconfigPath}`);
  }

  return execShellWithKubeconfig(command, kubeconfigPath, contextName);
}

module.exports = {
  execKubectl,
  execShellWithKubeconfig,
  getUserKubeContext
};
