import React, { useState, useMemo, useEffect } from 'react';
import { Movie, QueueItem, SearchResult, Rating } from './types';
import { searchMovieInfo, suggestAlternativePosters } from './services/geminiService';
import MovieCard from './components/MovieCard';
import QueueCard from './components/QueueCard';
import StarRating from './components/StarRating';

// --- Icons ---
const PlusIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>;
const SearchIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const CloseIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const EditIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;
const CogIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
const FilmIcon = () => <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>;

// --- Dummy Data ---
const initialMovies: Movie[] = [
  {
    id: '1',
    title: 'Interstellar (星際效應)',
    year: '2014',
    director: 'Christopher Nolan',
    actors: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
    plot: '一隊探險家利用新發現的蟲洞進行星際航行，試圖為人類尋找新的家園。',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gEU2QniE6E77NI6lCU6MxlNBvIx.jpg',
    ratings: [
        { user: 'Zack', score: 4.5 },
        { user: 'Sarah', score: 5 }
    ],
    dateWatched: '2023-11-15',
    addedBy: 'Zack'
  },
  {
    id: '2',
    title: 'Dune (沙丘)',
    year: '2021',
    director: 'Denis Villeneuve',
    actors: 'Timothée Chalamet, Rebecca Ferguson, Oscar Isaac',
    plot: '一個貴族家庭捲入了一場控制銀河系最寶貴資產的戰爭。',
    posterUrl: 'https://image.tmdb.org/t/p/w500/d5NXSklXo0qyLXEnNcYEdNZIGVF.jpg',
    ratings: [
        { user: 'Sarah', score: 5 }
    ],
    dateWatched: '2023-10-20',
    addedBy: 'Sarah'
  },
  {
    id: '3',
    title: 'Oppenheimer (奧本海默)',
    year: '2023',
    director: 'Christopher Nolan',
    actors: 'Cillian Murphy, Emily Blunt, Matt Damon',
    plot: '原子彈之父奧本海默的故事。',
    posterUrl: 'https://image.tmdb.org/t/p/w500/8Gxv8gSFCU0XGDykEGv7zR1n2ua.jpg',
    ratings: [
        { user: 'Zack', score: 5 },
        { user: 'Mike', score: 4.5 }
    ],
    dateWatched: '2023-11-20',
    addedBy: 'Zack'
  }
];

const initialQueue: QueueItem[] = [
  {
    id: 'q1',
    title: 'Blade Runner 2049 (銀翼殺手 2049)',
    year: '2017',
    posterUrl: 'https://image.tmdb.org/t/p/w500/gajva2L0rPYkEWjzgFlBXCAVBE5.jpg',
    addedBy: 'Mike',
    upvotes: 4,
    downvotes: 1
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'history' | 'queue'>('history');
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  
  // Modal State for Adding
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'add_history' | 'add_queue'>('add_history');
  const [modalSearchTerm, setModalSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedMovieToAdd, setSelectedMovieToAdd] = useState<SearchResult | null>(null);
  
  // State to track if we are promoting a queue item
  const [queueItemToPromote, setQueueItemToPromote] = useState<string | null>(null);
  
  // Modal State for Viewing Details
  const [viewingMovie, setViewingMovie] = useState<Movie | null>(null);
  const [viewingMoviePosters, setViewingMoviePosters] = useState<string[]>([]); // For edit poster
  const [isEditingPoster, setIsEditingPoster] = useState(false);
  const [isPosterLoading, setIsPosterLoading] = useState(false);

  // Settings Modal
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');

  // Form State
  const [userRating, setUserRating] = useState(0);
  const [userDate, setUserDate] = useState(new Date().toISOString().slice(0, 10));
  const [userName, setUserName] = useState('');
  
  // Rating input inside details popup
  const [newRatingName, setNewRatingName] = useState('');
  const [newRatingScore, setNewRatingScore] = useState(0);

  // Load API Key from local storage on mount
  useEffect(() => {
    const storedKey = localStorage.getItem('tmdb_api_key');
    if (storedKey) setApiKeyInput(storedKey);
  }, []);

  // Save API Key
  const handleSaveApiKey = () => {
    localStorage.setItem('tmdb_api_key', apiKeyInput.trim());
    alert('API Key 已儲存！請重新整理頁面以生效。');
    setIsSettingsOpen(false);
    window.location.reload();
  };

  // Handle Voting
  const handleVote = (id: string, type: 'up' | 'down') => {
    setQueue(prev => prev.map(item => {
      if (item.id !== id) return item;
      return {
        ...item,
        upvotes: type === 'up' ? item.upvotes + 1 : item.upvotes,
        downvotes: type === 'down' ? item.downvotes + 1 : item.downvotes
      };
    }).sort((a, b) => (b.upvotes - b.downvotes) - (a.upvotes - a.downvotes)));
  };

  // Handle Promote from Queue
  const handlePromoteFromQueue = (item: QueueItem) => {
    const prefilledData: SearchResult = {
      title: item.title,
      year: item.year,
      director: 'Unknown', 
      actors: 'Unknown',
      plot: '請使用搜尋功能更新詳細資訊...',
      posterUrl: item.posterUrl
    };

    setSelectedMovieToAdd(prefilledData);
    setQueueItemToPromote(item.id);
    setModalSearchTerm(item.title);
    setModalMode('add_history');
    setIsModalOpen(true);
  };

  const getAverageRating = (ratings: Rating[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, curr) => acc + curr.score, 0);
    return sum / ratings.length;
  };

  // --- Search & Add Logic ---
  const handleSearch = async () => {
    if (!modalSearchTerm.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    try {
      const results = await searchMovieInfo(modalSearchTerm);
      setSearchResults(results);
    } catch (error) {
      console.error(error);
      alert("搜尋失敗，請稍後再試");
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectMovie = (movie: SearchResult) => {
    setSelectedMovieToAdd(movie);
  };

  const handleConfirmAdd = () => {
    if (!selectedMovieToAdd) return;

    if (modalMode === 'add_history') {
      const newMovie: Movie = {
        id: Date.now().toString(),
        title: selectedMovieToAdd.title,
        year: selectedMovieToAdd.year,
        director: selectedMovieToAdd.director,
        actors: selectedMovieToAdd.actors,
        plot: selectedMovieToAdd.plot,
        posterUrl: selectedMovieToAdd.posterUrl,
        ratings: userRating > 0 && userName ? [{ user: userName, score: userRating }] : [],
        dateWatched: userDate,
        addedBy: userName || 'Anonymous'
      };
      setMovies([newMovie, ...movies]);
      
      // If we are promoting from queue, remove it from queue
      if (queueItemToPromote) {
        setQueue(prev => prev.filter(q => q.id !== queueItemToPromote));
        setQueueItemToPromote(null);
      }
    } else {
      const newQueueItem: QueueItem = {
        id: Date.now().toString(),
        title: selectedMovieToAdd.title,
        year: selectedMovieToAdd.year,
        posterUrl: selectedMovieToAdd.posterUrl,
        addedBy: userName || 'Anonymous',
        upvotes: 0,
        downvotes: 0
      };
      setQueue([...queue, newQueueItem]);
    }

    // Reset
    setIsModalOpen(false);
    setSelectedMovieToAdd(null);
    setSearchResults([]);
    setModalSearchTerm('');
    setUserRating(0);
    setUserName('');
  };

  // --- Movie Details Logic ---
  const openMovieDetails = (movie: Movie) => {
    setViewingMovie(movie);
    setViewingMoviePosters([]);
    setIsEditingPoster(false);
    setIsPosterLoading(false);
    setNewRatingName('');
    setNewRatingScore(0);
  };

  const handleAddRating = () => {
    if (!viewingMovie || !newRatingName || newRatingScore === 0) return;
    
    // Check if user already rated, update if so, else add
    const existingIndex = viewingMovie.ratings.findIndex(r => r.user === newRatingName);
    let newRatings = [...viewingMovie.ratings];
    
    if (existingIndex >= 0) {
      newRatings[existingIndex] = { user: newRatingName, score: newRatingScore };
    } else {
      newRatings.push({ user: newRatingName, score: newRatingScore });
    }

    const updatedMovie = { ...viewingMovie, ratings: newRatings };
    setMovies(movies.map(m => m.id === viewingMovie.id ? updatedMovie : m));
    setViewingMovie(updatedMovie);
    setNewRatingName('');
    setNewRatingScore(0);
  };

  const handleDeleteMovie = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent bubbling issues
    if (!viewingMovie) return;
    if (window.confirm(`確定要刪除 "${viewingMovie.title}" 嗎？`)) {
      setMovies(prev => prev.filter(m => m.id !== viewingMovie.id));
      setViewingMovie(null);
    }
  };

  const handleEditPoster = async () => {
    if (!viewingMovie) return;
    if (isEditingPoster) {
      setIsEditingPoster(false);
      return;
    }
    setIsEditingPoster(true);
    setIsPosterLoading(true);
    setViewingMoviePosters([]);
    
    try {
      const posters = await suggestAlternativePosters(viewingMovie.title);
      setViewingMoviePosters(posters);
    } catch (e) {
      console.error(e);
    } finally {
      setIsPosterLoading(false);
    }
  };

  const handleSelectNewPoster = (url: string) => {
    if (!viewingMovie) return;
    const updatedMovie = { ...viewingMovie, posterUrl: url };
    setMovies(movies.map(m => m.id === viewingMovie.id ? updatedMovie : m));
    setViewingMovie(updatedMovie);
    setIsEditingPoster(false);
  };

  // --- Grouping Logic ---
  const groupedMovies = useMemo(() => {
    const groups: Record<string, Movie[]> = {};
    movies.forEach(movie => {
      const year = new Date(movie.dateWatched).getFullYear().toString();
      if (!groups[year]) groups[year] = [];
      groups[year].push(movie);
    });
    return groups;
  }, [movies]);

  return (
    <div className="min-h-screen text-brand-text font-sans selection:bg-brand-accent selection:text-white pb-24">
      
      {/* --- Top Navigation --- */}
      <header className="sticky top-0 z-40 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-brand-accent rounded-lg flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.5)]">
               <FilmIcon />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white hidden md:block">CineLog</h1>
          </div>

          <nav className="flex space-x-1 bg-black/20 p-1 rounded-xl">
             <button 
               onClick={() => setActiveTab('history')}
               className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'history' ? 'bg-brand-accent text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
               觀影紀錄
             </button>
             <button 
               onClick={() => setActiveTab('queue')}
               className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'queue' ? 'bg-brand-accent text-white shadow-lg' : 'text-gray-400 hover:text-white'}`}
             >
               待看列表
             </button>
          </nav>

          <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-gray-400 hover:text-white transition-colors">
            <CogIcon />
          </button>
        </div>
      </header>

      {/* --- Main Content --- */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* HISTORY VIEW */}
        {activeTab === 'history' && (
          <div className="space-y-12">
            {Object.entries(groupedMovies)
              .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
              .map(([year, yearMovies]) => (
              <div key={year} className="relative">
                <div className="flex items-center mb-6">
                  <h2 className="text-3xl font-bold text-white/10 absolute -left-4 -top-6 select-none pointer-events-none md:text-5xl md:-left-8">{year}</h2>
                  <div className="h-px bg-gradient-to-r from-brand-accent/50 to-transparent flex-grow ml-12 md:ml-20"></div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {yearMovies.map(movie => (
                    <MovieCard key={movie.id} movie={movie} onClick={openMovieDetails} />
                  ))}
                </div>
              </div>
            ))}
            
            {movies.length === 0 && (
              <div className="text-center py-20 text-gray-500">
                <p>尚無觀影紀錄，點擊右下角按鈕新增。</p>
              </div>
            )}
          </div>
        )}

        {/* QUEUE VIEW */}
        {activeTab === 'queue' && (
          <div className="max-w-3xl mx-auto">
             {queue.map(item => (
               <QueueCard 
                  key={item.id} 
                  item={item} 
                  onVote={handleVote} 
                  onPromote={handlePromoteFromQueue}
                />
             ))}
             {queue.length === 0 && (
               <div className="text-center py-20 text-gray-500">
                 <p>待看列表是空的，提議一部電影吧！</p>
               </div>
             )}
          </div>
        )}

      </main>

      {/* --- FAB (Add Button) --- */}
      <button 
        onClick={() => {
          setModalMode(activeTab === 'history' ? 'add_history' : 'add_queue');
          setSelectedMovieToAdd(null);
          setQueueItemToPromote(null);
          setModalSearchTerm('');
          setSearchResults([]);
          setIsModalOpen(true);
        }}
        className="fixed bottom-6 right-6 md:bottom-10 md:right-10 w-14 h-14 bg-brand-accent hover:bg-brand-accentHover text-white rounded-full shadow-[0_0_20px_rgba(16,185,129,0.4)] flex items-center justify-center transition-transform hover:scale-110 active:scale-95 z-40"
      >
        <PlusIcon />
      </button>

      {/* --- Add Movie Modal --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="relative glass-strong rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
            
            <div className="p-6 border-b border-white/10 flex justify-between items-center">
              <h2 className="text-xl font-bold text-white">
                {modalMode === 'add_history' ? '新增觀影紀錄' : '提議新電影'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-white"><CloseIcon /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
              
              {/* Step 1: Search */}
              {!selectedMovieToAdd ? (
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      value={modalSearchTerm}
                      onChange={(e) => setModalSearchTerm(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="輸入電影名稱搜尋..." 
                      className="flex-grow bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-brand-accent"
                      autoFocus
                    />
                    <button 
                      onClick={handleSearch}
                      disabled={isSearching}
                      className="bg-brand-accent hover:bg-brand-accentHover text-white px-6 rounded-xl font-medium transition-colors disabled:opacity-50"
                    >
                      {isSearching ? '...' : <SearchIcon />}
                    </button>
                  </div>

                  <div className="space-y-2 max-h-96 overflow-y-auto pr-2">
                    {searchResults.map((result, idx) => (
                      <div 
                        key={idx} 
                        onClick={() => handleSelectMovie(result)}
                        className="flex items-center gap-4 p-3 rounded-xl hover:bg-white/5 cursor-pointer transition-colors group"
                      >
                         <img src={result.posterUrl} alt={result.title} className="w-12 h-16 object-cover rounded bg-gray-800" />
                         <div>
                           <h4 className="text-white font-medium group-hover:text-brand-accent whitespace-pre-wrap">{result.title}</h4>
                           <p className="text-sm text-gray-500">{result.year} • {result.director}</p>
                         </div>
                      </div>
                    ))}
                    {searchResults.length === 0 && !isSearching && modalSearchTerm && (
                      <p className="text-center text-gray-500 py-4">沒有找到相關電影，請嘗試其他關鍵字。</p>
                    )}
                  </div>
                </div>
              ) : (
                /* Step 2: Confirm Details */
                <div className="space-y-6 animate-fadeIn">
                   <div className="flex flex-col md:flex-row gap-6">
                     <img src={selectedMovieToAdd.posterUrl} alt="Poster" className="w-32 h-48 object-cover rounded-lg shadow-lg mx-auto md:mx-0" />
                     <div className="space-y-2">
                       <h3 className="text-2xl font-bold text-white whitespace-pre-wrap">{selectedMovieToAdd.title}</h3>
                       <p className="text-brand-accent">{selectedMovieToAdd.year} • {selectedMovieToAdd.director}</p>
                       <p className="text-gray-400 text-sm line-clamp-3">{selectedMovieToAdd.plot}</p>
                       <button onClick={() => setSelectedMovieToAdd(null)} className="text-sm text-gray-500 hover:text-white underline">重新選擇</button>
                     </div>
                   </div>

                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs text-gray-400 mb-1">你的名字 (必填)</label>
                        <input 
                          type="text" 
                          value={userName}
                          onChange={(e) => setUserName(e.target.value)}
                          placeholder="Ex: Zack"
                          className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-brand-accent outline-none"
                        />
                      </div>
                      
                      {modalMode === 'add_history' && (
                        <div>
                          <label className="block text-xs text-gray-400 mb-1">觀影日期</label>
                          <input 
                            type="date" 
                            value={userDate}
                            onChange={(e) => setUserDate(e.target.value)}
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white focus:border-brand-accent outline-none color-scheme-dark"
                          />
                        </div>
                      )}
                   </div>

                   {modalMode === 'add_history' && (
                     <div>
                       <label className="block text-xs text-gray-400 mb-2">你的評分</label>
                       <div className="flex justify-center p-4 bg-white/5 rounded-xl">
                         <StarRating rating={userRating} onRate={setUserRating} size="lg" />
                       </div>
                     </div>
                   )}

                   <button 
                     onClick={handleConfirmAdd}
                     disabled={!userName}
                     className="w-full bg-brand-accent hover:bg-brand-accentHover disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold py-3 rounded-xl shadow-lg shadow-brand-accent/20 transition-all"
                   >
                     {modalMode === 'add_history' ? '加入觀影紀錄' : '加入待看列表'}
                   </button>
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* --- Movie Details Popup --- */}
      {viewingMovie && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/90 backdrop-blur-md" onClick={() => setViewingMovie(null)}></div>
          <div className="relative glass-strong rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row shadow-2xl border border-white/10">
            
            {/* Poster Section */}
            <div className="w-full md:w-2/5 relative h-64 md:h-auto bg-black">
               <img 
                 src={viewingMovie.posterUrl} 
                 alt={viewingMovie.title} 
                 className="w-full h-full object-cover opacity-80"
               />
               <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-[#0a0a0a]"></div>
               
               <button 
                  onClick={handleEditPoster}
                  className="absolute bottom-4 left-4 flex items-center space-x-1 text-xs text-gray-300 hover:text-white bg-black/50 px-3 py-1.5 rounded-full backdrop-blur-sm transition-colors border border-white/10 z-20"
               >
                 <EditIcon /> <span>更換海報</span>
               </button>

               {isEditingPoster && (
                 <div className="absolute inset-0 bg-black/90 z-20 p-4 overflow-y-auto">
                    <div className="flex justify-between items-center mb-4">
                      <h4 className="text-white font-bold">選擇新海報</h4>
                      <button onClick={() => setIsEditingPoster(false)}><CloseIcon /></button>
                    </div>
                    
                    {isPosterLoading ? (
                      <div className="flex justify-center items-center py-20">
                         <div className="w-8 h-8 border-2 border-brand-accent border-t-transparent rounded-full animate-spin"></div>
                      </div>
                    ) : viewingMoviePosters.length === 0 ? (
                      <p className="text-gray-500 text-center mt-10">找不到其他海報</p>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {viewingMoviePosters.map((url, i) => (
                          <img 
                            key={i} 
                            src={url} 
                            onClick={() => handleSelectNewPoster(url)}
                            className="w-full rounded cursor-pointer hover:border-2 border-brand-accent transition-all hover:scale-105" 
                          />
                        ))}
                      </div>
                    )}
                 </div>
               )}
            </div>

            {/* Info Section */}
            <div className="flex-1 p-6 md:p-8 overflow-y-auto custom-scrollbar">
               <div className="space-y-6">
                 
                 <div>
                   <h2 className="text-3xl font-bold text-white leading-tight mb-2 whitespace-pre-wrap pr-10">{viewingMovie.title}</h2>
                   <div className="flex items-center text-brand-accent space-x-3 text-sm">
                      <span>{viewingMovie.year}</span>
                      <span>•</span>
                      <span>{viewingMovie.director}</span>
                      <div className="flex items-center bg-white/10 px-2 py-0.5 rounded text-white">
                        <span className="text-yellow-400 mr-1">★</span>
                        {getAverageRating(viewingMovie.ratings).toFixed(1)}
                        <span className="text-gray-400 ml-1">({viewingMovie.ratings.length})</span>
                      </div>
                   </div>
                 </div>

                 <div>
                   <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">劇情簡介</h3>
                   <p className="text-gray-300 leading-relaxed text-sm">{viewingMovie.plot}</p>
                 </div>

                 <div>
                    <h3 className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-1">主演</h3>
                    <p className="text-gray-400 text-sm">{viewingMovie.actors}</p>
                 </div>

                 <div className="flex items-center space-x-2 text-sm text-gray-500 bg-white/5 p-3 rounded-lg border border-white/5">
                    <span className="text-gray-400">觀影日期:</span>
                    <span className="text-white font-mono">{viewingMovie.dateWatched}</span>
                    <span className="mx-2">|</span>
                    <span className="text-gray-400">紀錄者:</span>
                    <span className="text-white">{viewingMovie.addedBy}</span>
                 </div>

                 <div className="h-px bg-white/10 w-full my-6"></div>

                 {/* Ratings History */}
                 <div className="space-y-4">
                    <h3 className="text-lg font-bold text-white">評分紀錄</h3>
                    
                    <div className="space-y-2">
                      {viewingMovie.ratings.map((r, idx) => (
                        <div key={idx} className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-lg">
                           <span className="text-gray-200 font-medium">{r.user}</span>
                           <StarRating rating={r.score} readOnly size="sm" />
                        </div>
                      ))}
                    </div>

                    <div className="bg-brand-accent/5 border border-brand-accent/20 rounded-xl p-4 mt-4">
                       <h4 className="text-sm font-bold text-brand-accent mb-3">新增或更新你的評分</h4>
                       <div className="flex flex-col gap-3">
                          <input 
                             type="text" 
                             placeholder="你的名字" 
                             value={newRatingName}
                             onChange={(e) => setNewRatingName(e.target.value)}
                             className="bg-black/40 border border-brand-accent/20 rounded px-3 py-2 text-sm text-white focus:border-brand-accent outline-none"
                          />
                          <div className="flex justify-between items-center">
                             <StarRating rating={newRatingScore} onRate={setNewRatingScore} />
                             <button 
                               onClick={handleAddRating}
                               disabled={!newRatingName || newRatingScore === 0}
                               className="bg-brand-accent hover:bg-brand-accentHover disabled:opacity-50 text-white text-xs px-4 py-2 rounded font-bold transition-colors"
                             >
                               提交
                             </button>
                          </div>
                       </div>
                    </div>
                 </div>

               </div>
            </div>

            {/* Header Controls (Delete/Close) - Moved to bottom of JSX to ensure it renders on TOP */}
             <div className="absolute top-4 right-4 z-50 flex space-x-2">
                 <button onClick={handleDeleteMovie} className="p-2 bg-black/60 hover:bg-red-500 text-white rounded-full backdrop-blur-md transition-colors border border-white/10 shadow-lg" title="刪除紀錄">
                   <TrashIcon />
                 </button>
                 <button onClick={() => setViewingMovie(null)} className="p-2 bg-black/60 hover:bg-white/20 text-white rounded-full backdrop-blur-md transition-colors border border-white/10 shadow-lg">
                   <CloseIcon />
                 </button>
             </div>

          </div>
        </div>
      )}

      {/* --- Settings Modal --- */}
      {isSettingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
           <div className="absolute inset-0 bg-black/80" onClick={() => setIsSettingsOpen(false)}></div>
           <div className="relative glass-card bg-[#161618] p-6 rounded-2xl w-full max-w-md shadow-2xl border border-white/10">
              <h2 className="text-xl font-bold text-white mb-4">設定</h2>
              <div className="mb-4">
                <label className="block text-sm text-gray-400 mb-2">TMDB API Key</label>
                <input 
                  type="text" 
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  className="w-full bg-black/50 border border-white/10 rounded px-3 py-2 text-white text-sm focus:border-brand-accent outline-none"
                  placeholder="輸入你的 API Key"
                />
                <p className="text-xs text-gray-500 mt-2">
                  我們會優先使用系統內建 Key，若您有自己的 Key 可在此輸入 (儲存於瀏覽器)。
                </p>
              </div>
              <div className="flex justify-end space-x-3">
                <button onClick={() => setIsSettingsOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white text-sm">取消</button>
                <button onClick={handleSaveApiKey} className="px-4 py-2 bg-brand-accent hover:bg-brand-accentHover text-white rounded text-sm font-bold">儲存</button>
              </div>
           </div>
        </div>
      )}

    </div>
  );
}