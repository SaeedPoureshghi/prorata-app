import { Link } from "react-router-dom";

const Main = () => {
  return (
    <div>
      <h1>Main Page</h1>
      <Link to="/wallets">Wallet</Link>
    </div>
  );
};

export default Main;
