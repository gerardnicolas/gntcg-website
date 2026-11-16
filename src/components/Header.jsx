export default function Header({ game, totalItems, onOpenInquiry }) {
  return (
    <header className="top">
      <div className="wrap">
        <div>
          <p className="top-kicker">THE GN TCG COLLECTION</p>
          <h1>{game}</h1>
          <p>
            Find a card you love, add it to your list, and message me to confirm
            availability before buying.
          </p>
        </div>

        <button className="inq-btn" onClick={onOpenInquiry}>
          Inquiry list <span>{totalItems}</span>
        </button>
      </div>
    </header>
  );
}
