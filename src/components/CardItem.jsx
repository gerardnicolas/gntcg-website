import { formatPrice, getStock } from '../utils/shop';

export default function CardItem({
  card,
  quantity,
  onSelect,
  onAdd,
  onRemove,
}) {
  const soldOut = card.qty === 0;
  const full = quantity >= card.qty;

  return (
    <article
      className={`item ${soldOut ? 'sold' : ''} ${quantity ? 'inl' : ''}`}
    >
      <div
        className="art"
        onClick={() => onSelect(card)}
        style={{
          background: card.img
            ? `url("${card.img}") center/cover`
            : `linear-gradient(155deg, hsl(${card.hue} 70% 55%), hsl(${(card.hue + 50) % 360} 60% 22%))`,
        }}
      >
        {card.rarity && <i>{card.rarity}</i>}

        {!card.img && (
          <b>
            {card.name
              .split(' ')
              .map((word) => word[0])
              .join('')
              .slice(0, 2)}
          </b>
        )}
      </div>

      <div>
        <h3 onClick={() => onSelect(card)}>{card.name}</h3>
        <p className="meta">{card.game}</p>
        <p className="meta">
          {card.set}
          {card.no ? ` · ${card.no}` : ''}
        </p>
      </div>

      <div className="row">
        <span className="price">{formatPrice(card.price)}</span>
        <span className={`stock ${card.qty <= 1 ? 'low' : ''}`}>
          {getStock(card)}
        </span>
      </div>

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
              disabled={soldOut || full}
              onClick={() => onAdd(card)}
            >
              +
            </button>
          </div>
        </div>
      ) : (
        <button
          className="add"
          disabled={soldOut}
          onClick={() => onAdd(card)}
        >
          {soldOut ? 'Sold out' : 'Add to list'}
        </button>
      )}
    </article>
  );
}
