import { useEffect, useMemo, useRef, useState } from 'react';

import { mapDatabaseCard } from '../lib/cards';
import supabase from '../lib/supabase';

const BUCKET = 'card-images';
const MAX_IMAGE_SIZE = 8 * 1024 * 1024;
const IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];
const EMPTY_CARDS = [];

const EMPTY_FORM = {
  game: 'Riftbound',
  name: '',
  cardType: '',
  set: '',
  no: '',
  rarity: '',
  price: '',
  qty: '1',
  desc: '',
  isPublished: true,
};

function messageFromError(error) {
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function uniqueSorted(values) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b),
  );
}

function csvCell(value) {
  const text = String(value ?? '');
  const safeText = /^[\t\r ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function downloadCardsCsv(cards) {
  const columns = [
    ['ID', (card) => card.id],
    ['Game', (card) => card.game],
    ['Name', (card) => card.name],
    ['Card Type', (card) => card.cardType],
    ['Set', (card) => card.set],
    ['Card Number', (card) => card.no],
    ['Rarity', (card) => card.rarity],
    ['Price', (card) => card.price],
    ['Quantity', (card) => card.qty],
    ['Published', (card) => (card.isPublished ? 'Published' : 'Hidden')],
    ['Description', (card) => card.desc],
    ['Image Path', (card) => card.imagePath],
  ];
  const rows = [
    columns.map(([label]) => csvCell(label)).join(','),
    ...cards.map((card) =>
      columns.map(([, getValue]) => csvCell(getValue(card))).join(','),
    ),
  ];
  const csv = `\uFEFF${rows.join('\r\n')}`;
  const url = URL.createObjectURL(
    new Blob([csv], { type: 'text/csv;charset=utf-8' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = `gn-tcg-inventory-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

function SetupNotice() {
  return (
    <main className="admin-page">
      <section className="admin-panel admin-login">
        <p className="admin-kicker">GN TCG · ADMIN</p>
        <h1>Connect Supabase</h1>
        <p>
          Add your project URL and anon key to <code>.env.local</code>, then
          restart the development server. Follow the Supabase setup guide in
          the README.
        </p>
        <a className="admin-text-link" href="/">
          Return to storefront
        </a>
      </section>
    </main>
  );
}

function AdminSignIn({ onSignedIn, error, setError }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const { data, error: signInError } =
        await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
      } else {
        onSignedIn(data.session);
      }
    } catch (error) {
      setError(messageFromError(error));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="admin-page">
      <section className="admin-panel admin-login">
        <p className="admin-kicker">GN TCG · ADMIN</p>
        <h1>Sign in</h1>
        <p>Sign in with the administrator account for this store.</p>
        <form className="admin-form" onSubmit={handleSubmit}>
          <label>
            Email
            <input
              autoComplete="username"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>
          <label>
            Password
            <input
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
            />
          </label>
          {error && <p className="admin-alert error">{error}</p>}
          <button className="admin-button primary" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
        <a className="admin-text-link" href="/">
          Return to storefront
        </a>
      </section>
    </main>
  );
}

function CardEditor({ card, onSave, onCancel, busy }) {
  const [form, setForm] = useState(() =>
    card
      ? {
          game: card.game,
          name: card.name,
          cardType: card.cardType,
          set: card.set,
          no: card.no,
          rarity: card.rarity,
          price: String(card.price),
          qty: String(card.qty),
          desc: card.desc,
          isPublished: card.isPublished,
        }
      : EMPTY_FORM,
  );
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(card?.img || '');
  const [imageError, setImageError] = useState('');

  useEffect(
    () => () => {
      if (imagePreview.startsWith('blob:')) URL.revokeObjectURL(imagePreview);
    },
    [imagePreview],
  );

  function update(field, value) {
    setForm((previous) => ({ ...previous, [field]: value }));
  }

  function handleImageChange(event) {
    const file = event.target.files?.[0] || null;
    event.target.value = '';
    setImageError('');

    if (!file) return;

    if (!IMAGE_TYPES.includes(file.type)) {
      setImageError('Choose a JPG, PNG, WebP, or AVIF image.');
      setImageFile(null);
      setImagePreview(card?.img || '');
    } else if (file.size > MAX_IMAGE_SIZE) {
      setImageError('Images must be 8 MB or smaller.');
      setImageFile(null);
      setImagePreview(card?.img || '');
    } else {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  }

  return (
    <main className="admin-page">
      <div className="admin-shell listing-editor-shell">
        <button
          className="admin-text-button listing-back"
          type="button"
          onClick={onCancel}
          disabled={busy}
        >
          <span aria-hidden="true">←</span> Back to listings
        </button>

        <header className="listing-page-heading">
          <div>
            <p className="admin-kicker">{card ? 'UPDATE LISTING' : 'NEW LISTING'}</p>
            <h1>{card ? 'Edit card' : 'Add a card'}</h1>
            <p>Enter the card details, set your price, and choose an image.</p>
          </div>
          {card && (
            <span className={`admin-status ${card.isPublished ? 'published' : ''}`}>
              {card.isPublished ? 'Published' : 'Hidden'}
            </span>
          )}
        </header>

        <form
          className="listing-form"
          onSubmit={(event) => {
            event.preventDefault();
            if (!imageError) onSave(form, imageFile);
          }}
        >
          <div className="listing-form-layout">
            <section className="admin-panel listing-panel" aria-labelledby="listing-details-title">
              <div className="listing-section-heading">
                <span className="listing-step">01</span>
                <div>
                  <h2 id="listing-details-title">Card details</h2>
                  <p>Help buyers find the right card.</p>
                </div>
              </div>

              <div className="listing-fields">
                <label className="listing-field listing-field-full">
                  <span>Card name <b>*</b></span>
                  <input
                    placeholder="e.g. Ahri, Nine-Tailed Fox"
                    value={form.name}
                    onChange={(event) => update('name', event.target.value)}
                    required
                  />
                </label>

                <label className="listing-field">
                  <span>Game <b>*</b></span>
                  <select
                    value={form.game}
                    onChange={(event) => update('game', event.target.value)}
                  >
                    <option>Riftbound</option>
                    <option>CookieRun: Braverse</option>
                  </select>
                </label>

                <label className="listing-field">
                  <span>Set <b>*</b></span>
                  <input
                    placeholder="e.g. Radiance"
                    value={form.set}
                    onChange={(event) => update('set', event.target.value)}
                    required
                  />
                </label>

                <label className="listing-field">
                  <span>Card number</span>
                  <input
                    placeholder="e.g. 172/167"
                    value={form.no}
                    onChange={(event) => update('no', event.target.value)}
                  />
                </label>

                <label className="listing-field">
                  <span>Card type</span>
                  <input
                    placeholder="e.g. Unit, Rune"
                    value={form.cardType}
                    onChange={(event) => update('cardType', event.target.value)}
                  />
                </label>

                <label className="listing-field">
                  <span>Rarity</span>
                  <input
                    placeholder="e.g. Rare, Showcase"
                    value={form.rarity}
                    onChange={(event) => update('rarity', event.target.value)}
                  />
                </label>

                <label className="listing-field listing-field-full">
                  <span>Card text or notes</span>
                  <textarea
                    rows="5"
                    placeholder="Add card text or condition notes (optional)"
                    value={form.desc}
                    onChange={(event) => update('desc', event.target.value)}
                  />
                  <small>Optional. Keep it brief and useful for buyers.</small>
                </label>
              </div>
            </section>

            <aside className="listing-sidebar">
              <section className="admin-panel listing-panel" aria-labelledby="listing-image-title">
                <div className="listing-section-heading">
                  <span className="listing-step">02</span>
                  <div>
                    <h2 id="listing-image-title">Card image</h2>
                    <p>A clear photo helps your listing stand out.</p>
                  </div>
                </div>

                <label className="listing-image-dropzone">
                  <input
                    aria-label="Upload card image"
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    onChange={handleImageChange}
                  />
                  {imagePreview ? (
                    <img src={imagePreview} alt="Selected card preview" />
                  ) : (
                    <span className="listing-upload-prompt">
                      <b aria-hidden="true">↑</b>
                      <strong>Choose an image</strong>
                      <span>JPG, PNG, WebP or AVIF · up to 8 MB</span>
                    </span>
                  )}
                  {imagePreview && (
                    <span className="listing-image-change">Choose a different image</span>
                  )}
                </label>
                {card?.img && !imageFile && (
                  <p className="listing-image-note">Leave unchanged to keep the current image.</p>
                )}
                {imageFile && (
                  <p className="listing-image-note">{imageFile.name}</p>
                )}
                {imageError && (
                  <p className="admin-alert error" role="alert">{imageError}</p>
                )}
              </section>

              <section className="admin-panel listing-panel" aria-labelledby="listing-price-title">
                <div className="listing-section-heading">
                  <span className="listing-step">03</span>
                  <div>
                    <h2 id="listing-price-title">Price &amp; stock</h2>
                    <p>Set the price in Philippine pesos.</p>
                  </div>
                </div>

                <div className="listing-fields">
                  <label className="listing-field">
                    <span>Price (PHP) <b>*</b></span>
                    <span className="listing-currency-input">
                      <span aria-hidden="true">₱</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        inputMode="decimal"
                        value={form.price}
                        onChange={(event) => update('price', event.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </span>
                  </label>

                  <label className="listing-field">
                    <span>Quantity <b>*</b></span>
                    <input
                      type="number"
                      min="0"
                      step="1"
                      inputMode="numeric"
                      value={form.qty}
                      onChange={(event) => update('qty', event.target.value)}
                      required
                    />
                  </label>
                </div>

                <label className="listing-publish-toggle">
                  <input
                    type="checkbox"
                    checked={form.isPublished}
                    onChange={(event) => update('isPublished', event.target.checked)}
                  />
                  <span>
                    <strong>Show in storefront</strong>
                    <small>Visible to visitors when enabled</small>
                  </span>
                </label>
              </section>
            </aside>
          </div>

          <div className="listing-form-actions">
            <p><b>*</b> Required fields</p>
            <div>
              <button
                className="admin-button"
                type="button"
                onClick={onCancel}
                disabled={busy}
              >
                Cancel
              </button>
              <button
                className="admin-button primary"
                disabled={busy || Boolean(imageError)}
              >
                {busy
                  ? 'Saving…'
                  : card
                    ? 'Save changes'
                    : form.isPublished
                      ? 'Publish listing'
                      : 'Save as hidden'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}

function ConnectedAdmin() {
  const [session, setSession] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [adminState, setAdminState] = useState({ userId: '', status: 'checking' });
  const [authError, setAuthError] = useState('');
  const [cardsState, setCardsState] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [editingCard, setEditingCard] = useState(null);
  const [creatingCard, setCreatingCard] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busyCardId, setBusyCardId] = useState(null);
  const [notice, setNotice] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [gameFilter, setGameFilter] = useState('');
  const [setFilter, setSetFilter] = useState('');
  const [rarityFilter, setRarityFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [publicationFilter, setPublicationFilter] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [selectedCardIds, setSelectedCardIds] = useState([]);
  const [bulkQuantity, setBulkQuantity] = useState('');
  const [bulkBusy, setBulkBusy] = useState(false);
  const selectAllVisibleRef = useRef(null);

  useEffect(() => {
    let active = true;
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setAuthLoading(false);
      setAuthError('');
    });

    async function loadSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        if (error) throw error;
        if (active) setSession(data.session);
      } catch (error) {
        if (active) setAuthError(messageFromError(error));
      } finally {
        if (active) setAuthLoading(false);
      }
    }

    loadSession();
    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!session) return undefined;

    let active = true;

    async function checkAdmin() {
      try {
        const { data, error } = await supabase
          .from('admin_users')
          .select('user_id')
          .eq('user_id', session.user.id)
          .maybeSingle();

        if (!active) return;
        if (error) {
          setAuthError(error.message);
          setAdminState({ userId: session.user.id, status: 'denied' });
        } else {
          setAdminState({
            userId: session.user.id,
            status: data ? 'admin' : 'denied',
          });
        }
      } catch (error) {
        if (!active) return;
        setAuthError(messageFromError(error));
        setAdminState({ userId: session.user.id, status: 'denied' });
      }
    }

    checkAdmin();
    return () => {
      active = false;
    };
  }, [session]);

  useEffect(() => {
    if (
      !session ||
      adminState.userId !== session.user.id ||
      adminState.status !== 'admin'
    ) {
      return undefined;
    }

    let active = true;

    async function loadCards() {
      try {
        const { data, error } = await supabase
          .from('cards')
          .select('*')
          .order('id', { ascending: false });

        if (!active) return;
        setCardsState({
          userId: session.user.id,
          refreshKey,
          cards: error ? [] : data.map(mapDatabaseCard),
          error: error?.message || '',
        });
      } catch (error) {
        if (!active) return;
        setCardsState({
          userId: session.user.id,
          refreshKey,
          cards: [],
          error: messageFromError(error),
        });
      }
    }

    loadCards();
    return () => {
      active = false;
    };
  }, [adminState, refreshKey, session]);

  async function handleSave(form, imageFile) {
    setSaving(true);
    setNotice(null);
    let uploadedPath = '';
    const previousImagePath = editingCard?.imagePath || '';

    try {
      if (imageFile) {
        const extension = {
          'image/jpeg': 'jpg',
          'image/png': 'png',
          'image/webp': 'webp',
          'image/avif': 'avif',
        }[imageFile.type];
        if (!extension) throw new Error('Unsupported image type.');
        uploadedPath = `${crypto.randomUUID()}.${extension}`;
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(uploadedPath, imageFile, {
            contentType: imageFile.type,
            upsert: false,
          });
        if (error) throw error;
      }

      const row = {
        game: form.game,
        name: form.name.trim(),
        card_type: form.cardType.trim(),
        set_name: form.set.trim(),
        card_no: form.no.trim(),
        rarity: form.rarity.trim(),
        price: Number(form.price),
        quantity: Number(form.qty),
        description: form.desc.trim(),
        image_path: uploadedPath || previousImagePath,
        is_published: form.isPublished,
        updated_at: new Date().toISOString(),
      };

      const result = editingCard
        ? await supabase
            .from('cards')
            .update(row)
            .eq('id', editingCard.id)
            .select('id')
            .single()
        : await supabase.from('cards').insert(row).select('id').single();

      if (result.error) throw result.error;

      let cleanupWarning = '';
      if (
        uploadedPath &&
        previousImagePath &&
        !previousImagePath.startsWith('/')
      ) {
        const { error } = await supabase.storage
          .from(BUCKET)
          .remove([previousImagePath]);
        if (error) cleanupWarning = ` Old image cleanup failed: ${error.message}`;
      }

      setNotice({
        kind: cleanupWarning ? 'error' : 'success',
        text: `${editingCard ? 'Card updated.' : 'Card added.'}${cleanupWarning}`,
      });
      setEditingCard(null);
      setCreatingCard(false);
      setRefreshKey((key) => key + 1);
    } catch (error) {
      let cleanupWarning = '';
      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage
          .from(BUCKET)
          .remove([uploadedPath]);
        if (cleanupError) {
          cleanupWarning = ` Uploaded image cleanup failed: ${cleanupError.message}`;
        }
      }
      setNotice({
        kind: 'error',
        text: `${messageFromError(error)}${cleanupWarning}`,
      });
    } finally {
      setSaving(false);
    }
  }

  async function togglePublished(card) {
    setBusyCardId(card.id);
    setNotice(null);

    try {
      const { error } = await supabase
        .from('cards')
        .update({
          is_published: !card.isPublished,
          updated_at: new Date().toISOString(),
        })
        .eq('id', card.id)
        .select('id')
        .single();

      if (error) {
        setNotice({ kind: 'error', text: error.message });
      } else {
        setNotice({
          kind: 'success',
          text: card.isPublished ? 'Card hidden from storefront.' : 'Card published.',
        });
        setRefreshKey((key) => key + 1);
      }
    } catch (error) {
      setNotice({ kind: 'error', text: messageFromError(error) });
    } finally {
      setBusyCardId(null);
    }
  }

  async function deleteCard(card) {
    if (!window.confirm(`Delete "${card.name}"? This cannot be undone.`)) return;

    setBusyCardId(card.id);
    setNotice(null);

    try {
      const { error } = await supabase
        .from('cards')
        .delete()
        .eq('id', card.id)
        .select('id')
        .single();

      if (error) {
        setNotice({ kind: 'error', text: error.message });
      } else {
        let cleanupWarning = '';
        if (card.imagePath && !card.imagePath.startsWith('/')) {
          const { error: storageError } = await supabase.storage
            .from(BUCKET)
            .remove([card.imagePath]);
          if (storageError) {
            cleanupWarning = ` Image cleanup failed: ${storageError.message}`;
          }
        }
        setNotice({
          kind: cleanupWarning ? 'error' : 'success',
          text: `Card deleted.${cleanupWarning}`,
        });
        setRefreshKey((key) => key + 1);
      }
    } catch (error) {
      setNotice({ kind: 'error', text: messageFromError(error) });
    } finally {
      setBusyCardId(null);
    }
  }

  async function signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) setAuthError(error.message);
    } catch (error) {
      setAuthError(messageFromError(error));
    }
  }

  const userId = session?.user.id || '';
  const isAdmin = adminState.userId === userId && adminState.status === 'admin';
  const hasCurrentCards =
    isAdmin &&
    cardsState?.userId === userId &&
    cardsState.refreshKey === refreshKey;
  const cards = hasCurrentCards ? cardsState.cards : EMPTY_CARDS;
  const cardsLoading = isAdmin && !hasCurrentCards;
  const cardsError = hasCurrentCards ? cardsState.error : '';
  const games = useMemo(() => uniqueSorted(cards.map((card) => card.game)), [cards]);
  const sets = useMemo(
    () =>
      uniqueSorted(
        cards
          .filter((card) => !gameFilter || card.game === gameFilter)
          .map((card) => card.set),
      ),
    [cards, gameFilter],
  );
  const rarities = useMemo(
    () =>
      uniqueSorted(
        cards
          .filter((card) => !gameFilter || card.game === gameFilter)
          .map((card) => card.rarity),
      ),
    [cards, gameFilter],
  );
  const filteredCards = useMemo(() => {
    const query = searchQuery.trim().toLocaleLowerCase();
    const result = cards.filter((card) => {
      const matchesQuery =
        !query ||
        [card.name, card.game, card.set, card.no, card.rarity, card.cardType]
          .join(' ')
          .toLocaleLowerCase()
          .includes(query);

      return (
        matchesQuery &&
        (!gameFilter || card.game === gameFilter) &&
        (!setFilter || card.set === setFilter) &&
        (!rarityFilter || card.rarity === rarityFilter) &&
        (!stockFilter ||
          (stockFilter === 'in-stock' ? card.qty > 0 : card.qty === 0)) &&
        (!publicationFilter ||
          card.isPublished === (publicationFilter === 'published'))
      );
    });

    return result.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'price-ascending':
          return a.price - b.price;
        case 'price-descending':
          return b.price - a.price;
        case 'stock-ascending':
          return a.qty - b.qty;
        case 'stock-descending':
          return b.qty - a.qty;
        default:
          return b.id - a.id;
      }
    });
  }, [
    cards,
    gameFilter,
    publicationFilter,
    rarityFilter,
    searchQuery,
    setFilter,
    sortBy,
    stockFilter,
  ]);
  const hasFilters =
    searchQuery ||
    gameFilter ||
    setFilter ||
    rarityFilter ||
    stockFilter ||
    publicationFilter ||
    sortBy !== 'newest';
  const availableCardIds = useMemo(
    () => new Set(cards.map((card) => card.id)),
    [cards],
  );
  const selectedIdSet = useMemo(
    () =>
      new Set(
        selectedCardIds.filter((cardId) => availableCardIds.has(cardId)),
      ),
    [availableCardIds, selectedCardIds],
  );
  const selectedCards = cards.filter((card) => selectedIdSet.has(card.id));
  const selectedCardLabel = selectedCards.length === 1 ? 'card' : 'cards';
  const visibleSelectedCount = filteredCards.reduce(
    (count, card) => count + (selectedIdSet.has(card.id) ? 1 : 0),
    0,
  );
  const allVisibleSelected =
    filteredCards.length > 0 && visibleSelectedCount === filteredCards.length;
  const partiallyVisibleSelected =
    visibleSelectedCount > 0 && !allVisibleSelected;
  const parsedBulkQuantity = Number(bulkQuantity);
  const validBulkQuantity =
    /^\d+$/.test(bulkQuantity) &&
    Number.isSafeInteger(parsedBulkQuantity) &&
    parsedBulkQuantity <= 2147483647;

  useEffect(() => {
    if (selectAllVisibleRef.current) {
      selectAllVisibleRef.current.indeterminate = partiallyVisibleSelected;
    }
  }, [partiallyVisibleSelected]);

  function clearFilters() {
    setSearchQuery('');
    setGameFilter('');
    setSetFilter('');
    setRarityFilter('');
    setStockFilter('');
    setPublicationFilter('');
    setSortBy('newest');
  }

  function toggleVisibleSelection(checked) {
    const visibleIds = new Set(filteredCards.map((card) => card.id));
    setSelectedCardIds((current) => {
      const currentCatalogIds = current.filter((cardId) =>
        availableCardIds.has(cardId),
      );
      return checked
        ? [...new Set([...currentCatalogIds, ...visibleIds])]
        : currentCatalogIds.filter((cardId) => !visibleIds.has(cardId));
    });
  }

  async function applyBulkUpdate(values, successMessage) {
    const ids = selectedCards.map((card) => card.id);
    if (!ids.length) return;

    setBulkBusy(true);
    setNotice(null);

    try {
      const { count, data, error } = await supabase
        .from('cards')
        .update(
          { ...values, updated_at: new Date().toISOString() },
          { count: 'exact' },
        )
        .in('id', ids)
        .select('id');

      if (error) throw error;

      const updatedCount = count ?? data?.length ?? 0;
      setSelectedCardIds([]);
      setRefreshKey((key) => key + 1);

      if (updatedCount !== ids.length) {
        setNotice({
          kind: 'error',
          text: `Only ${updatedCount} of ${ids.length} selected cards were updated. The list has been refreshed; review the remaining items.`,
        });
      } else {
        setNotice({ kind: 'success', text: successMessage });
      }
    } catch (error) {
      setNotice({ kind: 'error', text: messageFromError(error) });
    } finally {
      setBulkBusy(false);
    }
  }

  function exportCardsCsv() {
    downloadCardsCsv(cards);
    setNotice({ kind: 'success', text: `Exported ${cards.length} cards to CSV.` });
  }

  if (authLoading) {
    return (
      <main className="admin-page">
        <p className="admin-loading">Checking sign-in…</p>
      </main>
    );
  }

  if (!session) {
    return (
      <AdminSignIn
        onSignedIn={setSession}
        error={authError}
        setError={setAuthError}
      />
    );
  }

  if (adminState.userId !== session.user.id || adminState.status === 'checking') {
    return (
      <main className="admin-page">
        <p className="admin-loading">Verifying administrator access…</p>
      </main>
    );
  }

  if (adminState.status !== 'admin') {
    return (
      <main className="admin-page">
        <section className="admin-panel admin-login">
          <p className="admin-kicker">GN TCG · ADMIN</p>
          <h1>Access not enabled</h1>
          <p>
            This account is signed in, but it is not on the administrator
            allowlist. Add its user ID to <code>admin_users</code> in Supabase.
          </p>
          {authError && <p className="admin-alert error">{authError}</p>}
          <button className="admin-button" onClick={signOut}>
            Sign out
          </button>
        </section>
      </main>
    );
  }

  if (creatingCard || editingCard) {
    return (
      <CardEditor
        key={editingCard?.id || 'new'}
        card={editingCard}
        onSave={handleSave}
        onCancel={() => {
          setCreatingCard(false);
          setEditingCard(null);
        }}
        busy={saving}
      />
    );
  }

  return (
    <main className="admin-page">
      <div className="admin-shell">
        <header className="admin-header">
          <div>
            <p className="admin-kicker">GN TCG · ADMIN</p>
            <h1>Card listings</h1>
            <p>Manage your inventory and what appears in the storefront.</p>
          </div>
          <div className="admin-header-actions">
            <a className="admin-button" href="/">
              View storefront
            </a>
            <button className="admin-button" onClick={signOut}>
              Sign out
            </button>
          </div>
        </header>

        {notice && (
          <p className={`admin-alert ${notice.kind}`} role="status">
            {notice.text}
          </p>
        )}

        <section className="admin-panel admin-listings">
          <div className="admin-listings-heading">
            <div>
              <p className="admin-kicker">INVENTORY</p>
              <h2>{cards.length} {cards.length === 1 ? 'card' : 'cards'}</h2>
            </div>
            <div className="admin-listing-actions">
              <button
                className="admin-button"
                type="button"
                disabled={!cards.length || cardsLoading}
                onClick={exportCardsCsv}
              >
                Export CSV
              </button>
              <button
                className="admin-button primary"
                type="button"
                onClick={() => setCreatingCard(true)}
              >
                + New listing
              </button>
            </div>
          </div>

          <div className="admin-listing-filters">
            <label className="admin-filter-search">
              Search cards
              <input
                type="search"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Name, game, set, number, rarity…"
              />
            </label>
            <label>
              Game
              <select
                value={gameFilter}
                onChange={(event) => {
                  setGameFilter(event.target.value);
                  setSetFilter('');
                  setRarityFilter('');
                }}
              >
                <option value="">All games</option>
                {games.map((game) => (
                  <option key={game} value={game}>{game}</option>
                ))}
              </select>
            </label>
            <label>
              Set
              <select
                value={setFilter}
                onChange={(event) => setSetFilter(event.target.value)}
              >
                <option value="">All sets</option>
                {sets.map((set) => (
                  <option key={set} value={set}>{set}</option>
                ))}
              </select>
            </label>
            <label>
              Rarity
              <select
                value={rarityFilter}
                onChange={(event) => setRarityFilter(event.target.value)}
              >
                <option value="">All rarities</option>
                {rarities.map((rarity) => (
                  <option key={rarity} value={rarity}>{rarity}</option>
                ))}
              </select>
            </label>
            <label>
              Stock
              <select
                value={stockFilter}
                onChange={(event) => setStockFilter(event.target.value)}
              >
                <option value="">Any stock</option>
                <option value="in-stock">In stock</option>
                <option value="out-of-stock">Out of stock</option>
              </select>
            </label>
            <label>
              Publication
              <select
                value={publicationFilter}
                onChange={(event) => setPublicationFilter(event.target.value)}
              >
                <option value="">Any status</option>
                <option value="published">Published</option>
                <option value="hidden">Hidden</option>
              </select>
            </label>
            <label>
              Sort by
              <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                <option value="newest">Newest first</option>
                <option value="name">Name A–Z</option>
                <option value="price-ascending">Price: low to high</option>
                <option value="price-descending">Price: high to low</option>
                <option value="stock-ascending">Stock: low to high</option>
                <option value="stock-descending">Stock: high to low</option>
              </select>
            </label>
          </div>

          <div className="admin-filter-summary">
            <p>
              Showing {filteredCards.length} of {cards.length}{' '}
              {cards.length === 1 ? 'listing' : 'listings'}
            </p>
            <button
              className="admin-text-button"
              type="button"
              onClick={clearFilters}
              disabled={!hasFilters}
            >
              Clear filters
            </button>
          </div>

          {selectedCards.length > 0 && (
            <div className="admin-bulk-toolbar" role="toolbar" aria-label="Bulk actions for selected cards">
              <p>
                <strong>{selectedCards.length}</strong>{' '}
                {selectedCardLabel} selected
              </p>
              <div className="admin-bulk-actions">
                <button
                  className="admin-button"
                  type="button"
                  disabled={bulkBusy}
                  onClick={() =>
                    applyBulkUpdate(
                      { is_published: true },
                      `Published ${selectedCards.length} ${selectedCardLabel}.`,
                    )
                  }
                >
                  Publish selected
                </button>
                <button
                  className="admin-button"
                  type="button"
                  disabled={bulkBusy}
                  onClick={() =>
                    applyBulkUpdate(
                      { is_published: false },
                      `Hid ${selectedCards.length} ${selectedCardLabel}.`,
                    )
                  }
                >
                  Hide selected
                </button>
                <label className="admin-bulk-stock">
                  Set stock to
                  <input
                    type="number"
                    min="0"
                    max="2147483647"
                    step="1"
                    value={bulkQuantity}
                    onChange={(event) => setBulkQuantity(event.target.value)}
                  />
                </label>
                <button
                  className="admin-button"
                  type="button"
                  disabled={bulkBusy || !validBulkQuantity}
                  onClick={() =>
                    applyBulkUpdate(
                      { quantity: parsedBulkQuantity },
                      `Stock updated for ${selectedCards.length} ${selectedCardLabel}.`,
                    )
                  }
                >
                  Apply stock
                </button>
                <button
                  className="admin-text-button"
                  type="button"
                  disabled={bulkBusy}
                  onClick={() => setSelectedCardIds([])}
                >
                  Clear selection
                </button>
              </div>
            </div>
          )}

          {cardsError && <p className="admin-alert error">{cardsError}</p>}
          {cardsLoading ? (
            <p className="admin-loading">Loading cards…</p>
          ) : filteredCards.length ? (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th scope="col" className="admin-select-column">
                      <input
                        ref={selectAllVisibleRef}
                        type="checkbox"
                        checked={allVisibleSelected}
                        onChange={(event) =>
                          toggleVisibleSelection(event.target.checked)
                        }
                        aria-label="Select all visible listings"
                      />
                    </th>
                    <th scope="col">Card</th>
                    <th scope="col">Game / set</th>
                    <th scope="col">Price</th>
                    <th scope="col">Stock</th>
                    <th scope="col">Status</th>
                    <th scope="col">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCards.map((card) => (
                    <tr
                      key={card.id}
                      className={
                        selectedIdSet.has(card.id) ? 'admin-row-selected' : undefined
                      }
                    >
                      <td className="admin-select-column">
                        <input
                          type="checkbox"
                          checked={selectedIdSet.has(card.id)}
                          onChange={(event) => {
                            const checked = event.target.checked;
                            setSelectedCardIds((current) => {
                              const currentCatalogIds = current.filter(
                                (cardId) => availableCardIds.has(cardId),
                              );
                              return checked
                                ? [...new Set([...currentCatalogIds, card.id])]
                                : currentCatalogIds.filter(
                                    (cardId) => cardId !== card.id,
                                  );
                            });
                          }}
                          aria-label={`Select ${card.name}`}
                        />
                      </td>
                      <td>
                        <div className="admin-card-cell">
                          {card.img ? (
                            <img src={card.img} alt="" />
                          ) : (
                            <span className="admin-image-empty">No image</span>
                          )}
                          <strong>{card.name}</strong>
                        </div>
                      </td>
                      <td>
                        {card.game}
                        <span className="admin-subtext">
                          {card.set}{card.no ? ` · ${card.no}` : ''}
                        </span>
                      </td>
                      <td>₱{card.price.toLocaleString('en-US')}</td>
                      <td>{card.qty}</td>
                      <td>
                        <span
                          className={`admin-status ${card.isPublished ? 'published' : ''}`}
                        >
                          {card.isPublished ? 'Published' : 'Hidden'}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            className="admin-text-button"
                            onClick={() => {
                              setCreatingCard(false);
                              setEditingCard(card);
                            }}
                          >
                            Edit
                          </button>
                          <button
                            className="admin-text-button"
                            disabled={busyCardId === card.id}
                            onClick={() => togglePublished(card)}
                          >
                            {card.isPublished ? 'Hide' : 'Publish'}
                          </button>
                          <button
                            className="admin-text-button danger"
                            disabled={busyCardId === card.id}
                            onClick={() => deleteCard(card)}
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="admin-empty">
              {cards.length
                ? 'No cards match these filters. Try changing or clearing them.'
                : 'No cards yet. Add your first listing.'}
            </p>
          )}
        </section>
      </div>
    </main>
  );
}

export default function AdminDashboard() {
  if (!supabase) return <SetupNotice />;
  return <ConnectedAdmin />;
}
