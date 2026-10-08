/**
 * Sample Data Generator for Public Landing & Product Demonstration Pages ONLY.
 * This sample data is strictly isolated to unauthenticated marketing previews
 * and is NEVER mixed with signed-in user database records or state.
 */

export const SAMPLE_WORKSPACE_DEMO = {
  stats: {
    totalFiles: 42,
    activeDropBoxes: 3,
    encryptedKeys: 18,
    storageUsedFormatted: '14.2 GB',
    storageQuotaFormatted: '500 GB',
    storagePercent: 2.8,
  },
  shelves: [
    { name: 'Pictures', count: 18, sizeFormatted: '6.4 GB', icon: 'ImageIcon', color: 'text-sky-400' },
    { name: 'Documents', count: 12, sizeFormatted: '1.2 GB', icon: 'FileText', color: 'text-brand-400' },
    { name: 'Videos', count: 5, sizeFormatted: '5.8 GB', icon: 'Film', color: 'text-amber-400' },
    { name: 'Archives', count: 7, sizeFormatted: '800 MB', icon: 'Archive', color: 'text-orange-400' },
  ],
  dropBoxPreview: {
    title: 'Q4 Project Assets Upload',
    ownerName: 'Stowly Workspace Owner',
    remaining: 15,
    maxFiles: 20,
    maxSizeMB: 50,
    allowedTypes: ['pdf', 'png', 'jpg', 'zip', 'docx'],
    expiresIn: '6 days remaining',
  },
  keyringPreview: [
    { category: 'Login', name: 'Github Enterprise', domain: 'github.com', favorite: true },
    { category: 'Banking', name: 'Corporate Account', domain: 'chase.com', favorite: true },
    { category: 'API', name: 'Cloudflare Admin Key', domain: 'cloudflare.com', favorite: false },
  ],
};
