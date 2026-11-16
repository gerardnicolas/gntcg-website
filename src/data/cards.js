const RB = "Riftbound";
const CR = "CookieRun: Braverse";
export const CARDS = [
  {
    id: 1,
    game: RB,
    name: "K'Sante, Pride of Nazumah (Overnumbered)",
    set: "Radiance",
    no: "172/167",
    rarity: "Showcase",
    price: 2500,
    qty: 1,
    desc: "1, Exhaust: Give a friendly unit \"I have [Assault] equal to my [Shield]\" this turn.",
    img: "/images/ksante_showcase_rad.webp"
  },
  {
    id: 2,
    game: RB,
    name: "Sett, Kingpin (Showcase)",
    set: "Radiance",
    no: "183/167",
    rarity: "Showcase",
    price: 4500,
    qty: 1,
    desc: "[TANK] I get +1 Might for each buffed friendly unit at my battlefield.",
    img: "/images/sett_showcase_rad.webp"
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