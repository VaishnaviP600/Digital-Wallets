import { supabase } from '../supabase';
import {
  generateKeyPair,
  exportPublicKey,
  exportPrivateKey,
  importPublicKey,
  importPrivateKey,
  encryptSymmetricKey,
  decryptSymmetricKey
} from './keys';

// Initialize user's key pair on first login
export async function initializeUserKeys(): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    // Check if user already has keys
    const { data: existingKeys, error: checkError } = await supabase
      .from('user_keypairs')
      .select('public_key')
      .eq('user_id', session.user.id)
      .single();

    if (checkError && checkError.code !== 'PGRST116') {
      throw checkError;
    }

    if (existingKeys) {
      return; // User already has keys
    }

    // Generate new key pair
    const keyPair = await generateKeyPair();
    const publicKey = await exportPublicKey(keyPair.publicKey);
    const privateKey = await exportPrivateKey(keyPair.privateKey);

    // Store keys in database
    const { error: insertError } = await supabase
      .from('user_keypairs')
      .insert([{
        user_id: session.user.id,
        public_key: publicKey,
        encrypted_private_key: privateKey // In production, encrypt with user password
      }]);

    if (insertError) {
      throw insertError;
    }
  } catch (error: any) {
    console.error('Error initializing user keys:', error);
    throw error;
  }
}

// Share a file with another user
export async function shareFile(fileId: string, recipientEmail: string): Promise<void> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    // Get recipient's user ID
    const { data: recipientId } = await supabase
      .rpc('get_user_id_by_email', { email: recipientEmail });

    if (!recipientId) {
      throw new Error('Recipient not found or email not verified');
    }

    // Get recipient's public key
    const { data: recipientKeyData, error: keyError } = await supabase
      .from('user_keypairs')
      .select('public_key')
      .eq('user_id', recipientId)
      .single();

    if (keyError || !recipientKeyData?.public_key) {
      throw new Error('Recipient needs to log in first to set up encryption');
    }

    // Get the file's encryption key
    const { data: fileData, error: fileError } = await supabase
      .from('encrypted_files')
      .select('encrypted_key')
      .eq('id', fileId)
      .single();

    if (fileError || !fileData) {
      throw new Error('File not found');
    }

    // Get owner's private key to decrypt the file key
    const { data: ownerKeyData, error: ownerKeyError } = await supabase
      .from('user_keypairs')
      .select('encrypted_private_key')
      .eq('user_id', session.user.id)
      .single();

    if (ownerKeyError || !ownerKeyData?.encrypted_private_key) {
      throw new Error('Owner keys not found');
    }

    // Re-encrypt the file key for the recipient
    const ownerPrivateKey = await importPrivateKey(ownerKeyData.encrypted_private_key);
    const recipientPublicKey = await importPublicKey(recipientKeyData.public_key);
    
    const fileKey = await decryptSymmetricKey(fileData.encrypted_key, ownerPrivateKey);
    const encryptedKeyForRecipient = await encryptSymmetricKey(fileKey, recipientPublicKey);

    // Create share record
    const { error: shareError } = await supabase
      .from('file_shares')
      .insert([{
        file_id: fileId,
        owner_id: session.user.id,
        shared_with_id: recipientId,
        encrypted_key: encryptedKeyForRecipient
      }]);

    if (shareError) {
      throw shareError;
    }
  } catch (error: any) {
    console.error('Error sharing file:', error);
    throw error;
  }
}

// Get files shared with the current user
export async function getSharedFiles() {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) {
      throw new Error('No authenticated user');
    }

    // Get user's private key
    const { data: keyData, error: keyError } = await supabase
      .from('user_keypairs')
      .select('encrypted_private_key')
      .eq('user_id', session.user.id)
      .single();

    if (keyError || !keyData?.encrypted_private_key) {
      throw new Error('Encryption keys not found');
    }

    const privateKey = await importPrivateKey(keyData.encrypted_private_key);

    // Get shared files
    const { data: shares, error: sharesError } = await supabase
      .from('file_shares')
      .select(`
        id,
        encrypted_key,
        encrypted_files (
          id,
          filename,
          encrypted_data,
          size,
          type
        )
      `)
      .eq('shared_with_id', session.user.id);

    if (sharesError) {
      throw sharesError;
    }

    // Process each shared file
    const processedFiles = await Promise.all((shares || []).map(async (share) => {
      const fileKey = await decryptSymmetricKey(share.encrypted_key, privateKey);
      
      return {
        id: share.encrypted_files.id,
        filename: share.encrypted_files.filename,
        size: share.encrypted_files.size,
        type: share.encrypted_files.type,
        encrypted_data: share.encrypted_files.encrypted_data,
        fileKey,
        shared: true
      };
    }));

    return processedFiles;
  } catch (error: any) {
    console.error('Error getting shared files:', error);
    throw error;
  }
}