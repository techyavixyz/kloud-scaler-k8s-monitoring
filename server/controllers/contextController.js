const { execShell } = require('../utils/kubectl');

const getContexts = async (req, res) => {
  try {
    const contextList = await execShell('kubectl config get-contexts -o name');
    const currentContext = await execShell('kubectl config current-context');
    
    const contexts = contextList.split('\n').map(name => ({
      name: name.trim(),
      current: name.trim() === currentContext.trim()
    }));

    res.json({ contexts });
  } catch (err) {
    console.error('Get contexts error:', err);
    res.status(500).json({ error: err.toString() });
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
  setContext
};