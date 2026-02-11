import { Link } from "react-router-dom";

const Header = () => {
  return (
    <header className="bg-brand-dark text-white py-4 px-6">
      <Link to="/" className="text-xl font-semibold hover:opacity-80 transition-opacity">
        AniMatch
      </Link>
    </header>
  );
};

export default Header;
