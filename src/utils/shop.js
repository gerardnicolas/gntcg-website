
export const CONFIG = {
  shop: 'GN TCG',
  currency: '₱',
  messenger: 'https://m.me/gerardnicolas.j',
};

export const formatPrice = (amount) =>
  CONFIG.currency + amount.toLocaleString('en-US');

export function getStock(card) {
  if (card.qty === 0) return 'Sold';
  if (card.qty === 1) return 'Only 1 left';
  return `${card.qty} in stock`;
}

export function createInquiryMessage(inquiryCards, totalPrice) {
  const rows = inquiryCards.map(
    (card) =>
      `- ${card.quantity}× ${card.name} (${card.game}, ${card.set}${card.no ? ' ' + card.no : ''}) — ${formatPrice(card.price * card.quantity)}`
  );

  return `Hi! I’m interested in these cards:\n${rows.join('\n')}\n\nTotal: ${formatPrice(totalPrice)}\nIs everything still available?`;
}
