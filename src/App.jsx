import { useEffect, useMemo, useState } from 'react';

import CARDS from './data/cards';
import AdminDashboard from './components/AdminDashboard';
import { CONFIG, formatPrice } from './utils/shop';
import { mapDatabaseCard } from './lib/cards';
import supabase from './lib/supabase';

import Header from './components/Header';
import FilterBar from './components/FilterBar';
import CardGrid from './components/CardGrid';
import CardDetail from './components/CardDetail';
import InquiryModal from './components/InquiryModal';
import Footer from './components/Footer';
import Toast from './components/Toast';

const GAMES = {
  riftbound: {
    name: 'Riftbound',
    shortName: 'Riftbound',
    cardClass: 'riftbound',
    description: 'League of Legends trading card game.',
  },
  braverse: {
    name: 'CookieRun: Braverse',
    shortName: 'CookieRun: Braverse',
    cardClass: 'braverse',
    description: 'A sweet adventure, one card at a time.',
  },
};

function gameFromHash() {
  const hash = window.location.hash.slice(1);
  return hash === 'riftbound' || hash === 'braverse' ? hash : '';
}

function Storefront() {
  const [search, setSearch] = useState('');
  const [activeGame, setActiveGame] = useState(gameFromHash);
  const [selectedSet, setSelectedSet] = useState('');
  const [sort, setSort] = useState('new');
  const [cards, setCards] = useState(supabase ? [] : CARDS);
  const [catalogLoading, setCatalogLoading] = useState(Boolean(supabase));
  const [catalogError, setCatalogError] = useState('');

  const [inquiry, setInquiry] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('inq') || '{}');
    } catch {
      return {};
    }
  });

  const [selectedCard, setSelectedCard] = useState(null);
  const [showInquiry, setShowInquiry] = useState(false);
  const [toast, setToast] = useState('');

  useEffect(() => {
    if (!supabase) return undefined;

    let active = true;

    async function loadCards() {
      try {
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .eq('is_published', true)
          .order('id');

        if (!active) return;
        if (error) {
          setCatalogError(error.message);
        } else {
          setCards(data.map(mapDatabaseCard));
        }
      } catch (error) {
        if (!active) return;
        setCatalogError(
          error instanceof Error ? error.message : 'Something went wrong.',
        );
      } finally {
        if (active) setCatalogLoading(false);
      }
    }

    loadCards();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    function syncGameFromHash() {
      setActiveGame(gameFromHash());
      setSearch('');
      setSelectedSet('');
    }

    window.addEventListener('hashchange', syncGameFromHash);
    return () => window.removeEventListener('hashchange', syncGameFromHash);
  }, []);

  useEffect(() => {
    localStorage.setItem('inq', JSON.stringify(inquiry));
  }, [inquiry]);

  const sets = [
    ...new Set(
      cards.filter((card) => card.game === GAMES[activeGame]?.name)
        .map((card) => card.set)
        .filter(Boolean),
    ),
  ];

  const filteredCards = useMemo(() => {
    const query = search.trim().toLowerCase();

    const result = cards.filter((card) => {
      const matchesSearch =
        !query ||
        `${card.name} ${card.game} ${card.set} ${card.no || ''} ${card.rarity || ''}`
          .toLowerCase()
          .includes(query);

      const matchesGame = card.game === GAMES[activeGame]?.name;
      const matchesSet = !selectedSet || card.set === selectedSet;

      return matchesSearch && matchesGame && matchesSet;
    });

    return result.sort((a, b) => {
      if (sort === 'lo') return a.price - b.price;
      if (sort === 'hi') return b.price - a.price;
      if (sort === 'az') return a.name.localeCompare(b.name);

      return b.id - a.id;
    });
  }, [cards, search, activeGame, selectedSet, sort]);

  const inquiryCards = Object.entries(inquiry)
    .map(([id, quantity]) => {
      const card = cards.find((item) => String(item.id) === id);
      return card ? { ...card, quantity } : null;
    })
    .filter(Boolean);

  const totalItems = inquiryCards.reduce((sum, card) => sum + card.quantity, 0);

  const totalPrice = inquiryCards.reduce(
    (sum, card) => sum + card.price * card.quantity,
    0,
  );

  function notify(message) {
    setToast(message);
    setTimeout(() => setToast(''), 1800);
  }

  function addCard(card) {
    const current = inquiry[card.id] || 0;

    if (current >= card.qty) return;

    setInquiry((previous) => ({
      ...previous,
      [card.id]: (previous[card.id] || 0) + 1,
    }));

    notify(`Added ${card.name}`);
  }

  function removeCard(id) {
    setInquiry((previous) => {
      const updated = { ...previous };

      if (updated[id] <= 1) {
        delete updated[id];
      } else {
        updated[id] -= 1;
      }

      return updated;
    });
  }

  function createMessage() {
    const rows = inquiryCards.map(
      (card) =>
        `- ${card.quantity}× ${card.name} (${card.game}, ${card.set}${card.no ? ' ' + card.no : ''}) — ${formatPrice(card.price * card.quantity)}`,
    );

    return `Hi! I’m interested in these cards:\n${rows.join('\n')}\n\nTotal: ${formatPrice(totalPrice)}\nIs everything still available?`;
  }

  async function sendMessenger() {
    try {
      await navigator.clipboard.writeText(createMessage());
    } catch {
      // The message remains available in the preview.
    }

    window.open(CONFIG.messenger, '_blank', 'noopener,noreferrer');
  }

  async function copyMessage() {
    try {
      await navigator.clipboard.writeText(createMessage());
      notify('Message copied!');
    } catch {
      notify('Please copy the message manually.');
    }
  }

  if (!activeGame) {
    return (
      <div className="home-page">
        <div className="home-wrap">
          <nav className="home-nav" aria-label="Main navigation">
            <a className="home-brand" href="#home">
              <span className="brand-mark">G</span>
              <span>GN TCG</span>
            </a>
          </nav>

          <main>
            <section className="home-hero">
              <p className="home-kicker">
                <span /> THE COLLECTION
              </p>
              <h1>
                Two worlds.
                <br />
                <span>One collection.</span>
              </h1>
              <p className="home-intro">
                Explore cards from two worlds, build a list of favorites, then
                message to check availability.
              </p>
              <a className="home-cta" href="#games">
                Explore collections <span aria-hidden="true">↓</span>
              </a>
            </section>

            <section
              className="game-choices"
              id="games"
              aria-label="Choose a game"
            >
              {Object.entries(GAMES).map(([key, game]) => {
                const count = cards.filter(
                  (card) => card.game === game.name,
                ).length;

                return (
                  <a
                    className={`game-choice ${game.cardClass}`}
                    href={`#${key}`}
                    key={key}
                  >
                    <div className="game-art" aria-hidden="true">
                      {key === 'riftbound' ? (
                        <>
                          <span className="rift-orbit orbit-one" />
                          <span className="rift-orbit orbit-two" />
                          <img src="/images/sett_showcase_rad.webp" alt="" />
                          <span className="art-caption">ENTER THE ARENA</span>
                        </>
                      ) : (
                        <>
                          <span className="cookie-spark spark-one">✦</span>
                          <span className="cookie-spark spark-two">✦</span>
                          <span className="cookie-orbit">
                            <span className="cookie-emoji">🍪</span>
                          </span>
                          <span className="art-caption">A LITTLE MAGIC</span>
                        </>
                      )}
                    </div>
                    <div className="game-choice-info">
                      <div>
                        <p className="game-label">THE CARD GAME</p>
                        <h2>{game.name}</h2>
                        <p className="game-description">{game.description}</p>
                      </div>
                      <div className="game-choice-bottom">
                        <span className="game-count">
                          {count} {count === 1 ? 'card' : 'cards'} listed
                        </span>
                        <span className="game-arrow" aria-hidden="true">
                          ↗
                        </span>
                      </div>
                    </div>
                  </a>
                );
              })}
            </section>

            <section className="home-assurance" aria-label="How it works">
              <div>
                <span className="assurance-number">01</span>
                <p>
                  <strong>Choose your game</strong>
                  <span>Browse by collection</span>
                </p>
              </div>
              <div>
                <span className="assurance-number">02</span>
                <p>
                  <strong>Build your list</strong>
                  <span>Prices shown in PHP</span>
                </p>
              </div>
              <div>
                <span className="assurance-number">03</span>
                <p>
                  <strong>Message to confirm</strong>
                  <span>Check availability before buying</span>
                </p>
              </div>
            </section>
          </main>

          <footer className="home-footer">
            <span>
              GN TCG <span className="footer-dot">•</span> PHILIPPINES
            </span>
          </footer>
        </div>
      </div>
    );
  }

  const currentGame = GAMES[activeGame];
  const availableCards = CARDS.filter(
    (card) => card.game === currentGame.name,
  ).length;

  return (
    <>
      <nav className="catalog-nav" aria-label="Game navigation">
        <div className="wrap">
          <a className="catalog-brand" href="#home">
            <span className="brand-mark">G</span>
            <span>GN TCG</span>
          </a>
          <div className="catalog-game-links">
            {Object.entries(GAMES).map(([key, game]) => (
              <a
                aria-current={activeGame === key ? 'page' : undefined}
                className={activeGame === key ? 'active' : ''}
                href={`#${key}`}
                key={key}
              >
                {game.shortName}
              </a>
            ))}
          </div>
        </div>
      </nav>

      <Header
        game={currentGame.name}
        totalItems={totalItems}
        onOpenInquiry={() => setShowInquiry(true)}
      />

      <FilterBar
        search={search}
        setSearch={setSearch}
        selectedSet={selectedSet}
        setSelectedSet={setSelectedSet}
        sort={sort}
        setSort={setSort}
        sets={sets}
      />

      {catalogError && (
        <p className="catalog-error" role="alert">
          Could not load cards from Supabase: {catalogError}
        </p>
      )}

      <CardGrid
        cards={filteredCards}
        totalCards={catalogLoading ? 0 : availableCards}
        emptyMessage={
          catalogLoading
            ? 'Loading cards…'
            : availableCards === 0
            ? 'No cards listed for this game just yet. Check back soon.'
            : 'No cards match. Clear the search or pick a different set.'
        }
        inquiry={inquiry}
        onSelect={setSelectedCard}
        onAdd={addCard}
        onRemove={removeCard}
      />

      <Footer />

      <CardDetail
        card={selectedCard}
        quantity={selectedCard ? inquiry[selectedCard.id] || 0 : 0}
        onClose={() => setSelectedCard(null)}
        onAdd={addCard}
        onRemove={removeCard}
      />

      <InquiryModal
        isOpen={showInquiry}
        cards={inquiryCards}
        totalPrice={totalPrice}
        onClose={() => setShowInquiry(false)}
        onAdd={addCard}
        onRemove={removeCard}
        onSendMessenger={sendMessenger}
        onCopyMessage={copyMessage}
      />

      <Toast message={toast} />
    </>
  );
}

export default function App() {
  if (window.location.pathname === '/admin' || window.location.pathname === '/admin/') {
    return <AdminDashboard />;
  }

  return <Storefront />;
}
