import * as SecureStore from 'expo-secure-store';

const CHUNK_SIZE = 1800; // expo-secure-store tiene límite de ~2KB por key

export const SecureStoreAdapter = {
  async getItem(key: string): Promise<string | null> {
    const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
    if (!chunkCount) return SecureStore.getItemAsync(key);
    const count = parseInt(chunkCount, 10);
    const chunks = await Promise.all(
      Array.from({ length: count }, (_, i) =>
        SecureStore.getItemAsync(`${key}_chunk_${i}`)
      )
    );
    if (chunks.some((c) => c === null)) return null;
    return chunks.join('');
  },

  async setItem(key: string, value: string): Promise<void> {
    if (value.length <= CHUNK_SIZE) {
      await SecureStore.setItemAsync(key, value);
      return;
    }
    const chunks: string[] = [];
    for (let i = 0; i < value.length; i += CHUNK_SIZE) {
      chunks.push(value.slice(i, i + CHUNK_SIZE));
    }
    await Promise.all(
      chunks.map((chunk, i) =>
        SecureStore.setItemAsync(`${key}_chunk_${i}`, chunk)
      )
    );
    await SecureStore.setItemAsync(`${key}_chunks`, String(chunks.length));
  },

  async removeItem(key: string): Promise<void> {
    const chunkCount = await SecureStore.getItemAsync(`${key}_chunks`);
    if (chunkCount) {
      const count = parseInt(chunkCount, 10);
      await Promise.all([
        ...Array.from({ length: count }, (_, i) =>
          SecureStore.deleteItemAsync(`${key}_chunk_${i}`)
        ),
        SecureStore.deleteItemAsync(`${key}_chunks`),
      ]);
    } else {
      await SecureStore.deleteItemAsync(key);
    }
  },
};
