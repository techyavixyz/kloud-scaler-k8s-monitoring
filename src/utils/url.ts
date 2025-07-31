export function getBackendBaseUrl() {
  const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
  const wsProtocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const hostname = window.location.hostname;
  const backendPort = 3001;

  let backendHostname = hostname;

  // Regex to find the embedded port in webcontainer-like hostnames (e.g., --5173--)
  const webcontainerPortRegex = /--(\d+)--/;
  const match = hostname.match(webcontainerPortRegex);

  if (match && match[1]) {
    // If an embedded port is found, replace it with the backend port
    backendHostname = hostname.replace(`--${match[1]}--`, `--${backendPort}--`);
  } else if (window.location.port) {
    // If a standard port is present (e.g., localhost:5173), replace it
    backendHostname = `${hostname.split(':')[0]}:${backendPort}`;
  } else {
    // Fallback for cases where no explicit port or embedded port is found,
    // but we still need to target the backend port (e.g., example.com -> example.com:3001)
    backendHostname = `${hostname}:${backendPort}`;
  }

  return {
    http: `${protocol}//${backendHostname}`,
    ws: `${wsProtocol}//${backendHostname}`
  };
}