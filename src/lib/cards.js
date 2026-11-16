import supabase from './supabase';

export function getCardImageUrl(path) {
  if (!path) return '';
  if (path.startsWith('/') || path.startsWith('http')) return path;
  if (!supabase) return '';

  return supabase.storage.from('card-images').getPublicUrl(path).data.publicUrl;
}

function getHue(name) {
  let hue = 0;
  for (const character of name) {
    hue = (hue * 31 + character.charCodeAt(0)) % 360;
  }
  return hue;
}

export function mapDatabaseCard(row) {
  return {
    id: Number(row.id),
    game: row.game,
    name: row.name,
    cardType: row.card_type || '',
    set: row.set_name || '',
    no: row.card_no || '',
    rarity: row.rarity || '',
    price: Number(row.price),
    qty: Number(row.quantity),
    desc: row.description || '',
    hue: getHue(row.name),
    imagePath: row.image_path || '',
    img: getCardImageUrl(row.image_path),
    isPublished: row.is_published,
  };
}
