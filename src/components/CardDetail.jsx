import { formatPrice, getStock } from '../utils/shop';

export default function CardDetail({
  card,
  quantity,
  onClose,
  onAdd,
  onRemove,
}) {
  if (!card) return null;

  const cannotAdd = card.qty === 0 || quantity >= card.qty;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="dlg detail-dialog" onClick={(e) => e.stopPropagation()}>
        <button className="x" onClick={onClose} aria-label="Close">
          ×
        </button>

        {card.img ? (
          <img src={card.img} alt={card.name} className="detail-art" />
        ) : (
          <div className="detail-art image-placeholder">No image available</div>
        )}

        <div className="detail-info">
          <h2>{card.name}</h2>
          <p className="meta">{card.game}</p>
          <p className="meta">{card.set}</p>

          <div className="detail-stats">
            <p>
              <strong>Card Number:</strong> {card.no || '—'}
            </p>
            <p>
              <strong>Rarity:</strong> {card.rarity || '—'}
            </p>
            <p>
              <strong>Price:</strong> {formatPrice(card.price)}
            </p>
            <p>
              <strong>Stock:</strong> {getStock(card)}
            </p>
          </div>

          {card.desc && <p className="detail-description">{card.desc}</p>}

          {quantity > 0 ? (
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
                  {quantity}
                </output>
                <button
                  className="quantity-btn"
                  aria-label={`Add one ${card.name}`}
                  disabled={cannotAdd}
                  onClick={() => onAdd(card)}
                >
                  +
                </button>
              </div>
            </div>
          ) : cannotAdd ? (
            <button className="inq-btn" disabled>
              Unavailable
            </button>
          ) : (
            <button className="inq-btn" onClick={() => onAdd(card)}>
              Add to list
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
