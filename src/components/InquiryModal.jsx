import { useEffect } from 'react';

import { formatPrice, createInquiryMessage } from '../utils/shop';

export default function InquiryModal({
  isOpen,
  cards,
  totalPrice,
  onClose,
  onAdd,
  onRemove,
  onSendMessenger,
  onCopyMessage,
}) {
  useEffect(() => {
    if (!isOpen) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const message = createInquiryMessage(cards, totalPrice);
  const totalItems = cards.reduce((sum, card) => sum + card.quantity, 0);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="dlg inquiry-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="inquiry-title"
        onClick={(e) => e.stopPropagation()}
      >
        <header className="inquiry-header">
          <div>
            <h2 id="inquiry-title">Your inquiry list</h2>
            {cards.length > 0 && (
              <p className="inquiry-count">
                {cards.length} {cards.length === 1 ? 'card' : 'card types'} ·{' '}
                {totalItems} {totalItems === 1 ? 'item' : 'items'}
              </p>
            )}
          </div>
          <button
            className="x"
            type="button"
            onClick={onClose}
            aria-label="Close inquiry list"
          >
            ×
          </button>
        </header>

        {cards.length ? (
          <>
            <div className="inquiry-items" role="list" aria-label="Cards in your inquiry">
              {cards.map((card) => (
                <div className="line inquiry-line" key={card.id} role="listitem">
                  <div className="line-info">
                    <strong>{card.name}</strong>
                    <small className="meta">
                      {card.game}
                      {card.set ? ` · ${card.set}` : ''}
                      {card.no ? ` · ${card.no}` : ''}
                    </small>
                    <span className="line-price">
                      {formatPrice(card.price * card.quantity)}
                      {card.quantity > 1 && (
                        <small>{formatPrice(card.price)} each</small>
                      )}
                    </span>
                  </div>

                  <div className="quantity-control">
                    <span className="quantity-label">In list</span>
                    <div className="quantity-stepper">
                      <button
                        className="quantity-btn"
                        type="button"
                        aria-label={`Remove one ${card.name}`}
                        onClick={() => onRemove(card.id)}
                      >
                        −
                      </button>
                      <output className="quantity-count" aria-live="polite">
                        {card.quantity}
                      </output>
                      <button
                        className="quantity-btn"
                        type="button"
                        aria-label={`Add one ${card.name}`}
                        disabled={card.quantity >= card.qty}
                        onClick={() => onAdd(card)}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="inquiry-footer">
              <div className="total">
                <span>Estimated total</span>
                <span>{formatPrice(totalPrice)}</span>
              </div>

              <details className="inquiry-preview" open>
                <summary>Preview message</summary>
                <textarea
                  aria-label="Inquiry message preview"
                  readOnly
                  rows="4"
                  value={message}
                />
              </details>

              <div className="actions">
                <button className="inq-btn" type="button" onClick={onSendMessenger}>
                  Send by Messenger
                </button>

                <button className="add" type="button" onClick={onCopyMessage}>
                  Copy message
                </button>
              </div>
            </div>
          </>
        ) : (
          <p className="meta inquiry-empty">
            Your list is empty. Add cards from the shop and send me the list
            when you're ready.
          </p>
        )}
      </div>
    </div>
  );
}
