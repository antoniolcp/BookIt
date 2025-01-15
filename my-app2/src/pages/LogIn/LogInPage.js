import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider} from 'firebase/auth';
import { doc,setDoc, getDoc} from 'firebase/firestore';
import { db, auth } from '../../firebase';
import { CalendarCheck2, MailIcon, LockIcon } from 'lucide-react';

export default function LogIn() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;
  
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
  
      if (userDocSnap.exists()) {
        const userType = userDocSnap.data().userType;
        if (userType === 'admin') {
          navigate('/adminHomePage');
        } else {
          navigate('/homePage');
        }
      } else {
        alert('User data not found. Please contact support.');
      }
    } catch (error) {
      setError('Failed to log in. Please check your email and password.');
      console.error('Login error:', error);
    }
  };
  
  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
  
      const userDocRef = doc(db, 'users', user.uid);
      const userDocSnap = await getDoc(userDocRef);
  
      if (userDocSnap.exists()) {
        const userType = userDocSnap.data().userType;
        if (userType === 'admin') {
          navigate('/adminHomePage');
        } else {
          navigate('/homePage');
        }
      } else {
        // Cria o documento para novos usuários
        await setDoc(userDocRef, {
          email: user.email,
          userType: 'user',
          phone: '',
        });
        navigate('/homePage');
      }
    } catch (error) {
      setError('Failed to log in with Google. Please try again.');
      console.error('Google login error:', error);
    }
  };
  
  
  

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
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

      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md mx-auto">
          <form onSubmit={handleEmailLogin} className="space-y-6">
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
              <LockIcon className="text-gray-500" />
              <input
                type="password"
                placeholder="Password"
                className="bg-transparent w-full focus:outline-none text-gray-700 ml-2"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {error && <div className="text-red-600 text-sm">{error}</div>}
            <button
              type="submit"
              className="w-full bg-green-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition duration-300 shadow-md"
            >
              Sign In
            </button>
          </form>

          <div className="mt-6">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="mt-6">
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center py-3 px-6 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition duration-300"
              >
                Sign in with Google
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
