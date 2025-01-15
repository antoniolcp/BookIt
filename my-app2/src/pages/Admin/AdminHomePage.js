import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { collection, getDocs, query, where, updateDoc, doc, getDoc,setDoc } from 'firebase/firestore';
import { CalendarCheck2, ChevronLeft, ChevronRight, UserIcon } from 'lucide-react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';
import emailjs from 'emailjs-com';

export default function AdminHomePage() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [confirmedReservations, setConfirmedReservations] = useState([]);
  const [unconfirmedReservations, setUnconfirmedReservations] = useState([]);
  const [autoConfirm, setAutoConfirm] = useState(false);
  const [allowMultipleReservations, setAllowMultipleReservations] = useState(false);
  const [unavailableTimes, setUnavailableTimes] = useState([]); 
  const [unavailableDate, setUnavailableDate] = useState('');   
  const [unavailableTime, setUnavailableTime] = useState('');

 // Configura a inicialização do EmailJS e adiciona um listener para mudanças no estado do usuário e no scroll da página.
  useEffect(() => {
    emailjs.init("MAo_nQDPzCimRKgYS");
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // Atualiza as reservas com base na data selecionada.
  useEffect(() => {
    fetchReservations(selectedDate);
  }, [selectedDate]);

  // Vai buscar reservas no Firestore para uma data específica e categoriza como confirmadas ou não confirmadas.
  const fetchReservations = async (date) => {
    try {
      const formattedDate = date.toISOString().split('T')[0];
      const reservationsRef = collection(db, 'reservations');
      const q = query(reservationsRef, where('date', '==', formattedDate));
      const querySnapshot = await getDocs(q);
      const confirmed = [];
      const unconfirmed = [];
      querySnapshot.forEach((doc) => {
        const reservation = { id: doc.id, ...doc.data() };
        if (reservation.confirmed) {
          confirmed.push(reservation);
        } else {
          unconfirmed.push(reservation);
        }
      });
      setConfirmedReservations(confirmed);
      setUnconfirmedReservations(unconfirmed);
    } catch (error) {
      console.error('Erro ao buscar reservas:', error);
    }
  };
  
  // Alterna o estado de confirmação de uma reserva no Firestore e envia um email de notificação.
  const toggleReservationConfirmation = async (id, action) => {
    try {
      console.log('ID da reserva:', id);
  
      const reservationRef = doc(db, 'reservations', id);
  
      // Atualiza os campos corretamente
      const updateData = {};
      if (action === 'confirm') {
        updateData.confirmed = true;
        updateData.notConfirmed = false;
      } else if (action === 'notConfirm') {
        updateData.confirmed = false;
        updateData.notConfirmed = true;
      }
      await updateDoc(reservationRef, updateData);
      console.log('Atualização no Firestore concluída.');
  
      // Obtém os dados da reserva
      const reservationDoc = await getDoc(reservationRef);
      if (!reservationDoc.exists()) {
        throw new Error('O documento da reserva não existe no Firestore.');
      }
      const reservationData = reservationDoc.data();
      console.log('Dados da reserva:', reservationData);
  
      // Verifica se os dados necessários estão presentes
      if (!reservationData.name || !reservationData.date || !reservationData.time || !reservationData.email) {
        throw new Error('Dados da reserva estão incompletos para envio do email.');
      }
  
      // Prepara os parâmetros e o template do email
      const templateParams = {
        to_name: reservationData.name,
        reservation_date: reservationData.date,
        reservation_time: reservationData.time,
        user_email: reservationData.email,
      };
      const emailTemplateId = action === 'confirm' ? 'template_9h16ac3' : 'template_9h16ac3';

      // Envia o email
      await emailjs.send(
        'service_l4lqnu7',
        emailTemplateId,
        templateParams,
        'MAo_nQDPzCimRKgYS'
      );
      console.log('Email enviado com sucesso.');
  
      // Atualiza as reservas no estado local
      if (!selectedDate) {
        throw new Error('selectedDate está indefinido ou vazio.');
      }
      await fetchReservations(selectedDate);
      console.log('Estado atualizado com as reservas.');
  
      alert('Reserva atualizada com sucesso!');
    } catch (error) {
      console.error('Erro ao atualizar a confirmação ou enviar o email:', error);
      alert('Houve um problema ao processar a reserva. Tente novamente mais tarde.');
    }
  };
  
  // Renderiza o separador com reservas confirmadas e não confirmadas.
  const renderReservationsTab = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
      <div>
        <h3 className="text-green-800 text-xl text-center font-semibold mb-4">
          Reservas Confirmadas
        </h3>
        {confirmedReservations.length > 0 ? (
          <ul className="space-y-4">
            {confirmedReservations.map((reservation) => (
              <li key={reservation.id} className="bg-green-500 p-4 rounded-lg shadow">
                <p><strong>Nome:</strong> {reservation.name}</p>
                <p><strong>Hora:</strong> {reservation.time}</p>
                <button onClick={() => toggleReservationConfirmation(reservation.id, 'notConfirm')} className="mt-2 bg-red-800 text-white py-1 px-3 rounded">
                  Cancelar reserva
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma reserva confirmada.</p>
        )}
      </div>
      <div>
        <h3 className="text-yellow-600 text-center text-xl font-semibold mb-4">
          Reservas Não Confirmadas
        </h3>
        {unconfirmedReservations.length > 0 ? (
          <ul className="space-y-4">
            {unconfirmedReservations.map((reservation) => (
              <li key={reservation.id} className={`p-4 rounded-lg shadow ${
                reservation.notConfirmed ? 'bg-red-400' : 'bg-yellow-200'
              }`}>
                <p><strong>Nome:</strong> {reservation.name}</p>
                <p><strong>Hora:</strong> {reservation.time}</p>
                <div className="mt-2 space-x-2">
                  <button onClick={() => toggleReservationConfirmation(reservation.id, 'confirm')} className="bg-green-800 text-white py-1 px-3 rounded">
                    Confirmar
                  </button>
                  <button onClick={() => toggleReservationConfirmation(reservation.id, 'notConfirm')} className="bg-red-800 text-white py-1 px-3 rounded">
                    Não Confirmar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p>Nenhuma reserva pendente.</p>
        )}
      </div>
    </div>
  );


  useEffect(() => {
    fetchConfiguration();
  }, []);
  
  // Função para buscar configurações do Firestore
  const fetchConfiguration = async () => {
    try {
      const configRef = doc(db, 'settings', 'configurations');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        const data = configSnap.data();
        setAutoConfirm(data.autoConfirm || false);
        setAllowMultipleReservations(data.allowMultipleReservations || false);
      }
    } catch (error) {
      console.error('Erro ao buscar configurações:', error);
    }
  };
  
  // Função para salvar configurações no Firestore
  const saveConfiguration = async () => {
    try {
      const configRef = doc(db, 'settings', 'configurations');
      await setDoc(configRef, {
        autoConfirm,
        allowMultipleReservations,
      }, { merge: true });
      alert('Configurações salvas com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar configurações:', error);
      alert('Erro ao salvar configurações. Por favor, tente novamente.');
    }
  };  

  // Busca horários indisponíveis configurados no Firestore.
  const fetchUnavailableTimes = async () => {
    try {
      const configRef = doc(db, 'settings', 'configurations');
      const configSnap = await getDoc(configRef);
      if (configSnap.exists()) {
        setUnavailableTimes(configSnap.data().unavailableTimes || []);
      }
    } catch (error) {
      console.error('Erro ao buscar horários indisponíveis:', error);
    }
  };

  // Adiciona um novo horário indisponível à lista e atualiza no Firestore.
  const addUnavailableTime = async () => {
    if (!unavailableDate || !unavailableTime) {
      alert('Por favor, selecione uma data e horário.');
      return;
    }
  
    const newUnavailableTime = { date: unavailableDate, time: unavailableTime };
  
    try {
      const updatedTimes = [...unavailableTimes, newUnavailableTime];
      const configRef = doc(db, 'settings', 'configurations');
      await updateDoc(configRef, { unavailableTimes: updatedTimes });
      setUnavailableTimes(updatedTimes);
      setUnavailableDate('');
      setUnavailableTime('');
      alert('Horário indisponível adicionado com sucesso!');
    } catch (error) {
      console.error('Erro ao adicionar horário indisponível:', error);
    }
  };

  // Remove um horário indisponível da lista e atualiza no Firestore.
  const removeUnavailableTime = async (index) => {
    try {
      const updatedTimes = unavailableTimes.filter((_, i) => i !== index);
      const configRef = doc(db, 'settings', 'configurations');
      await updateDoc(configRef, { unavailableTimes: updatedTimes });
      setUnavailableTimes(updatedTimes);
      alert('Horário indisponível removido com sucesso!');
    } catch (error) {
      console.error('Erro ao remover horário indisponível:', error);
    }
  };
  
  useEffect(() => {
    if (currentTab === 1) {
      fetchUnavailableTimes();
    }
  }, [currentTab]);

  const [users, setUsers] = useState([]);

// Busca todos os usuários registrados e suas informações no Firestore
const fetchUsers = async () => {
  try {
    const usersRef = collection(db, 'users');
    const usersSnapshot = await getDocs(usersRef);

    const usersData = await Promise.all(
      usersSnapshot.docs.map(async (userDoc) => {
        const user = userDoc.data();
        const reservationsRef = collection(db, 'reservations');
        const reservationsQuery = query(reservationsRef, where('userId', '==', userDoc.id));
        const reservationsSnapshot = await getDocs(reservationsQuery);

        return {
          id: userDoc.id,
          email: user.email || 'N/A',
          name: user.name || 'N/A',
          phone: user.phone || 'N/A',
          totalReservations: reservationsSnapshot.size || 0,
        };
      })
    );

    setUsers(usersData);
  } catch (error) {
    console.error('Erro ao buscar usuários:', error);
  }
};

// Buscar utilizadores ao carregar o separador
useEffect(() => {
  if (currentTab === 2) {
    fetchUsers();
  }
}, [currentTab]);

// Renderiza o separador com a lista de usuários e suas informações.
  const renderUsersTab = () => (
    <div className="mt-6 bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-2xl font-bold text-green-800 mb-6">Lista de Utilizadores</h3>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white border border-gray-200">
          <thead>
            <tr>
              <th className="px-4 py-2 border">Email</th>
              <th className="px-4 py-2 border">Nome</th>
              <th className="px-4 py-2 border">Telefone</th>
              <th className="px-4 py-2 border">Total de Reservas</th>
            </tr>
          </thead>
          <tbody>
            {users.length > 0 ? (
              users.map((user) => (
                <tr key={user.id}>
                  <td className="px-4 py-2 border">{user.email}</td>
                  <td className="px-4 py-2 border">{user.name}</td>
                  <td className="px-4 py-2 border">{user.phone}</td>
                  <td className="px-4 py-2 border text-center">{user.totalReservations}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="px-4 py-2 text-center text-gray-500">
                  Nenhum utilizador encontrado.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

    // Atualiza o estado para refletir a data selecionada e busca reservas para essa data
    const handleDateChange = (date) => {
        setSelectedDate(date);
        fetchReservations(date);
      };
    
      // Retrocede para a aba anterior no painel de administração
  const handlePrevTab = () => {
    setCurrentTab((prev) => (prev - 1 + 3) % 3);
  };
  
  // Avança para a próxima aba no painel de administração.
  const handleNextTab = () => {
    setCurrentTab((prev) => (prev + 1) % 3);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <header className={`sticky top-0 z-10 transition-all duration-300 ${
        isScrolled ? 'bg-white shadow-md' : 'bg-gradient-to-r from-green-900 to-green-800'
      }`}>
        <div className="container mx-auto flex justify-between items-center py-6 px-6">
          <div className="w-1/3"></div>
          <Link to="/adminHomePage" className="flex items-center space-x-2 w-1/3 justify-center">
            <CalendarCheck2 className={`h-12 w-12 ${isScrolled ? 'text-green-800' : 'text-white'}`} />
            <h1 className={`text-6xl font-extrabold ${isScrolled ? 'text-green-800' : 'text-white'}`}>
              Book!t
            </h1>
          </Link>
          <div className="w-1/3 flex justify-end items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to="/adminUserPage"
                  className={`p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-300 transition-colors duration-300 ${
                    isScrolled ? 'text-green-800' : 'text-white'
                  }`}
                >
                  <UserIcon className="h-7 w-7" />
                </Link>
                <div className={`flex flex-col items-center ${
                  isScrolled ? 'text-green-800' : 'text-white'
                }`}>
                  <span className="text-2sm">{user.email}</span>
                </div>
              </div>
            ) : (
              <Link
                to="/login"
                className={`px-4 py-2 rounded-full text-sm font-medium transition duration-300 ${
                  isScrolled
                    ? 'bg-green-800 text-white hover:bg-green-700'
                    : 'bg-white text-green-800 hover:bg-green-100'
                }`}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </header>
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-6">
          <button onClick={handlePrevTab} className="p-3 bg-green-700 text-white rounded-full hover:bg-green-800 transition">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div className="text-4xl font-bold text-center text-green-800">
            {currentTab === 0 && 'Reservas'}
            {currentTab === 1 && 'Configurações'}
            {currentTab === 2 && 'Utilizadores'}
          </div>
          <button onClick={handleNextTab} className="p-3 bg-green-700 text-white rounded-full hover:bg-green-800 transition">
            <ChevronRight className="h-6 w-6" />
          </button>
        </div>
        {currentTab === 1 && (
  <div className="mt-12 space-y-6">
    {/* Box de Configurações Gerais */}
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-green-800 mb-4">Configurações Gerais</h3>
      <div className="space-y-4">
        {/* Opção de confirmação automática de reservas */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="autoConfirm"
            checked={autoConfirm}
            onChange={(e) => setAutoConfirm(e.target.checked)}
            className="form-checkbox h-5 w-5 text-green-600 focus:ring-2 focus:ring-green-400"
          />
          <label htmlFor="autoConfirm" className="text-lg font-medium text-gray-700">
            Confirmar reservas automaticamente
          </label>
        </div>

        {/* Opção de múltiplas reservas */}
        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="allowMultipleReservations"
            checked={allowMultipleReservations}
            onChange={(e) => setAllowMultipleReservations(e.target.checked)}
            className="form-checkbox h-5 w-5 text-green-600 focus:ring-2 focus:ring-green-400"
          />
          <label htmlFor="allowMultipleReservations" className="text-lg font-medium text-gray-700">
            Permitir múltiplas reservas no mesmo dia e hora
          </label>
        </div>
      </div>
    </div>

    {/* Box de Horários Indisponíveis */}
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold text-green-800 mb-4">Horários Indisponíveis</h3>
      <div className="space-y-4">
        {/* Adicionar horários indisponíveis */}
        <div className="flex items-center space-x-4">
          <input
            type="date"
            id="unavailableDate"
            className="bg-gray-100 p-2 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400"
            value={unavailableDate}
            onChange={(e) => setUnavailableDate(e.target.value)}
          />
          <input
            type="time"
            id="unavailableTime"
            className="bg-gray-100 p-2 rounded-lg shadow-inner focus:outline-none focus:ring-2 focus:ring-green-400"
            value={unavailableTime}
            onChange={(e) => setUnavailableTime(e.target.value)}
          />
          <button
            onClick={addUnavailableTime}
            className="bg-green-600 text-white px-4 py-2 rounded-lg shadow-md hover:bg-green-700 transition duration-300"
          >
            Adicionar
          </button>
        </div>

        {/* Lista de horários indisponíveis */}
        <ul className="space-y-2">
          {unavailableTimes.map((time, index) => (
            <li
              key={index}
              className="flex justify-between items-center bg-gray-100 p-2 rounded-lg shadow-md"
            >
              <span>
                {time.date} às {time.time}
              </span>
              <button
                onClick={() => removeUnavailableTime(index)}
                className="bg-red-600 text-white px-3 py-1 rounded-lg shadow-md hover:bg-red-700 transition duration-300"
              >
                Remover
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>

    {/* Botão para salvar configurações */}
    <div className="bg-white p-6 rounded-lg shadow-md">
      <button
        onClick={saveConfiguration}
        className="w-full px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow hover:bg-green-700 transition duration-300 focus:outline-none focus:ring-2 focus:ring-green-400"
      >
        Salvar Configurações
      </button>
    </div>
  </div>
)}


        {currentTab === 0 && (
          <>
            <Calendar
              onChange={handleDateChange}
              value={selectedDate}
              className="mx-auto bg-white shadow-md rounded-lg p-4"
            />
            {renderReservationsTab()}
          </>
        )}
        {currentTab === 2 && renderUsersTab()}
      </main>
      <footer className="bg-gray-800 text-white p-6 mt-10">
        <div className="container mx-auto text-center">
          <p>&copy; 2024 Book!t. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}