// import { useState, useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';
// import { loginUser } from '../api';

// export default function Login() {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const { login } = useContext(AuthContext);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     const token = await loginUser(email, password);
//     login(token);
//   };

//   return (
//     <form onSubmit={handleSubmit} className="form-container">
//       <h2>Login</h2>
//       <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" />
//       <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" />
//       <button type="submit">Login</button>
//     </form>
//   );
// }

import { useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { loginUser } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login } = useContext(AuthContext);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const token = await loginUser(username, password);
      login(token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="form-container">
      <h2>Login</h2>
      <input value={username} onChange={(e) => setUsername(e.target.value)} placeholder="Username" required />
      <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password" required />
      <button type="submit">Login</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}
