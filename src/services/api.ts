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
  const response = await fetch(`${API_BASE}/resource-usage`);
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
  const response = await fetch(`${API_BASE}/pods?namespace=${encodeURIComponent(namespace)}`);
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

  const response = await fetch(`${API_BASE}/logs?${params}`);
  if (!response.ok) {
    throw new Error('Failed to fetch logs');
  }
  return response.json();
}

// Namespaces API
export async function fetchNamespaces() {
  const response = await fetch(`${API_BASE}/namespaces`);
  if (!response.ok) {
    throw new Error('Failed to fetch namespaces');
  }
  return response.json();
}

// Contexts API
export async function fetchContexts() {
  const response = await fetch(`${API_BASE}/contexts`);
  if (!response.ok) {
    throw new Error('Failed to fetch contexts');
  }
  return response.json();
}

export async function setContext(context: string) {
  const response = await fetch(`${API_BASE}/contexts/set`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ context }),
  });
  
  if (!response.ok) {
    throw new Error('Failed to set context');
  }
  return response.json();
}