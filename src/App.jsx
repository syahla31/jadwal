import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronLeft, ChevronRight, List, Grid, CheckCircle, Award, BookOpen, Microscope, Plus, X, Trash2, Cloud, CloudOff, FileText, Pencil, AlertTriangle, Clock, Ban, RotateCcw, Check, ArrowLeft, Tag, ShieldCheck, Users, User, Bell, CalendarPlus, Mail } from 'lucide-react';

// --- FIREBASE IMPORTS ---
// Import fungsi-fungsi logika Firebase yang dibutuhkan komponen
import { collection, addDoc, onSnapshot, doc, deleteDoc, updateDoc } from 'firebase/firestore';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';

// IMPORT DARI FILE TERPISAH
// Kita mengimpor 'db' dan 'auth' yang sudah di-initialize di file firebase.js
import { db, auth } from './firebase';

// --- CONFIG & DATA ---
const CATEGORIES = {
  'Lab Uji (LU)': { color: 'bg-blue-100 text-blue-800 border-blue-200', icon: <Microscope size={14} />, dot: 'bg-blue-500' },
  'Lembaga Pelatihan (LP)': { color: 'bg-green-100 text-green-800 border-green-200', icon: <BookOpen size={14} />, dot: 'bg-green-500' },
  'Serkom (ADI/LSP)': { color: 'bg-orange-100 text-orange-800 border-orange-200', icon: <Award size={14} />, dot: 'bg-orange-500' },
  'Sertifikasi Keandalan': { color: 'bg-pink-100 text-pink-800 border-pink-200', icon: <ShieldCheck size={14} />, dot: 'bg-pink-500' },
  'Sistem Manajemen (SM)': { color: 'bg-purple-100 text-purple-800 border-purple-200', icon: <CheckCircle size={14} />, dot: 'bg-purple-500' },
  'Libur/Lainnya': { color: 'bg-red-50 text-red-600 border-red-100', icon: <Calendar size={14} />, dot: 'bg-red-500' },
};

// DAFTAR PERSONIL & EMAILNYA
// TODO: Ganti dengan email asli
const PERSONNEL_EMAILS = {
  'Irma': 'irmasepti99@gmail.com',
  'Pak Kunto': 'jessycaazzahra2018@gmail.com',
  'Pak Adi': 'dradjat09@gmail.com',
  'Pak Aji': 'thebriefcase123@gmail.com',
  'Pak Suryo': 'suryofismed@gmail.com',
  'Pak Deddy': 'deddyrus@gmail.com',
  'Pak Joni': 'jonikadir@gmail.com',
  'Pak Alim': 'alimuddin11077@gmail.com',
  'Sari': 'sarrycitta@gmail.com'
};

const PERSONNEL_LIST = Object.keys(PERSONNEL_EMAILS);

const VARIABLE_HOLIDAYS = {
  '2026-01-16': 'Isra Mi\'raj 1447H',
  '2026-02-16': 'Cuti Bersama Tahun Baru Imlek',
  '2026-02-17': 'Tahun Baru Imlek 2577',
  '2026-03-18': 'Cuti Bersama Hari Suci Nyepi',
  '2026-03-19': 'Hari Suci Nyepi 1948',
  '2026-03-20': 'Hari Raya Idul Fitri 1447H',
  '2026-03-21': 'Hari Raya Idul Fitri 1447H', 
  '2026-03-23': 'Cuti Bersama Hari Raya Idul Fitri', 
  '2026-03-24': 'Cuti Bersama Hari Raya Idul Fitri', 
  '2026-04-03': 'Wafat Yesus Kristus',
  '2026-04-05': 'Hari Paskah',
  '2026-05-14': 'Kenaikan Yesus Kristus',
  '2026-05-15': 'Cuti Bersama Kenaikan Isa Al Masih',
  '2026-05-27': 'Hari Raya Idul Adha 1447H',
  '2026-05-28': 'Hari Raya Idul Adha 1447H',
  '2026-05-31': 'Hari Raya Waisak 2570',
  '2026-06-16': 'Tahun Baru Islam 1448H',
  '2026-08-25': 'Maulid Nabi Muhammad SAW',
  '2026-12-24': 'Cuti Bersama Natal',
};

const FIXED_HOLIDAYS = {
  '01-01': 'Tahun Baru Masehi',
  '05-01': 'Hari Buruh Internasional',
  '06-01': 'Hari Lahir Pancasila',
  '08-17': 'HUT Kemerdekaan RI',
  '12-25': 'Hari Raya Natal',
  '12-31': 'Tahun Baru',
};

const SAMPLE_DATA = [
  { title: 'Contoh: Pelatihan & Sertifikasi', startDate: '2026-01-15', endDate: '2026-01-15', categories: ['Lembaga Pelatihan (LP)', 'Serkom (ADI/LSP)'], personnel: ['Pak Kunto', 'Sari'], status: 'active' },
  { title: 'Contoh: Audit Internal', startDate: '2026-06-01', endDate: '2026-06-05', categories: ['Sistem Manajemen (SM)'], personnel: ['Pak Adi', 'Irma'], status: 'active' },
];

const MONTHS = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'];
const DAYS = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];

export default function App() {
  const [user, setUser] = useState(null);
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState(''); 
  
  const [currentDate, setCurrentDate] = useState(new Date(2026, 0)); 
  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('calendar');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailView, setIsDetailView] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [newEvent, setNewEvent] = useState({
    title: '',
    startDate: '2026-01-01',
    endDate: '2026-01-01',
    categories: [], 
    personnel: [],
    status: 'active'
  });
  
  // State untuk Notifikasi
  const [reminders, setReminders] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef(null); 

  const [formError, setFormError] = useState('');

  // 1. AUTHENTICATION
  useEffect(() => {
    // Auth diambil dari variabel global di atas
    signInAnonymously(auth).catch((err) => {
      console.error("Gagal Login:", err);
      setIsOfflineMode(true);
      setLoading(false);
      setErrorMsg(err.message || "Gagal Login Anonim");
    });

    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      if (!u) setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. DATA FETCHING & LOGIKA REMINDER
  useEffect(() => {
    if (!user) return;

    try {
      // db diambil dari variabel global di atas
      const eventsRef = collection(db, 'jadwal_mutu_2026');
      const unsubscribe = onSnapshot(eventsRef, (snapshot) => {
        const loadedEvents = snapshot.docs.map(doc => {
          const data = doc.data();
          let cats = data.categories;
          if (!cats && data.category) {
            cats = [data.category];
          } else if (!cats) {
            cats = ['Lab Uji (LU)'];
          }

          return {
            id: doc.id,
            ...data,
            startDate: data.startDate || data.date,
            endDate: data.endDate || data.date,
            categories: cats,
            personnel: data.personnel || [],
            status: data.status || 'active'
          };
        });
        setEvents(loadedEvents);
        
        // --- LOGIKA PENGINGAT H-1 ---
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        
        const tomorrowStr = `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
        
        const upcomingEvents = loadedEvents.filter(ev => 
          ev.startDate === tomorrowStr && ev.status === 'active'
        );
        
        setReminders(upcomingEvents);
        // ---------------------------

        setLoading(false);
        setIsOfflineMode(false);
        setErrorMsg(''); 
      }, (err) => {
        console.error("Koneksi Database Putus:", err);
        setIsOfflineMode(true);
        setLoading(false);
        setErrorMsg(err.message || "Gagal membaca database");
      });
      return () => unsubscribe();
    } catch (e) {
      setIsOfflineMode(true);
      setLoading(false);
      setErrorMsg(e.message);
    }
  }, [user]);

  // Click Outside Listener
  useEffect(() => {
    function handleClickOutside(event) {
      if (notifRef.current && !notifRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [notifRef]);

  // --- HELPER FUNCTIONS ---
  const getHolidayName = (year, month, day) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    const dateMonthStr = `${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

    if (VARIABLE_HOLIDAYS[dateStr]) return VARIABLE_HOLIDAYS[dateStr];
    if (FIXED_HOLIDAYS[dateMonthStr]) return FIXED_HOLIDAYS[dateMonthStr];

    return null;
  };

  const handleCategoryToggle = (cat) => {
    setFormError(''); 
    setNewEvent(prev => {
      const exists = prev.categories.includes(cat);
      let newCats;
      if (exists) {
        newCats = prev.categories.filter(c => c !== cat);
      } else {
        newCats = [...prev.categories, cat];
      }
      return { ...prev, categories: newCats };
    });
  };

  const handlePersonnelToggle = (person) => {
    setFormError(''); 
    setNewEvent(prev => {
      const exists = prev.personnel.includes(person);
      let newPeople;
      if (exists) {
        newPeople = prev.personnel.filter(p => p !== person);
      } else {
        newPeople = [...prev.personnel, person];
      }
      return { ...prev, personnel: newPeople };
    });
  };

  // --- FITUR EKSTRA: GOOGLE CALENDAR & EMAIL ---
  const addToGoogleCalendar = (event) => {
    const title = encodeURIComponent(event.title);
    
    // FORMAT NOTES YANG LEBIH RAPI
    const descriptionText = `
[DETAIL KEGIATAN]
📋 Kategori: ${event.categories.join(', ')}
👥 Personil: ${event.personnel.join(', ')}

--------------------------------
Dibuat otomatis oleh Aplikasi Jadwal Mutu
`.trim();

    const details = encodeURIComponent(descriptionText);
    
    const guestEmails = event.personnel
      .map(name => PERSONNEL_EMAILS[name])
      .filter(email => email)
      .join(',');

    const startDate = event.startDate.replace(/-/g, '');
    const endDateObj = new Date(event.endDate);
    endDateObj.setDate(endDateObj.getDate() + 1);
    const endDate = endDateObj.toISOString().split('T')[0].replace(/-/g, '');

    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startDate}/${endDate}&details=${details}&add=${guestEmails}`;
    window.open(url, '_blank');
  };

  const handleEmailInvite = (event) => {
    if (!event.personnel || event.personnel.length === 0) {
      alert("Tidak ada personil yang dipilih untuk kegiatan ini.");
      return;
    }

    const recipientEmails = event.personnel
      .map(name => PERSONNEL_EMAILS[name])
      .filter(email => email) 
      .join(',');

    if (!recipientEmails) {
      alert("Email personil belum terdaftar di sistem. Silakan isi daftar email di kode program (bagian PERSONNEL_EMAILS).");
      return;
    }

    const subject = encodeURIComponent(`[PENTING] Pengingat Kegiatan: ${event.title}`);
    const body = encodeURIComponent(
`Halo Bapak/Ibu,

Ini adalah pengingat otomatis untuk kegiatan mendatang:

📌 Kegiatan: ${event.title}
📅 Tanggal: ${formatDateLong(event.startDate)} s.d ${formatDateLong(event.endDate)}
🏷️ Kategori: ${event.categories.join(', ')}
👥 Personil: ${event.personnel.join(', ')}

Mohon dipersiapkan dengan baik. 
Terima kasih.

(Dikirim via Aplikasi Jadwal Mutu)`
    );

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${recipientEmails}&su=${subject}&body=${body}`;
    window.open(gmailUrl, '_blank');
  };

  const handleEventClick = (event, e) => {
    if (e) e.stopPropagation();
    setEditingId(event.id);
    setFormError(''); 
    setNewEvent({
      title: event.title,
      startDate: event.startDate,
      endDate: event.endDate,
      categories: event.categories,
      personnel: event.personnel || [],
      status: event.status || 'active'
    });
    setIsDetailView(true);
    setIsModalOpen(true);
    setShowNotifications(false); 
  };

  const handleDateClick = (day) => {
    setEditingId(null);
    setFormError(''); 
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const dayStr = String(day).padStart(2, '0');
    const clickedDate = `${year}-${month}-${dayStr}`;
    
    setNewEvent({ 
      title: '', 
      startDate: clickedDate, 
      endDate: clickedDate, 
      categories: [],
      personnel: [],
      status: 'active'
    });
    setIsDetailView(false); 
    setIsModalOpen(true);
  };

  const handleAddClick = () => {
    setEditingId(null);
    setFormError(''); 
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, '0');
    const defaultDate = `${year}-${month}-01`;
    
    setNewEvent({ 
      title: '', 
      startDate: defaultDate, 
      endDate: defaultDate, 
      categories: [],
      personnel: [],
      status: 'active'
    });
    setIsDetailView(false); 
    setIsModalOpen(true);
  };

  const handleSaveEvent = async (e) => {
    e.preventDefault();
    setFormError(''); 

    if (!newEvent.title || newEvent.title.trim() === "") {
      setFormError("Nama kegiatan wajib diisi!");
      return;
    }
    if (!newEvent.startDate || !newEvent.endDate) {
      setFormError("Tanggal mulai dan selesai wajib diisi!");
      return;
    }
    if (new Date(newEvent.endDate) < new Date(newEvent.startDate)) {
      setFormError("Tanggal Selesai tidak boleh lebih awal dari Mulai!");
      return;
    }
    if (newEvent.categories.length === 0) {
      setFormError("Mohon pilih minimal 1 kategori kegiatan.");
      return;
    }
    if (!newEvent.personnel || newEvent.personnel.length === 0) {
      setFormError("Mohon pilih minimal 1 personil terkait.");
      return;
    }
    if (isOfflineMode) {
      setFormError("Sedang Offline. Data tidak tersimpan ke server.");
      return;
    }

    try {
      const colRef = collection(db, 'jadwal_mutu_2026');
      
      const eventData = {
        title: newEvent.title,
        startDate: newEvent.startDate,
        endDate: newEvent.endDate,
        categories: newEvent.categories,
        personnel: newEvent.personnel,
        status: newEvent.status || 'active',
        updatedAt: new Date().toISOString(),
        updatedBy: user?.uid || 'anon'
      };

      if (editingId) {
        const docRef = doc(db, 'jadwal_mutu_2026', editingId);
        await updateDoc(docRef, eventData);
      } else {
        await addDoc(colRef, {
          ...eventData,
          createdAt: new Date().toISOString(),
        });
      }
      setIsModalOpen(false);
      const d = new Date(newEvent.startDate);
      setCurrentDate(new Date(d.getFullYear(), d.getMonth(), 1));
    } catch (err) {
      setFormError("Gagal menyimpan: " + err.message);
    }
  };

  const handleDeleteEvent = async (id) => {
    if (!window.confirm('Hapus PERMANEN jadwal ini?')) return;
    if (isOfflineMode) return;

    try {
      await deleteDoc(doc(db, 'jadwal_mutu_2026', id));
      setIsModalOpen(false); 
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus.");
    }
  };

  const handleLoadSample = async () => {
    if (isOfflineMode) return;
    setLoading(true);
    try {
      const colRef = collection(db, 'jadwal_mutu_2026');
      for (const item of SAMPLE_DATA) {
        await addDoc(colRef, { ...item, createdBy: 'system_sample' });
      }
    } catch(e) {
      console.error(e);
    }
    setLoading(false);
  };

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const filteredEvents = events.filter(event => {
    const eventStart = new Date(event.startDate);
    const eventEnd = new Date(event.endDate);
    const monthStart = new Date(year, month, 1);
    const monthEnd = new Date(year, month + 1, 0); 

    const isOverlapping = (eventStart <= monthEnd) && (eventEnd >= monthStart);
    const isCategoryMatch = activeCategory === 'All' || (event.categories && event.categories.includes(activeCategory));
    
    return isOverlapping && isCategoryMatch;
  });

  const getEventsForDay = (day) => {
    const currentDayDate = new Date(year, month, day);
    currentDayDate.setHours(0,0,0,0);

    return filteredEvents.filter(ev => {
      const start = new Date(ev.startDate);
      const end = new Date(ev.endDate);
      start.setHours(0,0,0,0);
      end.setHours(0,0,0,0);
      return currentDayDate >= start && currentDayDate <= end;
    });
  };

  const formatDateRange = (start, end) => {
    const s = new Date(start);
    const e = new Date(end);
    if (s.getTime() === e.getTime()) return s.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    if (s.getMonth() === e.getMonth()) return `${s.getDate()} - ${e.getDate()} ${s.toLocaleDateString('id-ID', { month: 'short' })}`;
    return `${s.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })} - ${e.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}`;
  };

  const formatDateLong = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  };

  const renderCalendar = () => {
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDay = new Date(year, month, 1).getDay();
    
    return (
      <div className="grid grid-cols-7 gap-1 sm:gap-2 mb-4">
        {DAYS.map((d, i) => (
          <div key={d} className={`text-center text-[10px] sm:text-xs font-bold py-2 ${i === 0 || i === 6 ? 'text-red-500' : 'text-gray-500'}`}>
            {d}
          </div>
        ))}
        {Array(startDay).fill(null).map((_, i) => <div key={`blank-${i}`} className="h-16 sm:h-24 bg-white rounded-lg"/>)}
        {Array(daysInMonth).fill(null).map((_, i) => {
          const day = i + 1;
          const dayEvents = getEventsForDay(day);
          const currentDayDate = new Date(year, month, day);
          const isToday = currentDayDate.toDateString() === new Date().toDateString();
          const isWeekend = currentDayDate.getDay() === 0 || currentDayDate.getDay() === 6;
          const holidayName = getHolidayName(year, month, day);
          const isRedDate = isWeekend || holidayName;

          return (
            <div 
              key={day} 
              onClick={() => handleDateClick(day)}
              className={`min-h-[4rem] sm:min-h-[6rem] border rounded-lg p-1 relative transition-colors cursor-pointer hover:bg-gray-50 ${isToday ? 'border-blue-500 ring-1 ring-blue-500 bg-white' : 'border-gray-100 bg-white'} ${isRedDate ? 'bg-red-50/20 hover:bg-red-50/40' : ''}`}
            >
              <div className="flex justify-between items-start mb-1">
                <div className={`text-xs sm:text-sm font-medium ${isToday ? 'text-blue-600' : isRedDate ? 'text-red-600' : 'text-gray-700'}`}>
                  {day}
                </div>
                {holidayName && (
                  <div className="hidden sm:block text-[8px] leading-tight text-right text-red-500 font-medium max-w-[70%] ml-auto">
                    {holidayName}
                  </div>
                )}
              </div>
              {/* Holiday dot for mobile */}
              {holidayName && <div className="sm:hidden w-1.5 h-1.5 bg-red-500 rounded-full absolute top-1.5 right-1.5"></div>}

              <div className="flex flex-col gap-1 overflow-y-auto max-h-[2.5rem] sm:max-h-[5rem] scrollbar-hide">
                {dayEvents.map((ev, idx) => {
                  const isCancelled = ev.status === 'cancelled';
                  const mainCat = ev.categories[0];
                  const style = isCancelled 
                    ? 'bg-gray-100 border-gray-200 text-gray-400 line-through' 
                    : `${CATEGORIES[mainCat]?.color || 'bg-gray-100'}`;

                  return (
                    <div key={`${ev.id}-${day}`} 
                      className={`text-[9px] sm:text-xs p-0.5 sm:p-1.5 rounded border-l-2 sm:border-l-4 cursor-pointer group hover:shadow-md ${style}`} 
                      onClick={(e) => handleEventClick(ev, e)}
                    >
                      <div className="truncate font-semibold">{ev.title}</div>
                      {!isCancelled && ev.categories.length > 1 && (
                        <div className="flex gap-0.5 mt-0.5">
                          {ev.categories.map(cat => (
                            <div key={cat} className={`w-1 h-1 sm:w-1.5 sm:h-1.5 rounded-full ${CATEGORIES[cat]?.dot}`}></div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  if (loading) return <div className="flex h-screen items-center justify-center text-gray-500 font-medium bg-white">Memuat Aplikasi...</div>;

  return (
    <div className="max-w-6xl mx-auto p-4 bg-white min-h-screen font-sans flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-6 relative">
        <div className="flex-1">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 flex items-center gap-2">
            Kalender Kegiatan {year}
            {isOfflineMode ? 
              <span className="text-[10px] sm:text-xs bg-gray-100 text-gray-600 border border-gray-200 px-2 py-1 rounded-full flex items-center gap-1"><CloudOff size={10}/> Offline</span> : 
              <span className="text-[10px] sm:text-xs bg-green-50 text-green-700 border border-green-200 px-2 py-1 rounded-full flex items-center gap-1"><Cloud size={10}/> Online</span>
            }
          </h1>
          <p className="text-xs sm:text-sm text-gray-500">Jadwal Mutu, Pelatihan & Sertifikasi</p>
        </div>

        {/* --- PENGINGAT H-1 NOTIFICATION CENTER --- */}
        <div className="flex items-center gap-3">
          <div className="relative" ref={notifRef}>
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className={`p-2 rounded-full transition-colors relative ${showNotifications ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-600'}`}
            >
              <Bell size={20} />
              {reminders.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>
              )}
            </button>

            {/* Dropdown Notifikasi */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white rounded-xl shadow-xl border border-gray-200 z-50 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                <div className="bg-gray-50 px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                  <h3 className="font-bold text-sm text-gray-800">Pengingat (H-1)</h3>
                  <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-bold">{reminders.length}</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {reminders.length === 0 ? (
                    <div className="p-6 text-center text-gray-400 text-sm">
                      <CheckCircle size={32} className="mx-auto mb-2 opacity-20" />
                      Tidak ada kegiatan untuk besok.
                    </div>
                  ) : (
                    <div className="divide-y divide-gray-100">
                      {reminders.map(ev => (
                        <div 
                          key={ev.id} 
                          className="p-3 hover:bg-gray-50 transition-colors"
                        >
                          <div className="cursor-pointer" onClick={(e) => handleEventClick(ev, e)}>
                            <div className="flex justify-between items-start mb-1">
                              <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${CATEGORIES[ev.categories[0]]?.color}`}>
                                {ev.categories[0]}
                              </span>
                              <span className="text-[10px] text-gray-400 font-mono">Besok</span>
                            </div>
                            <p className="text-sm font-bold text-gray-800 line-clamp-1">{ev.title}</p>
                            
                            {/* List Personil di Notif */}
                            <div className="mt-2 mb-2 flex items-center gap-2 text-xs text-gray-600 bg-yellow-50 p-2 rounded border border-yellow-100">
                               <Users size={12} className="text-yellow-600 shrink-0"/>
                               <span className="truncate">
                                 <span className="font-bold">Personil: </span>
                                 {ev.personnel?.join(', ') || '-'}
                               </span>
                            </div>
                          </div>

                          {/* Tombol Kirim Email di Notifikasi */}
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              handleEmailInvite(ev);
                            }}
                            className="w-full mt-1 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 text-xs font-bold py-1.5 rounded-lg flex items-center justify-center gap-1 transition-colors"
                          >
                            <Mail size={12} /> Buka Gmail
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {events.length === 0 && !isOfflineMode && (
            <button onClick={handleLoadSample} className="bg-white border border-gray-300 px-3 py-1.5 rounded-lg text-sm shadow-sm flex items-center gap-2 hover:bg-gray-50 transition-colors">
              <FileText size={14} /> Isi Contoh
            </button>
          )}
        </div>
      </div>

      {isOfflineMode && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3 mb-4 text-xs sm:text-sm text-yellow-800 flex items-start gap-2 rounded-r">
          <AlertTriangle size={16} className="mt-0.5 flex-shrink-0" />
          <div>
            <span className="font-bold">Mode Offline Terdeteksi:</span>
            <p>Aplikasi gagal terhubung ke server (meski ada internet).</p>
            {errorMsg && <p className="mt-1 font-mono text-xs bg-yellow-100 p-1 rounded border border-yellow-200">Error: {errorMsg}</p>}
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="bg-white p-3 rounded-xl shadow-sm border border-gray-200 mb-6 flex flex-col sm:flex-row gap-3 justify-between items-stretch sm:items-center">
        <button onClick={handleAddClick} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex gap-2 items-center justify-center hover:bg-blue-700 transition-colors shadow-sm">
          <Plus size={16} /> Tambah
        </button>

        <div className="flex items-center justify-between gap-2 bg-white px-2 py-1 rounded-lg border border-gray-200 order-first sm:order-none">
          <button onClick={handlePrevMonth} className="hover:bg-gray-100 p-1 rounded"><ChevronLeft size={20} className="text-gray-600"/></button>
          <span className="font-bold text-gray-800 w-32 text-center text-sm sm:text-base">{MONTHS[month]} {year}</span>
          <button onClick={handleNextMonth} className="hover:bg-gray-100 p-1 rounded"><ChevronRight size={20} className="text-gray-600"/></button>
        </div>

        <div className="flex bg-white border border-gray-200 p-1 rounded-lg">
          <button onClick={() => setViewMode('calendar')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode==='calendar'?'bg-blue-50 text-blue-600 font-bold shadow-sm':'text-gray-500 hover:text-gray-700'}`}>Kalender</button>
          <button onClick={() => setViewMode('list')} className={`flex-1 sm:flex-none px-3 py-1.5 rounded text-xs font-medium transition-all ${viewMode==='list'?'bg-blue-50 text-blue-600 font-bold shadow-sm':'text-gray-500 hover:text-gray-700'}`}>List</button>
        </div>
      </div>

      {/* Filter Kategori - Scrollable on mobile */}
      <div className="overflow-x-auto pb-2 mb-2 scrollbar-hide">
        <div className="flex gap-2 min-w-max">
          <button onClick={() => setActiveCategory('All')} className={`px-3 py-1 text-xs rounded-full border transition-colors ${activeCategory === 'All' ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'}`}>Semua</button>
          {Object.keys(CATEGORIES).map(cat => (
            <button key={cat} onClick={() => setActiveCategory(cat)} className={`px-3 py-1 text-xs rounded-full border flex items-center gap-2 transition-all ${activeCategory === cat ? 'bg-gray-100 ring-2 ring-gray-300 border-gray-300' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'}`}>
              <div className={`w-2 h-2 rounded-full ${CATEGORIES[cat].dot}`}></div> {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="bg-white p-2 sm:p-4 rounded-xl border border-gray-200 shadow-sm min-h-[400px]">
        {viewMode === 'calendar' ? renderCalendar() : (
          <div className="space-y-2">
            {filteredEvents.length === 0 ? <div className="text-center py-10 text-gray-400 text-sm">Tidak ada jadwal di bulan ini.</div> : 
              filteredEvents.sort((a,b)=>new Date(a.startDate)-new Date(b.startDate)).map(ev => {
                const isCancelled = ev.status === 'cancelled';
                const style = isCancelled 
                  ? 'bg-gray-50 border-gray-200 opacity-75' 
                  : 'bg-white hover:shadow-md cursor-pointer';
                const textStyle = isCancelled ? 'text-gray-400 line-through' : 'text-gray-800';

                return (
                  <div 
                    key={ev.id} 
                    onClick={(e) => handleEventClick(ev, e)}
                    className={`flex items-center p-3 rounded-lg border border-gray-100 shadow-sm relative group transition-shadow ${style}`}
                  >
                    <div className="w-12 sm:w-16 text-center border-r border-gray-100 pr-3 mr-3 flex flex-col justify-center shrink-0">
                      <div className={`text-base sm:text-lg font-bold ${isCancelled ? 'text-gray-400' : 'text-gray-800'}`}>{new Date(ev.startDate).getDate()}</div>
                      <div className="text-[9px] sm:text-[10px] uppercase text-gray-400 font-bold">{DAYS[new Date(ev.startDate).getDay()]}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2 mb-1">
                        {ev.categories.map(cat => (
                          <div key={cat} className={`text-[9px] sm:text-[10px] inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${CATEGORIES[cat]?.color} ${isCancelled ? 'opacity-50' : ''}`}>
                            <span className="hidden sm:inline">{CATEGORIES[cat]?.icon}</span> {cat}
                          </div>
                        ))}
                        
                        {isCancelled && <span className="text-[9px] sm:text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-bold flex items-center gap-1"><Ban size={10}/> BATAL</span>}
                        <div className="text-[9px] sm:text-[10px] text-gray-500 flex items-center gap-1 bg-white px-2 py-0.5 rounded-full border border-gray-200 whitespace-nowrap">
                          <Clock size={10} />
                          {formatDateRange(ev.startDate, ev.endDate)}
                        </div>
                      </div>
                      <div className={`text-sm sm:text-base font-bold truncate ${textStyle}`}>{ev.title}</div>
                      
                      {/* Personil di List View */}
                      <div className="mt-1 flex items-center gap-1 text-[10px] text-gray-500">
                         <Users size={10} />
                         <span className="truncate max-w-[200px]">{ev.personnel?.join(', ') || '-'}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            }
          </div>
        )}
      </div>

      {/* Footer */}
      <footer className="mt-10 py-6 text-center text-gray-400 text-xs">
        <p className="font-medium">© {new Date().getFullYear()} Sistem Informasi Jadwal Jaminan Mutu</p>
        <p className="mt-1">Dikelola oleh Tim Jaminan Mutu - SS</p>
      </footer>

      {/* Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 transition-opacity">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100 flex flex-col max-h-[90vh]">
            
            {/* Header Area */}
            <div className="bg-white px-4 sm:px-6 py-4 border-b border-gray-100 flex justify-between items-center shrink-0">
              <div className="flex items-center gap-3">
                 <div className={`p-2 rounded-lg ${editingId ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'}`}>
                   {editingId ? <Pencil size={20} /> : <Plus size={20} />}
                 </div>
                 <div>
                   <h3 className="font-bold text-lg text-gray-800">{editingId ? 'Edit Kegiatan' : 'Jadwal Baru'}</h3>
                   <p className="text-xs text-gray-500">{editingId ? 'Perbarui detail kegiatan.' : 'Tambahkan agenda baru.'}</p>
                 </div>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100">
                <X size={20}/>
              </button>
            </div>

            {/* Content Area */}
            <div className="p-4 sm:p-6 overflow-y-auto">
              {isDetailView ? (
                 <div className="space-y-6">
                   <div>
                     <h2 className="text-xl sm:text-2xl font-bold text-gray-900 leading-tight">{newEvent.title}</h2>
                     <div className="mt-2 flex flex-wrap gap-2">
                       {newEvent.categories.map(cat => (
                         <span key={cat} className={`text-xs px-2.5 py-1 rounded-md font-medium border flex items-center gap-1.5 ${CATEGORIES[cat]?.color}`}>
                           {CATEGORIES[cat]?.icon} {cat}
                         </span>
                       ))}
                     </div>
                   </div>

                   <div className="grid grid-cols-1 gap-4 bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                     <div className="flex items-start gap-3">
                       <div className="p-2 bg-white rounded-lg border border-gray-200 text-blue-600 shadow-sm">
                         <Clock size={18} />
                       </div>
                       <div>
                         <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Waktu Pelaksanaan</p>
                         <p className="text-sm font-semibold text-gray-800 mt-0.5">
                           {formatDateLong(newEvent.startDate)}
                         </p>
                         {newEvent.startDate !== newEvent.endDate && (
                           <p className="text-sm font-semibold text-gray-800">
                             sampai {formatDateLong(newEvent.endDate)}
                           </p>
                         )}
                       </div>
                     </div>

                     {/* Personil di Mode Detail */}
                     {newEvent.personnel && newEvent.personnel.length > 0 && (
                        <div className="flex items-start gap-3 mt-2 pt-2 border-t border-gray-100">
                          <div className="p-2 bg-white rounded-lg border border-gray-200 text-indigo-500 shadow-sm">
                            <Users size={18} />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 font-bold uppercase tracking-wider">Personil</p>
                            <div className="flex flex-wrap gap-2 mt-1">
                              {newEvent.personnel.map(p => (
                                <span key={p} className="text-xs font-medium bg-indigo-50 text-indigo-700 px-2 py-1 rounded-full border border-indigo-100">
                                  {p}
                                </span>
                              ))}
                            </div>
                          </div>
                        </div>
                     )}
                     
                     {newEvent.status === 'cancelled' && (
                       <div className="flex items-start gap-3 mt-2 pt-2 border-t border-gray-200">
                          <div className="p-2 bg-red-100 rounded-lg text-red-600">
                            <Ban size={18} />
                          </div>
                          <div>
                            <p className="text-xs text-red-600 font-bold uppercase">Status</p>
                            <p className="text-sm font-medium text-red-700">Dibatalkan</p>
                          </div>
                       </div>
                     )}
                   </div>
                   
                   {/* ACTION BUTTONS: GOOGLE CALENDAR & EMAIL */}
                   <div className="grid grid-cols-2 gap-3 mt-4">
                      <button 
                        onClick={() => addToGoogleCalendar(newEvent)}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 font-semibold hover:bg-blue-100 transition-colors"
                      >
                         <CalendarPlus size={18} />
                         <span className="text-xs sm:text-sm">Simpan ke G-Cal</span>
                      </button>
                      <button 
                        onClick={() => handleEmailInvite(newEvent)}
                        className="flex items-center justify-center gap-2 p-3 rounded-xl border border-gray-200 bg-white text-gray-700 font-semibold hover:bg-gray-50 transition-colors"
                      >
                         <Mail size={18} />
                         <span className="text-xs sm:text-sm">Buka Gmail</span>
                      </button>
                   </div>
                   <p className="text-[10px] text-gray-400 text-center italic mt-2">
                     *Simpan ke G-Cal untuk mendapatkan notifikasi email otomatis H-1 dari Google.
                   </p>
                 </div>
              ) : (
                 <div className="space-y-5">
                   
                   {formError && (
                     <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 animate-pulse">
                       <AlertTriangle size={16} className="shrink-0" />
                       <p>{formError}</p>
                     </div>
                   )}

                   <div>
                     <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Nama Kegiatan</label>
                     <input 
                       className="w-full bg-white border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium placeholder:font-normal" 
                       placeholder="Misal: Audit Internal ISO 17025..." 
                       value={newEvent.title} 
                       onChange={e => setNewEvent({...newEvent, title: e.target.value})} 
                       autoFocus={!editingId}
                     />
                   </div>

                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Mulai</label>
                       <input 
                         type="date" 
                         className="w-full bg-white border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium" 
                         value={newEvent.startDate} 
                         onChange={e => {
                           const newStart = e.target.value;
                           if (new Date(newEvent.endDate) < new Date(newStart)) {
                             setNewEvent({...newEvent, startDate: newStart, endDate: newStart});
                           } else {
                             setNewEvent({...newEvent, startDate: newStart});
                           }
                         }} 
                       />
                     </div>
                     <div>
                       <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Selesai</label>
                       <input 
                         type="date" 
                         className="w-full bg-white border border-gray-200 p-3 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all font-medium" 
                         value={newEvent.endDate} 
                         min={newEvent.startDate}
                         onChange={e => setNewEvent({...newEvent, endDate: e.target.value})} 
                       />
                     </div>
                   </div>

                   <div>
                     <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Kategori (Pilih Minimal 1)</label>
                     <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                       {Object.keys(CATEGORIES).map(cat => {
                         const isSelected = newEvent.categories.includes(cat);
                         const catData = CATEGORIES[cat];
                         return (
                           <div 
                             key={cat}
                             onClick={() => handleCategoryToggle(cat)}
                             className={`flex items-center p-2.5 rounded-xl cursor-pointer border transition-all duration-200 bg-white ${isSelected ? `border-blue-500 ring-1 ring-blue-500` : 'border-gray-200 hover:border-blue-300'}`}
                           >
                             <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 transition-colors ${isSelected ? 'bg-blue-500 border-blue-500' : 'border-gray-300 bg-white'}`}>
                               {isSelected && <Check size={14} className="text-white stroke-[3]" />}
                             </div>
                             <div className="flex items-center gap-2 text-gray-700">
                               <span className={`${isSelected ? 'text-blue-600' : 'text-gray-500'}`}>{catData.icon}</span>
                               <span className={`text-[10px] sm:text-xs font-medium ${isSelected ? 'text-blue-900' : ''}`}>{cat}</span>
                             </div>
                           </div>
                         );
                       })}
                     </div>
                   </div>

                   {/* Section Personil Baru */}
                   <div>
                     <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-2">Personil Terkait (Pilih Minimal 1)</label>
                     <div className="flex flex-wrap gap-2">
                       {PERSONNEL_LIST.map(person => {
                         const isSelected = newEvent.personnel && newEvent.personnel.includes(person);
                         return (
                           <div 
                             key={person}
                             onClick={() => handlePersonnelToggle(person)}
                             className={`flex items-center gap-1 px-3 py-1.5 rounded-full cursor-pointer border text-xs font-medium transition-all ${isSelected ? 'bg-indigo-100 border-indigo-300 text-indigo-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                           >
                             {isSelected ? <Check size={12} /> : <User size={12} />}
                             {person}
                           </div>
                         )
                       })}
                     </div>
                   </div>

                   {editingId && (
                     <div>
                       <label className="block text-xs font-bold text-gray-700 uppercase tracking-wide mb-1.5">Status Kegiatan</label>
                       <select 
                         className={`w-full p-3 rounded-xl text-sm border focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium appearance-none bg-white ${newEvent.status === 'cancelled' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'}`}
                         value={newEvent.status} 
                         onChange={e => setNewEvent({...newEvent, status: e.target.value})}
                       >
                         <option value="active">🟢 Aktif (Berjalan Sesuai Rencana)</option>
                         <option value="cancelled">🔴 Dibatalkan</option>
                       </select>
                     </div>
                   )}
                 </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t border-gray-100 bg-white flex justify-between items-center shrink-0 rounded-b-2xl">
               {isDetailView ? (
                  <>
                    <button onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-gray-600 text-sm font-bold hover:bg-gray-100 rounded-xl transition-colors">Tutup</button>
                    <button 
                      onClick={() => setIsDetailView(false)} 
                      className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2 transform active:scale-95"
                    >
                      <Pencil size={16} /> Edit Data
                    </button>
                  </>
               ) : (
                  <>
                    <div>
                      {editingId && (
                        <button 
                          type="button"
                          onClick={() => handleDeleteEvent(editingId)}
                          className="text-red-400 hover:text-red-600 p-2.5 hover:bg-red-50 rounded-xl transition-colors"
                          title="Hapus Permanen"
                        >
                          <Trash2 size={20} />
                        </button>
                      )}
                    </div>
                    <div className="flex gap-3">
                      <button 
                        onClick={() => {
                          if(editingId && !isDetailView) setIsDetailView(true);
                          else setIsModalOpen(false);
                        }} 
                        className="px-5 py-2.5 text-gray-600 text-sm font-bold hover:bg-gray-100 rounded-xl transition-colors"
                      >
                        Batal
                      </button>
                      <button 
                        onClick={handleSaveEvent} 
                        className="px-6 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                      >
                        Simpan
                      </button>
                    </div>
                  </>
               )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
}