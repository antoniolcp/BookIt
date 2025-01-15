import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';
import { auth, db } from '../../firebase';
import { MailIcon, LockIcon, PhoneIcon, UserIcon } from 'lucide-react';
import { CalendarCheck2 } from 'lucide-react';

export default function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [userType, setUserType] = useState('normal');
  const [error, setError] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Gerenciar o estado de rolagem
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleSignUp = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await setDoc(doc(db, 'users', user.uid), {
        email: email,
        phone: phone,
        userType: userType,
      });

      localStorage.setItem('userType', userType);

      console.log("Usuário registrado com sucesso!");
      navigate('/');
    } catch (error) {
      console.error("Erro durante o registro:", error);
      setError('Falha ao criar a conta. Por favor, tente novamente. ' + error.message);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      {/* Header */}
      <header
        className={`sticky top-0 z-10 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md' : 'bg-gradient-to-r from-green-900 to-green-800'
        }`}
      >
        <div className="container mx-auto flex items-center justify-center py-6 px-6">
          <Link to="/" className="flex items-center space-x-2">
            <CalendarCheck2 className={`h-12 w-12 ${isScrolled ? 'text-green-800' : 'text-white'}`} />
            <h1 className={`text-6xl font-extrabold ${isScrolled ? 'text-green-800' : 'text-white'}`}>Book!t</h1>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <form onSubmit={handleSignUp} className="space-y-6">
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner hover:bg-gray-200 transition-colors duration-300">
              <UserIcon className="text-gray-500" />
              <select
                className="bg-transparent w-full focus:outline-none text-gray-700 ml-2"
                value={userType}
                onChange={(e) => setUserType(e.target.value)}
                required
              >
                <option value="User">User</option>
                <option value="admin">Administrator</option>
              </select>
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner hover:bg-gray-200 transition-colors duration-300">
              <MailIcon className="text-gray-500" />
              <input
                type="email"
                placeholder="Email"
                className="bg-transparent w-full focus:outline-none text-gray-700 ml-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner hover:bg-gray-200 transition-colors duration-300">
              <PhoneIcon className="text-gray-500" />
              <input
                type="tel"
                placeholder="Número de Telefone"
                className="bg-transparent w-full focus:outline-none text-gray-700 ml-2"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner hover:bg-gray-200 transition-colors duration-300">
              <LockIcon className="text-gray-500" />
              <input
                type="password"
                placeholder="Senha"
                className="bg-transparent w-full focus:outline-none text-gray-700 ml-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-green-900 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-800 transition duration-300 shadow-md"
            >
              Registrar
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/login" className="font-medium text-green-900 hover:text-green-800">
                Faça login
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 text-white p-6 mt-10">
        <div className="container mx-auto text-center">
          <p>&copy; 2024 Book!t. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
