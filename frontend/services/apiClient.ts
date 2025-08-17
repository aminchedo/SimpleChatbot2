const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
const WS_BASE_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000';

interface ApiResponse<T = any> {
  data?: T;
  error?: boolean;
  message?: string;
  status_code?: number;
  timestamp?: string;
}

interface HealthCheckResponse {
  status: string;
  environment: string;
  version: string;
  timestamp: string;
}

interface ReadinessCheckResponse {
  ready: boolean;
  checks: {
    environment_loaded: boolean;
    ai_service: boolean;
    audio_service: boolean;
    websocket_connections: number;
  };
  timestamp: string;
}

class ApiClient {
  private baseURL: string;
  private wsURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
    this.wsURL = WS_BASE_URL;
  }

  /**
   * Health check endpoint
   */
  async healthCheck(): Promise<HealthCheckResponse> {
    const response = await fetch(`${this.baseURL}/health`);
    if (!response.ok) {
      throw new Error('Health check failed');
    }
    return response.json();
  }

  /**
   * Readiness check endpoint
   */
  async readinessCheck(): Promise<{ ready: boolean; data: ReadinessCheckResponse }> {
    const response = await fetch(`${this.baseURL}/ready`);
    const data = await response.json();
    return {
      ready: response.ok,
      data
    };
  }

  /**
   * Get metrics
   */
  async getMetrics() {
    const response = await fetch(`${this.baseURL}/metrics`);
    if (!response.ok) {
      throw new Error('Failed to fetch metrics');
    }
    return response.json();
  }

  /**
   * Generic POST request with error handling
   */
  async post<T = any>(endpoint: string, data: any, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(data),
        credentials: 'include', // Include cookies for session management
        ...options,
      });

      const responseData: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return (responseData.data || responseData) as T;
    } catch (error) {
      console.error('API POST error:', error);
      throw error;
    }
  }

  /**
   * Generic GET request with error handling
   */
  async get<T = any>(endpoint: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        credentials: 'include',
        ...options,
      });

      const responseData: ApiResponse<T> = await response.json();

      if (!response.ok) {
        throw new Error(responseData.message || `HTTP error! status: ${response.status}`);
      }

      return (responseData.data || responseData) as T;
    } catch (error) {
      console.error('API GET error:', error);
      throw error;
    }
  }

  /**
   * Upload file with progress tracking
   */
  async uploadFile(endpoint: string, file: File, options: RequestInit = {}, onProgress?: (progress: number) => void) {
    return new Promise((resolve, reject) => {
      const formData = new FormData();
      formData.append('file', file);

      const xhr = new XMLHttpRequest();

      // Track upload progress
      if (onProgress) {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            const progress = (e.loaded / e.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const response = JSON.parse(xhr.responseText);
            resolve(response);
          } catch (e) {
            resolve(xhr.responseText);
          }
        } else {
          reject(new Error(`HTTP error! status: ${xhr.status}`));
        }
      });

      xhr.addEventListener('error', () => {
        reject(new Error('Upload failed'));
      });

      xhr.open('POST', `${this.baseURL}${endpoint}`);
      
      // Add custom headers
      if (options.headers) {
        Object.entries(options.headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value as string);
        });
      }

      xhr.withCredentials = true; // Include cookies
      xhr.send(formData);
    });
  }

  /**
   * Create WebSocket connection
   */
  createWebSocketConnection(endpoint: string = '/ws/chat'): WebSocket {
    const wsUrl = `${this.wsURL}${endpoint}`;
    return new WebSocket(wsUrl);
  }

  /**
   * Get WebSocket URL
   */
  getWebSocketURL(endpoint: string = '/ws/chat'): string {
    return `${this.wsURL}${endpoint}`;
  }

  /**
   * Get base URLs
   */
  getBaseURL(): string {
    return this.baseURL;
  }

  getWSURL(): string {
    return this.wsURL;
  }
}

export const apiClient = new ApiClient();

// Export types for use in components
export type {
  ApiResponse,
  HealthCheckResponse,
  ReadinessCheckResponse
};