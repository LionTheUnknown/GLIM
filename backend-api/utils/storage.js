const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const { SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_BUCKET } = process.env;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_BUCKET) {
  console.warn('[storage] Missing Supabase config; avatar uploads will fail without proper env vars.');
}

const supabase = SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
  : null;

const generateKey = (userId, ext) =>
  `avatars/${userId}/${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;

async function uploadAvatarBuffer(buffer, userId, contentType, ext) {
  if (!supabase) throw new Error('Supabase client not configured');

  const key = generateKey(userId, ext);

  const { error: uploadError } = await supabase.storage
    .from(SUPABASE_BUCKET)
    .upload(key, buffer, {
      contentType,
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw uploadError;
  }

  const { data } = supabase.storage.from(SUPABASE_BUCKET).getPublicUrl(key);
  if (!data?.publicUrl) {
    throw new Error('Failed to get public URL for avatar');
  }
  return { publicUrl: data.publicUrl, key };
}

async function deleteAvatar(key) {
  if (!supabase || !key) return;
  await supabase.storage.from(SUPABASE_BUCKET).remove([key]);
}

function extractKeyFromUrl(url) {
  if (!url) return null;
  try {
    const idx = url.indexOf('/storage/v1/object/public/');
    if (idx === -1) return null;
    const after = url.substring(idx + '/storage/v1/object/public/'.length);
    const parts = after.split('/');
    if (parts.length < 2) return null;
    const bucket = parts.shift();
    if (bucket !== SUPABASE_BUCKET) return null;
    return parts.join('/');
  } catch {
    return null;
  }
}

module.exports = {
  uploadAvatarBuffer,
  deleteAvatar,
  extractKeyFromUrl,
};

