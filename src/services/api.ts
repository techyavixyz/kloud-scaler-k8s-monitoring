import { getBackendBaseUrl } from '../utils/url';

const API_BASE = `${getBackendBaseUrl().http}/api`;

export interface ResourceUsage {
  namespace: string;
  cpu: string;
  cpuRaw: number;
  memory: string;
  memoryRaw: number;
  podCount: number;
  timestamp: string;
}

export interface Pod {
  name: string;
  status: string;
  ready: boolean;
  restarts: number;
  age: string;
  labels: Record<string, string>;
  node: string;
}

export interface Context {
  name: string;
  current: boolean;
}

export interface LogsRequest {
  namespace: string;
  podName?: string;
  appLabel?: string;
  tail?: number;
}

// Resource Usage API
export async function fetchResourceUsage(): Promise<ResourceUsage[]> {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/resource-usage`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch resource usage');
  }
  return response.json();
}

export async function fetchMetricsHistory(namespace: string, hours: number) {
  const response = await fetch(`${API_BASE}/metrics/history/${namespace}?hours=${hours}`);
  if (!response.ok) {
    throw new Error('Failed to fetch metrics history');
  }
  return response.json();
}

// Pods API
export async function fetchPods(namespace: string) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/pods?namespace=${encodeURIComponent(namespace)}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch pods');
  }
  return response.json();
}

// Logs API
export async function fetchLogs(request: LogsRequest) {
  const params = new URLSearchParams({
    namespace: request.namespace,
    tail: (request.tail || 50).toString(),
  });

  if (request.podName) {
    params.append('podName', request.podName);
  }
  if (request.appLabel) {
    params.append('appLabel', request.appLabel);
  }

  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/logs?${params}`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch logs');
  }
  return response.json();
}

// Namespaces API
export async function fetchNamespaces() {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/namespaces`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch namespaces');
  }
  return response.json();
}

// Contexts API
export async function fetchContexts() {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/contexts`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch contexts');
  }
  return response.json();
}

export async function getUserContext() {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/user-context`, {
    headers: {
      'Authorization': `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user context');
  }
  return response.json();
}

export async function setUserContext(contextName: string, kubeconfigPath: string) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/user-context`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ contextName, kubeconfigPath }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to set user context');
  }
  return response.json();
}

export async function uploadKubeconfig(file: File, contextName: string) {
  const token = localStorage.getItem('auth_token');
  const formData = new FormData();
  formData.append('kubeconfig', file);
  formData.append('contextName', contextName);

  const response = await fetch(`${API_BASE}/contexts/upload`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });
  
  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to upload kubeconfig file');
  }
  return response.json();
}

export async function setContext(context: string) {
  const token = localStorage.getItem('auth_token');
  const response = await fetch(`${API_BASE}/contexts/set`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify({ context }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to set context');
  }
  return response.json();
}