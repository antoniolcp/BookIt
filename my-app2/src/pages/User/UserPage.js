import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc, updateDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { UserIcon, CalendarCheck2, PhoneIcon, MailIcon } from 'lucide-react';

export default function UserPage() {
  const [user, setUser] = useState(null);
  const [formData, setFormData] = useState({ name: '', userType: '', email: '', phone: '' });
  const [isScrolled, setIsScrolled] = useState(false);
  const navigate = useNavigate();

  // Mudanças no estado de autenticação e busca os dados do usuário do Firestore
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            setFormData({
              name: userData.name || '',
              userType: userData.userType || 'user',
              email: currentUser.email,
              phone: userData.phone || '',
            });
          } else {
            await setDoc(doc(db, 'users', currentUser.uid), {
              name: '',
              userType: 'user',
              email: currentUser.email,
              phone: '',
            });
            setFormData({
              name: '',
              userType: 'user',
              email: currentUser.email,
              phone: '',
            });
          }
        } catch (error) {
          console.error('Error fetching user data: ', error);
        }
      } else {
        navigate('/login');
      }
    });

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [navigate]);

  // Atualiza os valores do formulário
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
  };

  // Salva as alterações feitas pelo usuário no Firestore
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        phone: formData.phone,
        lastUpdated: serverTimestamp(),
      });
      alert('User data updated successfully!');
    } catch (error) {
      console.error('Error updating user data: ', error);
      alert('Failed to update user data. Please try again.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out: ', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header
        className={`sticky top-0 z-10 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md' : 'bg-gradient-to-r from-green-900 to-green-800'
        }`}
      >
        <div className="container mx-auto flex justify-between items-center py-6 px-6">
          <div className="w-1/3"></div>

          <Link to="/" className="flex items-center space-x-2 w-1/3 justify-center">
            <CalendarCheck2
              className={`h-12 w-12 ${isScrolled ? 'text-green-800' : 'text-white'}`}
            />
            <h1
              className={`text-6xl font-extrabold ${isScrolled ? 'text-green-800' : 'text-white'}`}
            >
              Book!t
            </h1>
          </Link>

          <div className="w-1/3 flex justify-end items-end space-x-2">
            <button
              onClick={handleSignOut}
              className={`px-4 py-2 rounded-full text-sm font-medium transition duration-300 ${
                isScrolled
                  ? 'bg-green-800 text-white hover:bg-red-400'
                  : 'bg-white text-green-800 hover:bg-red-400'
              }`}
            >
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="bg-white rounded-lg shadow-lg p-8 mb-10">
          <h2 className="text-3xl font-bold mb-6 text-center text-green-800">Editar Perfil</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner hover:bg-gray-200 transition-colors duration-300">
              <UserIcon className="text-gray-500 mr-2" />
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Nome"
                className="bg-transparent w-full focus:outline-none text-gray-700"
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner hover:bg-gray-200 transition-colors duration-300">
              <MailIcon className="text-gray-500 mr-2" />
              <input
                type="email"
                name="email"
                value={formData.email}
                className="bg-transparent w-full focus:outline-none text-gray-700"
                readOnly
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner hover:bg-gray-200 transition-colors duration-300">
              <PhoneIcon className="text-gray-500 mr-2" />
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                placeholder="Número de telefone"
                className="bg-transparent w-full focus:outline-none text-gray-700"
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner">
              <UserIcon className="text-gray-500 mr-2" />
              <input
                type="text"
                value={formData.userType}
                readOnly
                className="bg-transparent w-full focus:outline-none text-gray-700"
              />
            </div>
            <button
              type="submit"
              className="bg-green-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition duration-300 shadow-md md:col-span-2"
            >
              Salvar Alterações
            </button>
            <button
              onClick={async () => {
                try {
                  await updateDoc(doc(db, 'users', user.uid), {
                    requestAdminAccess: true,
                  });
                  alert('Solicitação enviada com sucesso. Aguarde a resposta do administrador.');
                } catch (error) {
                  console.error('Erro ao solicitar acesso de admin:', error);
                  alert('Houve um erro ao enviar a solicitação. Tente novamente.');
                }
              }}
              className="bg-blue-600 text-white py-3 px-6 rounded-lg md:col-span-2 shadow-md hover:bg-blue-700"
            >
              Solicitar Acesso a Admin
            </button>
          </form>
        </div>
      </main>

      <footer className="bg-gray-800 text-white p-6 mt-10">
        <div className="container mx-auto text-center">
          <p>&copy; 2024 Book!t. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
