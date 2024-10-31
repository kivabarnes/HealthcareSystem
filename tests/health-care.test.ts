import { describe, test, expect, beforeEach, vi } from 'vitest';
import {
  Client,
  Provider,
  Result,
  principalCV,
  stringAsciiCV,
  uintCV,
  bufferCV
} from '@stacks/transactions';
import { MockNet } from '@stacks/network';

// Mock contract calls interface
interface ContractCalls {
  registerPatient: (encryptionKey: Buffer) => Promise<Result>;
  registerProvider: (name: string) => Promise<Result>;
  grantConsent: (provider: string, accessType: string, duration: number) => Promise<Result>;
  revokeConsent: (provider: string) => Promise<Result>;
  requestDataAccess: (patient: string, dataType: string) => Promise<Result>;
  claimSharingReward: (provider: string) => Promise<Result>;
  getPatientData: (patient: string) => Promise<Result>;
  getProviderInfo: (provider: string) => Promise<Result>;
  checkConsentStatus: (patient: string, provider: string) => Promise<Result>;
  getAccessLogs: (index: number) => Promise<Result>;
}

describe('Healthcare Data Sharing System Tests', () => {
  let mockNet: MockNet;
  let client: Client;
  let contractCalls: ContractCalls;
  
  // Test data
  const testPatient = 'ST1PQHQKV0RJXZFY1DGX8MNSNYVE3VGZJSRTPGZGM';
  const testProvider = 'ST2CY5V39NHDPWSXMW9QDT3HC3GD6Q6XX4CFRK9AG';
  const testEncryptionKey = Buffer.from('0123456789abcdef0123456789abcdef');
  
  beforeEach(async () => {
    // Setup mock network and client
    mockNet = new MockNet();
    client = new Client(mockNet);
    
    // Initialize contract calls with mocked responses
    contractCalls = {
      registerPatient: vi.fn(),
      registerProvider: vi.fn(),
      grantConsent: vi.fn(),
      revokeConsent: vi.fn(),
      requestDataAccess: vi.fn(),
      claimSharingReward: vi.fn(),
      getPatientData: vi.fn(),
      getProviderInfo: vi.fn(),
      checkConsentStatus: vi.fn(),
      getAccessLogs: vi.fn()
    };
  });
  
  describe('Patient Registration', () => {
    test('should successfully register a new patient', async () => {
      const mockResponse = {
        success: true,
        data: {
          registered: true,
          dataHash: null,
          encryptionKey: testEncryptionKey
        }
      };
      
      contractCalls.registerPatient.mockResolvedValue(mockResponse);
      
      const result = await contractCalls.registerPatient(testEncryptionKey);
      
      expect(result.success).toBe(true);
      expect(result.data.registered).toBe(true);
      expect(result.data.encryptionKey).toEqual(testEncryptionKey);
      expect(contractCalls.registerPatient).toHaveBeenCalledWith(testEncryptionKey);
    });
    
    test('should fail registering existing patient', async () => {
      const mockError = {
        success: false,
        error: 'err-already-registered'
      };
      
      contractCalls.registerPatient.mockRejectedValue(mockError);
      
      await expect(contractCalls.registerPatient(testEncryptionKey))
          .rejects.toEqual(mockError);
    });
  });
  
  describe('Provider Registration', () => {
    test('should successfully register a new provider', async () => {
      const providerName = 'Test Hospital';
      const mockResponse = {
        success: true,
        data: {
          name: providerName,
          verified: false,
          rating: 0
        }
      };
      
      contractCalls.registerProvider.mockResolvedValue(mockResponse);
      
      const result = await contractCalls.registerProvider(providerName);
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe(providerName);
      expect(result.data.verified).toBe(false);
      expect(contractCalls.registerProvider).toHaveBeenCalledWith(providerName);
    });
  });
  
  describe('Consent Management', () => {
    test('should grant consent successfully', async () => {
      const accessType = 'full';
      const duration = 30;
      const mockResponse = {
        success: true,
        data: {
          granted: true,
          timestamp: Date.now(),
          expiration: Date.now() + (duration * 24 * 60 * 60 * 1000),
          accessType
        }
      };
      
      contractCalls.grantConsent.mockResolvedValue(mockResponse);
      
      const result = await contractCalls.grantConsent(testProvider, accessType, duration);
      
      expect(result.success).toBe(true);
      expect(result.data.granted).toBe(true);
      expect(result.data.accessType).toBe(accessType);
      expect(contractCalls.grantConsent).toHaveBeenCalledWith(testProvider, accessType, duration);
    });
    
    test('should revoke consent successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          granted: false,
          timestamp: Date.now(),
          expiration: 0,
          accessType: 'none'
        }
      };
      
      contractCalls.revokeConsent.mockResolvedValue(mockResponse);
      
      const result = await contractCalls.revokeConsent(testProvider);
      
      expect(result.success).toBe(true);
      expect(result.data.granted).toBe(false);
      expect(result.data.accessType).toBe('none');
      expect(contractCalls.revokeConsent).toHaveBeenCalledWith(testProvider);
    });
  });
  
  describe('Data Access', () => {
    test('should allow authorized access to data', async () => {
      const dataType = 'medical_history';
      const mockResponse = {
        success: true,
        data: {
          encryptionKey: testEncryptionKey
        }
      };
      
      contractCalls.requestDataAccess.mockResolvedValue(mockResponse);
      
      const result = await contractCalls.requestDataAccess(testPatient, dataType);
      
      expect(result.success).toBe(true);
      expect(result.data.encryptionKey).toEqual(testEncryptionKey);
      expect(contractCalls.requestDataAccess).toHaveBeenCalledWith(testPatient, dataType);
    });
    
    test('should deny unauthorized access to data', async () => {
      const dataType = 'medical_history';
      const mockError = {
        success: false,
        error: 'err-unauthorized'
      };
      
      contractCalls.requestDataAccess.mockRejectedValue(mockError);
      
      await expect(contractCalls.requestDataAccess(testPatient, dataType))
          .rejects.toEqual(mockError);
    });
  });
  
  describe('Token Rewards', () => {
    test('should claim reward successfully', async () => {
      const mockResponse = {
        success: true,
        data: {
          rewardAmount: 100
        }
      };
      
      contractCalls.claimSharingReward.mockResolvedValue(mockResponse);
      
      const result = await contractCalls.claimSharingReward(testProvider);
      
      expect(result.success).toBe(true);
      expect(result.data.rewardAmount).toBe(100);
      expect(contractCalls.claimSharingReward).toHaveBeenCalledWith(testProvider);
    });
  });
  
  describe('Read Operations', () => {
    test('should get patient data', async () => {
      const mockResponse = {
        success: true,
        data: {
          registered: true,
          dataHash: null,
          encryptionKey: testEncryptionKey
        }
      };
      
      contractCalls.getPatientData.mockResolvedValue(mockResponse);
      
      const result = await contractCalls.getPatientData(testPatient);
      
      expect(result.success).toBe(true);
      expect(result.data.registered).toBe(true);
      expect(result.data.encryptionKey).toEqual(testEncryptionKey);
    });
    
    test('should get provider info', async () => {
      const mockResponse = {
        success: true,
        data: {
          name: 'Test Hospital',
          verified: true,
          rating: 4
        }
      };
      
      contractCalls.getProviderInfo.mockResolvedValue(mockResponse);
      
      const result = await contractCalls.getProviderInfo(testProvider);
      
      expect(result.success).toBe(true);
      expect(result.data.name).toBe('Test Hospital');
      expect(result.data.verified).toBe(true);
      expect(result.data.rating).toBe(4);
    });
    
    test('should check consent status', async () => {
      const mockResponse = {
        success: true,
        data: {
          granted: true,
          timestamp: Date.now(),
          expiration: Date.now() + (30 * 24 * 60 * 60 * 1000),
          accessType: 'full'
        }
      };
      
      contractCalls.checkConsentStatus.mockResolvedValue(mockResponse);
      
      const result = await contractCalls.checkConsentStatus(testPatient, testProvider);
      
      expect(result.success).toBe(true);
      expect(result.data.granted).toBe(true);
      expect(result.data.accessType).toBe('full');
    });
    
    test('should retrieve access logs', async () => {
      const mockResponse = {
        success: true,
        data: {
          patient: testPatient,
          provider: testProvider,
          timestamp: Date.now(),
          dataType: 'medical_history'
        }
      };
      
      contractCalls.getAccessLogs.mockResolvedValue(mockResponse);
      
      const result = await contractCalls.getAccessLogs(0);
      
      expect(result.success).toBe(true);
      expect(result.data.patient).toBe(testPatient);
      expect(result.data.provider).toBe(testProvider);
    });
  });
});

