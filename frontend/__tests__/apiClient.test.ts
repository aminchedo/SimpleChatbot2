import { apiClient } from '../services/apiClient';

// Mock fetch globally
global.fetch = jest.fn();
const mockFetch = fetch as jest.MockedFunction<typeof fetch>;

// Mock WebSocket
global.WebSocket = jest.fn().mockImplementation(() => ({
  addEventListener: jest.fn(),
  removeEventListener: jest.fn(),
  send: jest.fn(),
  close: jest.fn(),
  readyState: 1
}));

describe('ApiClient', () => {
  beforeEach(() => {
    mockFetch.mockClear();
  });

  describe('Health Check', () => {
    it('should perform health check successfully', async () => {
      const mockResponse = {
        status: 'healthy',
        environment: 'development',
        version: '1.0.0',
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.healthCheck();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/health');
      expect(result).toEqual(mockResponse);
    });

    it('should handle health check failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(apiClient.healthCheck()).rejects.toThrow('Health check failed');
    });
  });

  describe('Readiness Check', () => {
    it('should perform readiness check successfully', async () => {
      const mockResponse = {
        ready: true,
        checks: {
          environment_loaded: true,
          ai_service: true,
          audio_service: true,
          websocket_connections: 0
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.readinessCheck();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/ready');
      expect(result.ready).toBe(true);
      expect(result.data).toEqual(mockResponse);
    });

    it('should handle readiness check failure', async () => {
      const mockResponse = {
        ready: false,
        checks: {
          environment_loaded: false,
          ai_service: false,
          audio_service: false,
          websocket_connections: 0
        },
        timestamp: '2024-01-01T00:00:00.000Z'
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.readinessCheck();

      expect(result.ready).toBe(false);
      expect(result.data).toEqual(mockResponse);
    });
  });

  describe('GET Requests', () => {
    it('should perform GET request successfully', async () => {
      const mockResponse = { data: 'test data' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.get('/test');

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle GET request error', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ message: 'Not found' }),
      } as Response);

      await expect(apiClient.get('/nonexistent')).rejects.toThrow('Not found');
    });
  });

  describe('POST Requests', () => {
    it('should perform POST request successfully', async () => {
      const mockResponse = { success: true };
      const testData = { message: 'test' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      } as Response);

      const result = await apiClient.post('/test', testData);

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testData),
        credentials: 'include',
      });
      expect(result).toEqual(mockResponse);
    });

    it('should handle POST request error', async () => {
      const testData = { message: 'test' };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({ message: 'Bad request' }),
      } as Response);

      await expect(apiClient.post('/test', testData)).rejects.toThrow('Bad request');
    });
  });

  describe('File Upload', () => {
    it('should upload file with progress tracking', async () => {
      const mockFile = new File(['test content'], 'test.txt', { type: 'text/plain' });
      const mockProgressCallback = jest.fn();

      // Mock XMLHttpRequest
      const mockXHR = {
        upload: {
          addEventListener: jest.fn(),
        },
        addEventListener: jest.fn(),
        open: jest.fn(),
        setRequestHeader: jest.fn(),
        send: jest.fn(),
        withCredentials: false,
        status: 200,
        responseText: JSON.stringify({ success: true }),
      };

      // Mock the constructor
      (global as any).XMLHttpRequest = jest.fn(() => mockXHR);

      // Simulate successful upload
      setTimeout(() => {
        const loadEvent = { type: 'load' };
        mockXHR.addEventListener.mock.calls
          .filter(call => call[0] === 'load')
          .forEach(call => call[1](loadEvent));
      }, 0);

      const uploadPromise = apiClient.uploadFile('/upload', mockFile, {}, mockProgressCallback);

      // Trigger the upload progress
      if (mockXHR.upload.addEventListener.mock.calls.length > 0) {
        const progressCallback = mockXHR.upload.addEventListener.mock.calls[0][1];
        progressCallback({ lengthComputable: true, loaded: 50, total: 100 });
      }

      const result = await uploadPromise;

      expect(mockXHR.open).toHaveBeenCalledWith('POST', 'http://localhost:8000/upload');
      expect(result).toEqual({ success: true });
    });
  });

  describe('WebSocket', () => {
    it('should create WebSocket connection', () => {
      const websocket = apiClient.createWebSocketConnection('/ws/test');

      expect(WebSocket).toHaveBeenCalledWith('ws://localhost:8000/ws/test');
      expect(websocket).toBeDefined();
    });

    it('should get WebSocket URL', () => {
      const url = apiClient.getWebSocketURL('/ws/chat');
      expect(url).toBe('ws://localhost:8000/ws/chat');
    });

    it('should get WebSocket URL with default endpoint', () => {
      const url = apiClient.getWebSocketURL();
      expect(url).toBe('ws://localhost:8000/ws/chat');
    });
  });

  describe('URL Getters', () => {
    it('should get base URL', () => {
      const baseURL = apiClient.getBaseURL();
      expect(baseURL).toBe('http://localhost:8000');
    });

    it('should get WebSocket URL', () => {
      const wsURL = apiClient.getWSURL();
      expect(wsURL).toBe('ws://localhost:8000');
    });
  });

  describe('Metrics', () => {
    it('should fetch metrics successfully', async () => {
      const mockMetrics = {
        active_websocket_connections: 5,
        uptime: '2024-01-01T00:00:00.000Z',
        environment: 'development'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockMetrics,
      } as Response);

      const result = await apiClient.getMetrics();

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/metrics');
      expect(result).toEqual(mockMetrics);
    });

    it('should handle metrics fetch failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
      } as Response);

      await expect(apiClient.getMetrics()).rejects.toThrow('Failed to fetch metrics');
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiClient.get('/test')).rejects.toThrow('Network error');
    });

    it('should handle JSON parsing errors', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      } as Response);

      await expect(apiClient.get('/test')).rejects.toThrow('Invalid JSON');
    });
  });

  describe('Custom Headers', () => {
    it('should include custom headers in GET request', async () => {
      const customHeaders = { 'X-Custom-Header': 'test-value' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await apiClient.get('/test', { headers: customHeaders });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/test', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Custom-Header': 'test-value',
        },
        credentials: 'include',
      });
    });

    it('should include custom headers in POST request', async () => {
      const customHeaders = { 'Authorization': 'Bearer token' };
      const testData = { message: 'test' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      } as Response);

      await apiClient.post('/test', testData, { headers: customHeaders });

      expect(mockFetch).toHaveBeenCalledWith('http://localhost:8000/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer token',
        },
        body: JSON.stringify(testData),
        credentials: 'include',
      });
    });
  });
});