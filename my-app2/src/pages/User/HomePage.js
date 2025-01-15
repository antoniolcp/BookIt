import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { auth, db } from '../../firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, collection, getDocs, query, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserIcon, CalendarCheck2, CalendarIcon, PhoneIcon, MailIcon, ClockIcon } from 'lucide-react';
import emailjs from 'emailjs-com';

export default function HomePage() {
  const [user, setUser] = useState(null);
  const [userType, setUserType] = useState('');
  const [isScrolled, setIsScrolled] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [name, setName] = useState('');
  const [confirmedReservations, setConfirmedReservations] = useState([]);
  const [unconfirmedReservations, setUnconfirmedReservations] = useState([]);
  const [unavailableTimes, setUnavailableTimes] = useState([]);

  // Obtém as reservas do usuário atual com base no UID do Firestore
  const fetchReservations = useCallback(async (uid) => {
    try {
      console.log('Fetching reservations for user:', uid);
      const reservationsRef = collection(db, 'reservations');
      const q = query(reservationsRef, where('userId', '==', uid));
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

      console.log('Confirmed reservations:', confirmed);
      console.log('Unconfirmed reservations:', unconfirmed);

      setConfirmedReservations(confirmed);
      setUnconfirmedReservations(unconfirmed);
    } catch (error) {
      console.error("Error fetching reservations: ", error);
    }
  }, []);
  
  // Estado de autenticação do usuário e inicializa os dados do usuário
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setUserEmail(currentUser.email);
        try {
          const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            console.log("user data", userData);
            setUserType(userData.userType);
            console.log(userData.phone);
            setUserPhone(userData.phone);
            console.log(userPhone);
            setName(userData.name || '');
            localStorage.setItem('userType', userData.userType);
            localStorage.setItem('userPhone', userData.phone || '');
          }
          await fetchReservations(currentUser.uid);
        } catch (error) {
          console.error("Error fetching user data: ", error);
        }
      } else {
        setUser(null);
        setUserType('');
        setUserEmail('');
        setUserPhone('');
        setName('');
        setConfirmedReservations([]);
        setUnconfirmedReservations([]);
        localStorage.removeItem('userType');
        localStorage.removeItem('userPhone');
      }
    });

    

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);

    emailjs.init("nZidWdpxryD0pae5R");

    return () => {
      unsubscribe();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [fetchReservations]);

  // Horários indisponíveis do Firestore e atualiza o estado
  useEffect(() => {
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
  
    fetchUnavailableTimes();
  }, []);
  
  // Lida com a criação de uma nova reserva, valida horários e envia e-mails de notificação
  const handleSubmit = async (e) => {
    e.preventDefault();
  
    if (!user) {
      alert('Por favor, faça login para criar uma reserva');
      return;
    }
  
    // Verificar se o horário está indisponível
    const isUnavailable = unavailableTimes.some(
      (unavailable) => unavailable.date === date && unavailable.time === time
    );
  
    if (isUnavailable) {
      alert('Este horário está indisponível. Por favor, escolha outro horário.');
      return;
    }
  
    try {
      const configRef = doc(db, 'settings', 'configurations');
      const configSnap = await getDoc(configRef);
      const { allowMultipleReservations, autoConfirm } = configSnap.data();
  
      if (!allowMultipleReservations) {
        const reservationsRef = collection(db, 'reservations');
        const q = query(
          reservationsRef,
          where('date', '==', date),
          where('time', '==', time)
        );
        const existingReservations = await getDocs(q);
  
        if (!existingReservations.empty) {
          alert('Já existe uma reserva para este horário. Por favor, escolha outro horário.');
          return;
        }
      }
  
      const reservationData = {
        userId: user.uid,
        name,
        date,
        time,
        email: userEmail,
        phone: userPhone,
        confirmed: autoConfirm || false,
        createdAt: serverTimestamp(),
      };
  
      const templateParams = {
        to_name: name,
        reservation_date: date,
        reservation_time: time,
        user_name: name,
        user_email: userEmail,
      };
  
      // Criar a reserva no Firestore
      const docRef = await addDoc(collection(db, 'reservations'), reservationData);
  
      if (autoConfirm) {
        setConfirmedReservations((prev) => [
          ...prev,
          { id: docRef.id, ...reservationData },
        ]);
      } else {
        setUnconfirmedReservations((prev) => [
          ...prev,
          { id: docRef.id, ...reservationData },
        ]);
      }
  
      // Buscar o e-mail do administrador do Firebase
      const usersRef = collection(db, 'users');
      const adminQuery = query(usersRef, where('userType', '==', 'admin'));
      const adminSnapshot = await getDocs(adminQuery);
  
      const adminEmails = adminSnapshot.docs.map((doc) => doc.data().email);
  
      // Criar lista de destinatários
      const emails = [userEmail, ...adminEmails];
  
      const emailTemplateId = autoConfirm
        ? 'template_9h16ac3' 
        : 'template_8uh4y0n'; 

      // Enviar mails para todos os destinatários
      for (const recipient of emails) {
        await emailjs.send(
          'service_l4lqnu7', //serviceID
          emailTemplateId,
          { ...templateParams, user_email: recipient },
          'MAo_nQDPzCimRKgYS' //public key
        );
      }
  
      alert('Reserva criada com sucesso! Verifique seu e-mail para mais detalhes.');
  
      // Resetar os campos de formulário
      setDate('');
      setTime('');
      setName('');
  
      // Atualizar a lista de reservas
      await fetchReservations(user.uid);
    } catch (error) {
      console.error('Erro ao criar reserva:', error);
      alert(`Erro ao criar reserva. Detalhes: ${error.message}`);
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
            <CalendarCheck2 className={`h-12 w-12 ${isScrolled ? 'text-green-800' : 'text-white'}`} />
            <h1 className={`text-6xl font-extrabold ${isScrolled ? 'text-green-800' : 'text-white'}`}>Book!t</h1>
          </Link>
          
          <div className="w-1/3 flex justify-end items-end space-x-2">
            {user ? (
              <div className="flex items-center space-x-4">
                <Link
                  to={user.email === 'antoniocollarespereira@gmail.com' ? '/adminUserPage' : '/userPage'}
                  className={`p-2 rounded-full hover:bg-opacity-20 hover:bg-gray-300 transition-colors duration-300 ${
                    isScrolled ? 'text-green-800' : 'text-white'
                  }`}
                >
                  <UserIcon className="h-7 w-7" />
                </Link>
                <div className={`flex flex-col items-center ${isScrolled ? 'text-green-800' : 'text-white'}`}>
                  <span className="text-2sm">{user.email}</span>
                  <span className="text-sm">{userType}</span>
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
        <div className="bg-white rounded-lg shadow-lg p-8 mb-10">
          <h2 className="text-3xl font-bold mb-6 text-center text-green-800">Faça a sua próxima reserva</h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner hover:bg-gray-200 transition-colors duration-300">
              <CalendarIcon className="text-gray-500 mr-2" />
              <input
                type="date"
                className="bg-transparent w-full focus:outline-none text-gray-700"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner hover:bg-gray-200 transition-colors duration-300">
              <ClockIcon className="text-gray-500 mr-2" />
              <input
                type="time"
                className="bg-transparent w-full focus:outline-none text-gray-700"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner hover:bg-gray-200 transition-colors duration-300">
              <UserIcon className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Nome"
                className="bg-transparent w-full focus:outline-none text-gray-700"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner hover:bg-gray-200 transition-colors duration-300">
              <MailIcon className="text-gray-500 mr-2" />
              <input
                type="email"
                placeholder="Email"
                className="bg-transparent w-full focus:outline-none text-gray-700"
                value={userEmail}
                readOnly
              />
            </div>
            <div className="flex items-center bg-gray-100 p-3 rounded-lg shadow-inner hover:bg-gray-200 transition-colors duration-300 md:col-span-2">
              <PhoneIcon className="text-gray-500 mr-2" />
              <input
                type="tel"
                placeholder="Número de telefone"
                className="bg-transparent w-full focus:outline-none text-gray-700"
                value={userPhone}
                readOnly
              />
            </div>
            <button type="submit" className="bg-green-800 text-white py-3 px-6 rounded-lg font-semibold hover:bg-green-700 transition duration-300 shadow-md md:col-span-2">
              Reservar
            </button>
          </form>
        </div>

        {user && (
          <div className="bg-white rounded-lg shadow-lg p-8 mb-10">
            <h2 className="text-3xl font-bold mb-6 text-center text-green-800">Suas Reservas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="text-xl font-semibold mb-4 text-green-700">Reservas Confirmadas</h3>
                {confirmedReservations.length > 0 ? (
                  <ul className="space-y-4">
                    {confirmedReservations.map((reservation) => (
                      <li key={reservation.id} className="bg-green-100 p-4 rounded-lg">
                        <p><strong>Data:</strong> {reservation.date}</p>
                        <p><strong>Hora:</strong> {reservation.time}</p>
                        <p><strong>Nome:</strong> {reservation.name}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhuma reserva confirmada.</p>
                )}
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-4 text-yellow-600">Reservas Não Confirmadas</h3>
                {unconfirmedReservations.length > 0 ? (
                  <ul className="space-y-4">
                    {unconfirmedReservations.map((reservation) => (
                      <li key={reservation.id} className="bg-yellow-100 p-4 rounded-lg">
                        <p><strong>Data:</strong> {reservation.date}</p>
                        <p><strong>Hora:</strong> {reservation.time}</p>
                        <p><strong>Nome:</strong> {reservation.name}</p>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p>Nenhuma reserva pendente de confirmação.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      <footer className="bg-gray-800 text-white p-6 mt-10">
        <div className="container mx-auto flex flex-col md:flex-row justify-between items-center">
          <p>&copy; 2024 Book!t. All rights reserved.</p>
          <div className="mt-4 md:mt-0 flex space-x-4">
            <a href="#" className="hover:text-green-400 transition duration-300">Privacy Policy</a>
            <a href="#" className="hover:text-green-400 transition duration-300">Terms of Service</a>
            <a href="#" className="hover:text-green-400 transition duration-300">Contact Us</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
