import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDocs, updateDoc, query, where, collection } from 'firebase/firestore';
import {CalendarCheck2 } from 'lucide-react';

export default function AdminUserPage() {
  const [user, setUser] = useState(null);
  const [isScrolled, setIsScrolled] = useState(false);
  const [adminRequests, setAdminRequests] = useState([]);
  const [admins, setAdmins] = useState([]);
  const navigate = useNavigate();

  //Mudanças no estado de autenticação e redireciona o usuário se ele não estiver autenticado
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
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

  // Solicitações pendentes de promoção para administrador no Firestore
  useEffect(() => {
    fetchAdminRequests();
    fetchAdmins();
  }, []);

  // Lista de usuários que já possuem permissões de administrador
  const fetchAdmins = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('userType', '==', 'admin'));
      const querySnapshot = await getDocs(q);

      const adminsList = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAdmins(adminsList);
    } catch (error) {
      console.error('Erro ao buscar administradores:', error);
    }
  };

  // Obtém a lista de solicitações de usuários para se tornarem administradores
  const fetchAdminRequests = async () => {
    try {
      const usersRef = collection(db, 'users');
      const q = query(usersRef, where('requestAdminAccess', '==', true));
      const querySnapshot = await getDocs(q);

      const requests = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setAdminRequests(requests);
    } catch (error) {
      console.error('Erro ao buscar solicitações de admin:', error);
    }
  };


// Processa as solicitações de administrador, aceitando ou negando
  const handleAdminRequest = async (userId, action) => {
    try {
      const userRef = doc(db, 'users', userId);

      if (action === 'accept') {
        await updateDoc(userRef, {
          userType: 'admin',
          requestAdminAccess: false,
        });
        alert('Usuário promovido a admin com sucesso.');
      } else {
        await updateDoc(userRef, {
          requestAdminAccess: false,
        });
        alert('Solicitação de admin rejeitada.');
      }

      fetchAdminRequests();
      fetchAdmins();
    } catch (error) {
      console.error('Erro ao processar solicitação:', error);
      alert('Erro ao processar solicitação. Tente novamente.');
    }
  };

  // Despromove um administrador existente para um usuário comum
  const handleDemoteAdmin = async (userId) => {
    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, {
        userType: 'user',
      });
      alert('Administrador despromovido com sucesso.');
      fetchAdmins();
    } catch (error) {
      console.error('Erro ao despromover administrador:', error);
      alert('Erro ao despromover administrador. Tente novamente.');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-100">
      <header
        className={`sticky top-0 z-10 transition-all duration-300 ${
          isScrolled ? 'bg-white shadow-md' : 'bg-gradient-to-r from-green-900 to-green-800'
        }`}
      >
        <div className="container mx-auto flex justify-between items-center py-6 px-6">
          <div className="w-1/3"></div>

          <Link to="/adminHomePage" className="flex items-center space-x-2 w-1/3 justify-center">
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
        {/* Tabela de Administradores */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-10">
          <h2 className="text-3xl font-bold mb-6 text-center text-green-800">Administradores</h2>
          {admins.length > 0 ? (
            <ul className="space-y-4">
              {admins.map((admin) => (
                <li key={admin.id} className="p-6 border rounded-lg shadow bg-green-50 hover:bg-green-100 transition duration-300">
                  <p className="text-lg font-semibold"><strong>Email:</strong> {admin.email}</p>
                  <p className="text-lg"><strong>Nome:</strong> {admin.name || 'Não informado'}</p>
                  <p className="text-lg"><strong>Telefone:</strong> {admin.phone || 'Não informado'}</p>
                  {user?.email === 'antoniocollarespereira@gmail.com' && (
                    <button
                      onClick={() => handleDemoteAdmin(admin.id)}
                      className="bg-red-800 text-white py-2 px-4 rounded mt-4 hover:bg-red-600 transition duration-300"
                    >
                      Despromover
                    </button>
                  )}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">Nenhum administrador encontrado.</p>
          )}
        </div>

        {/* Solicitações de Acesso a Admin */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-10">
          <h2 className="text-3xl font-bold mb-6 text-center text-green-800">
            Solicitações de Acesso a Admin
          </h2>
          {adminRequests.length > 0 ? (
            <ul className="space-y-4">
              {adminRequests.map((request) => (
                <li key={request.id} className="p-6 border rounded-lg shadow bg-yellow-50 hover:bg-yellow-100 transition duration-300">
                  <p className="text-lg font-semibold"><strong>Email:</strong> {request.email}</p>
                  <p className="text-lg"><strong>Nome:</strong> {request.name || 'Não informado'}</p>
                  <p className="text-lg"><strong>Telefone:</strong> {request.phone || 'Não informado'}</p>
                  <div className="mt-4 space-x-4">
                    <button
                      onClick={() => handleAdminRequest(request.id, 'accept')}
                      className="bg-green-800 text-white py-2 px-4 rounded hover:bg-green-600 transition duration-300"
                    >
                      Aceitar
                    </button>
                    <button
                      onClick={() => handleAdminRequest(request.id, 'reject')}
                      className="bg-red-800 text-white py-2 px-4 rounded hover:bg-red-600 transition duration-300"
                    >
                      Rejeitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">Nenhuma solicitação pendente.</p>
          )}
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
