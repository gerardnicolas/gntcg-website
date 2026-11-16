export default function FilterBar({
  search,
  setSearch,
  selectedSet,
  setSelectedSet,
  sort,
  setSort,
  sets,
}) {
  return (
    <div className="bar">
      <div className="wrap">
        <input
          type="search"
          placeholder="Search by name, set or card number"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        <select
          value={selectedSet}
          onChange={(e) => setSelectedSet(e.target.value)}
        >
          <option value="">All sets</option>
          {sets.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>

        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="new">Newest listed</option>
          <option value="lo">Price: low to high</option>
          <option value="hi">Price: high to low</option>
          <option value="az">Name: A to Z</option>
        </select>
      </div>
    </div>
  );
}
