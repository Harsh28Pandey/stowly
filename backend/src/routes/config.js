import { Router } from 'express';

const router = Router();

router.get('/', (req, res) => {
  const maxFileMB = Number(process.env.MAX_FILE_MB) || 100;
  const maxFileBytes = maxFileMB * 1024 * 1024;
  const quotaGBDefault = Number(process.env.STORAGE_QUOTA_GB) || 500;
  const quotaBytesDefault = Math.round(quotaGBDefault * 1024 * 1024 * 1024);

  res.json({
    success: true,
    config: {
      app: {
        name: 'Stowly',
        tagline: 'Private Cloud Workspace & Zero-Knowledge Vault',
        version: '2.1.0',
        supportEmail: 'support@stowly.internal',
      },
      limits: {
        maxFileMB,
        maxFileBytes,
        quotaGBDefault,
        quotaBytesDefault,
        maxUploadFilesCount: 20,
        rateLimitWindowMinutes: 15,
        rateLimitMaxRequests: 60,
      },
      fileTypes: {
        blockedExtensions: ['exe', 'bat', 'cmd', 'com', 'scr', 'msi', 'vbs', 'ps1', 'jar', 'dll'],
        allowedPresets: ['images', 'videos', 'audio', 'documents', 'archives'],
      },
      security: {
        passwordRules: {
          minLength: 8,
          requireUpper: true,
          requireNumber: true,
          requireSpecial: true,
        },
        autoLockOptionsMinutes: [5, 10, 30, 0],
      },
      dropBoxes: {
        defaultMaxFiles: 50,
        maxFilesLimit: 1000,
        defaultMaxSizeMB: 25,
        maxSizeMBLimit: maxFileMB,
      },
      shelves: {
        heavyFileMB: 50,
        oldDaysThreshold: 90,
      },
      enums: {
        rejectionReasons: ['Not eligible', 'Duplicate account', 'Invalid information', 'Other'],
        vaultCategories: ['Login', 'Banking', 'Social', 'Work', 'Personal', 'Wi-Fi', 'Server', 'API', 'Other'],
        userStatuses: ['PENDING', 'APPROVED', 'REJECTED', 'SUSPENDED'],
      },
    },
  });
});

export default router;
