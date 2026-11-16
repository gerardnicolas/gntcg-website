import { CONFIG } from '../utils/shop';

export default function Footer() {
  return (
    <footer>
      <div className="wrap">
        <span>
          Prices in PHP. Meet-ups and shipping arranged after you inquire.
          Payment: GCash or bank transfer.
        </span>

        <a href={CONFIG.messenger} target="_blank" rel="noreferrer">
          Message me on Messenger
        </a>
      </div>
    </footer>
  );
}
