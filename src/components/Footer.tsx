export default function Footer() {
  return (
    <footer className="bg-fpl-purple/80 border-t border-white/10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="text-center text-sm text-gray-400 space-y-1">
          <p>Data sourced from the <a href="https://fantasy.premierleague.com" target="_blank" rel="noopener noreferrer" className="text-fpl-green hover:underline">Fantasy Premier League API</a></p>
          <p>Updated daily via GitHub Actions &middot; 2025/26 Season</p>
        </div>
      </div>
    </footer>
  );
}
