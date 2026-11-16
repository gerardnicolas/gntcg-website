const RB = "Riftbound";
const CR = "CookieRun: Braverse";
export const CARDS = [
  {
    id: 1,
    game: RB,
    name: "K'Sante, Pride of Nazumah (Overnumbered)",
    cardType: "Unit",
    set: "Radiance",
    no: "172/167",
    rarity: "Showcase",
    price: 2200,
    qty: 1,
    desc: "1, Exhaust: Give a friendly unit \"I have [Assault] equal to my [Shield]\" this turn.",
    img: "/images/ksante_showcase_rad.webp"
  },
  {
    id: 2,
    game: RB,
    name: "Sett, Kingpin (Showcase)",
    cardType: "Unit",
    set: "Radiance",
    no: "183/167",
    rarity: "Showcase",
    price: 3900,
    qty: 0,
    desc: "[TANK] I get +1 Might for each buffed friendly unit at my battlefield.",
    img: "/images/sett_showcase_rad.webp"
  },
  {
    id: 3,
    game: RB,
    name: "Fury Rune (R01a)",
    cardType: "Rune",
    set: "Radiance",
    no: "R01a",
    rarity: "Showcase",
    price: 200,
    qty: 1,
    img: "/images/rune_r01a.webp"
  },
  {
    id: 4,
    game: RB,
    name: "Chaos Rune (R05b)",
    cardType: "Rune",
    set: "Radiance",
    no: "R05b",
    rarity: "Showcase",
    price: 1100,
    qty: 1,
    img: "/images/rune_r05b.webp"
  },
  {
    id: 5,
    game: RB,
    name: "Jarvan IV, Martial Paragon",
    cardType: "Unit",
    set: "Radiance",
    no: "091/167",
    rarity: "Epic",
    price: 40,
    qty: 1,
    img: "/images/jarvan_091_rad.webp"
  },
  {
    id: 6,
    game: RB,
    name: "Realm of Death",
    cardType: "Signature Spell",
    set: "Radiance",
    no: "144/167",
    rarity: "Epic",
    price: 650,
    qty: 1,
    img: "/images/realmofdeath_144.webp"
  },
  {
    id: 7,
    game: RB,
    name: "Nasus, Guardian of Knowledge (Alternate Art)",
    cardType: "Unit",
    set: "Vendetta",
    no: "063a/166",
    rarity: "Rare",
    price: 50,
    qty: 1,
    img: "/images/nasus_063a.webp"
  },
  {
    id: 8,
    game: RB,
    name: "Zed, Without a Sound (Alternate Art)",
    cardType: "Unit",
    set: "Vendetta",
    no: "112a/166",
    rarity: "Rare",
    price: 130,
    qty: 1,
    img: "/images/zed_112a.webp"
  },
  

  // Keep all your other existing cards here.
];

CARDS.forEach(card => {
  let hue = 0;

  for (const character of card.name) {
    hue = (hue * 31 + character.charCodeAt(0)) % 360;
  }

  card.hue = hue;
});

export default CARDS;