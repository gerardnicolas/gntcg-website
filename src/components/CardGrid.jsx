import CardItem from './CardItem';

export default function CardGrid({
  cards,
  totalCards,
  emptyMessage,
  inquiry,
  onSelect,
  onAdd,
  onRemove,
}) {
  return (
    <main className="wrap">
      <p className="count">
        {cards.length} of {totalCards} cards
      </p>

      <div className="grid">
        {cards.length ? (
          cards.map((card) => (
            <CardItem
              key={card.id}
              card={card}
              quantity={inquiry[card.id] || 0}
              onSelect={onSelect}
              onAdd={onAdd}
              onRemove={onRemove}
            />
          ))
        ) : (
          <p className="empty">{emptyMessage}</p>
        )}
      </div>
    </main>
  );
}
