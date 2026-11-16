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
  if (!isOpen) return null;

  const message = createInquiryMessage(cards, totalPrice);

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="dlg inquiry-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Close">
          ×
        </button>

        <h2>Your inquiry list</h2>

        {cards.length ? (
          <>
            {cards.map((card) => (
              <div className="line" key={card.id}>
                <div className="line-info">
                  <strong>{card.name}</strong>
                  <small className="meta">{card.set}</small>
                  <span className="line-price">
                    {formatPrice(card.price * card.quantity)}
                  </span>
                </div>

                <div className="quantity-control">
                  <span className="quantity-label">In list</span>
                  <div className="quantity-stepper">
                    <button
                      className="quantity-btn"
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

            <div className="total">
              <span>Total</span>
              <span>{formatPrice(totalPrice)}</span>
            </div>

            <textarea readOnly value={message} />

            <div className="actions">
              <button className="inq-btn" onClick={onSendMessenger}>
                Send by Messenger
              </button>

              <button className="add" onClick={onCopyMessage}>
                Copy message
              </button>
            </div>
          </>
        ) : (
          <p className="meta">
            Your list is empty. Add cards from the shop and send me the list
            when you're ready.
          </p>
        )}
      </div>
    </div>
  );
}
