import React, { useState, useMemo } from 'react';
import { Movie, QueueItem, SearchResult, Rating } from './types';
import { searchMovieInfo, suggestAlternativePosters } from './services/geminiService';
import MovieCard from './components/MovieCard';
import QueueCard from './components/QueueCard';
import StarRating from './components/StarRating';

// --- Icons ---
const FilmIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z" /></svg>;
const QueueIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
const PlusIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" /></svg>;
const SearchIcon = () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>;
const PlayIcon = () => <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>;
const CloseIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>;
const EditIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>;
const TrashIcon = () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>;

// --- Dummy Data ---
const initialMovies: Movie[] = [
  {
    id: '1',
    title: 'Interstellar (星際效應)',
    year: '2014',
    director: 'Christopher Nolan',
    actors: 'Matthew McConaughey, Anne Hathaway, Jessica Chastain',
    plot: '一隊探險家利用新發現的蟲洞進行星際航行，試圖為人類尋找新的家園。',
    posterUrl: 'https://placehold.co/400x600/0f1f1a/10B981?text=Interstellar',
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
    posterUrl: 'https://placehold.co/400x600/064E3B/fff?text=Dune',
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
    posterUrl: 'https://placehold.co/400x600/000000/10B981?text=Oppenheimer',
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
    posterUrl: 'https://placehold.co/400x600/10B981/000?text=Blade+Runner',
    addedBy: 'Mike',
    upvotes: 4,
    downvotes: 1
  }
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'history' | 'queue'>('history');
  const [movies, setMovies] = useState<Movie[]>(initialMovies);
  const [queue, setQueue] = useState<QueueItem[]>(initialQueue);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  // Form State
  const [userRating, setUserRating] = useState(0);
  const [userDate, setUserDate] = useState(new Date().toISOString().slice(0, 10));
  const [customPoster, setCustomPoster] = useState('');
  const [userName, setUserName] = useState('');
  
  // Rating input inside details popup
  const [newRatingName, setNewRatingName] = useState('');
  const [newRatingScore, setNewRatingScore] = useState(0);

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
    // Map QueueItem to SearchResult structure to prefill the modal
    const prefilledData: SearchResult = {
      title: item.title,
      year: item.year,
      director: 'Unknown', // QueueItems don't have this, user can fetch or leave it
      actors: 'Unknown',
      plot: '請使用搜尋功能更新詳細資訊...',
      posterUrl: item.posterUrl
    };

    setSelectedMovieToAdd(prefilledData);
    setQueueItemToPromote(item.id);
    setModalSearchTerm(item.title); // Prefill search term if they want to re-search
    setModalMode('add_history');
    setIsModalOpen(true);
  };

  // Helper: Get Average Rating
  const getAverageRating = (ratings: Rating[]) => {
    if (!ratings || ratings.length === 0) return 0;
    const sum = ratings.reduce((acc, curr) => acc + curr.score, 0);
    return sum / ratings.length;
  };

  // Handle Add/Update Rating in Details Popup
  const handleSubmitRating = (movieId: string) => {
    if (!newRatingName.trim() || newRatingScore === 0) return;

    setMovies(prevMovies => prevMovies.map(m => {
      if (m.id === movieId) {
        // Check if user already rated
        const existingIndex = m.ratings.findIndex(r => r.user.toLowerCase() === newRatingName.toLowerCase());
        let updatedRatings = [...m.ratings];
        if (existingIndex >= 0) {
          updatedRatings[existingIndex] = { user: newRatingName, score: newRatingScore };
        } else {
          updatedRatings.push({ user: newRatingName, score: newRatingScore });
        }
        return { ...m, ratings: updatedRatings };
      }
      return m;
    }));

    // Update viewing movie state as well
    if (viewingMovie && viewingMovie.id === movieId) {
        setViewingMovie(prev => {
            if (!prev) return null;
            const existingIndex = prev.ratings.findIndex(r => r.user.toLowerCase() === newRatingName.toLowerCase());
            let updatedRatings = [...prev.ratings];
            if (existingIndex >= 0) {
              updatedRatings[existingIndex] = { user: newRatingName, score: newRatingScore };
            } else {
              updatedRatings.push({ user: newRatingName, score: newRatingScore });
            }
            return { ...prev, ratings: updatedRatings };
        });
    }

    setNewRatingScore(0);
    // Keep name for convenience
  };

  // Edit Poster Logic
  const handleEditPosterClick = async (movie: Movie) => {
    setIsEditingPoster(true);
    setViewingMoviePosters([]); // Clear previous
    const alts = await suggestAlternativePosters(movie.title);
    setViewingMoviePosters(alts);
  };

  const handleSelectNewPoster = (movieId: string, url: string) => {
      setMovies(prev => prev.map(m => m.id === movieId ? { ...m, posterUrl: url } : m));
      if (viewingMovie && viewingMovie.id === movieId) {
          setViewingMovie({ ...viewingMovie, posterUrl: url });
      }
      setIsEditingPoster(false);
  };

  const handleDeleteMovie = (movieId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('確定要刪除這部電影紀錄嗎？此操作無法復原。')) {
      setMovies(prev => prev.filter(m => m.id !== movieId));
      setViewingMovie(null);
    }
  };

  // Search Logic
  const handleSearch = async () => {
    if (!modalSearchTerm.trim()) return;
    setIsSearching(true);
    setSearchResults([]);
    setSelectedMovieToAdd(null);
    const results = await searchMovieInfo(modalSearchTerm);
    setSearchResults(results);
    setIsSearching(false);
  };

  // Add Movie Logic
  const handleAddMovie = () => {
    if (!selectedMovieToAdd || !userName.trim()) {
      if(!userName.trim()) alert("請輸入您的名字");
      return;
    }

    if (modalMode === 'add_history') {
      const newMovie: Movie = {
        id: Date.now().toString(),
        title: selectedMovieToAdd.title,
        year: selectedMovieToAdd.year,
        director: selectedMovieToAdd.director || 'Unknown',
        actors: selectedMovieToAdd.actors || 'Unknown',
        plot: selectedMovieToAdd.plot || '無劇情簡介',
        posterUrl: customPoster || selectedMovieToAdd.posterUrl,
        ratings: [{ user: userName, score: userRating }],
        dateWatched: userDate,
        addedBy: userName
      };
      setMovies([newMovie, ...movies]);

      // If this was promoted from queue, remove it from queue
      if (queueItemToPromote) {
        setQueue(prev => prev.filter(q => q.id !== queueItemToPromote));
      }

    } else {
      const newQueueItem: QueueItem = {
        id: Date.now().toString(),
        title: selectedMovieToAdd.title,
        year: selectedMovieToAdd.year,
        posterUrl: customPoster || selectedMovieToAdd.posterUrl,
        addedBy: userName,
        upvotes: 1,
        downvotes: 0
      };
      setQueue([...queue, newQueueItem]);
    }
    closeModal();
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setModalSearchTerm('');
    setSearchResults([]);
    setSelectedMovieToAdd(null);
    setUserRating(0);
    setCustomPoster('');
    setQueueItemToPromote(null);
  };

  const handleChangePoster = async () => {
    if (!selectedMovieToAdd) return;
    const alts = await suggestAlternativePosters(selectedMovieToAdd.title);
    const randomAlt = alts[Math.floor(Math.random() * alts.length)];
    setCustomPoster(randomAlt);
  };

  // Group Movies by Year only
  const groupedMovies = useMemo(() => {
    const groups: Record<string, Movie[]> = {};
    
    const sorted = [...movies]
      .filter(m => m.title.toLowerCase().includes(searchQuery.toLowerCase()))
      .sort((a, b) => new Date(b.dateWatched).getTime() - new Date(a.dateWatched).getTime());

    sorted.forEach(movie => {
      const date = new Date(movie.dateWatched);
      const year = date.getFullYear().toString();

      if (!groups[year]) groups[year] = [];
      groups[year].push(movie);
    });
    return groups;
  }, [movies, searchQuery]);

  return (
    <div className="flex min-h-screen text-brand-text overflow-hidden relative font-sans selection:bg-brand-accent/30 selection:text-white">
      
      {/* Decorative Background Blobs */}
      <div className="fixed top-[-20%] left-[-10%] w-[60%] h-[60%] bg-brand-accent/5 rounded-full blur-[150px] pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div className="fixed inset-0 bg-black/60 z-40 lg:hidden backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-50 w-24 lg:w-64 glass border-r-0 border-white/5 transform transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'} flex flex-col items-center lg:items-stretch
      `}>
        <div className="h-full flex flex-col p-6">
          <div className="flex items-center justify-center lg:justify-start space-x-3 mb-10">
            <div className="w-10 h-10 bg-gradient-to-br from-brand-accent to-emerald-700 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.3)]">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
          </div>

          <nav className="flex-1 space-y-4 w-full">
            <button 
              onClick={() => { setActiveTab('history'); setSidebarOpen(false); }}
              className={`w-full flex flex-col lg:flex-row items-center lg:space-x-4 px-2 lg:px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'history' ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <FilmIcon />
              <span className="text-xs lg:text-sm mt-1 lg:mt-0 font-medium">觀影紀錄</span>
            </button>
            <button 
              onClick={() => { setActiveTab('queue'); setSidebarOpen(false); }}
              className={`w-full flex flex-col lg:flex-row items-center lg:space-x-4 px-2 lg:px-4 py-3 rounded-xl transition-all duration-300 ${activeTab === 'queue' ? 'bg-brand-accent/10 text-brand-accent border border-brand-accent/20 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
            >
              <QueueIcon />
              <span className="text-xs lg:text-sm mt-1 lg:mt-0 font-medium">待看清單</span>
            </button>
          </nav>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col h-screen overflow-hidden relative">
        {/* Top Bar */}
        <header className="h-24 flex items-center justify-between px-6 lg:px-10 z-30 shrink-0">
          <button className="lg:hidden text-gray-400" onClick={() => setSidebarOpen(true)}>
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          
          <div className="hidden md:flex items-center glass rounded-full px-4 py-2.5 w-full max-w-md focus-within:border-brand-accent/50 transition-colors shadow-lg ml-auto mr-auto lg:ml-0">
            <SearchIcon />
            <input 
              type="text" 
              placeholder="搜尋電影..." 
              className="bg-transparent border-none focus:outline-none text-sm ml-3 w-full text-white placeholder-gray-500"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </header>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-6 lg:px-10 pb-28 scroll-smooth">
          <div className="max-w-7xl mx-auto mt-4">
            
            <div className="mb-8">
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-white to-gray-400 mb-2">
                {activeTab === 'history' ? '觀影歷史' : '待看列表'}
              </h2>
            </div>

            {activeTab === 'history' ? (
              <div className="space-y-12">
                {Object.keys(groupedMovies).length === 0 && (
                   <div className="text-center py-20 glass rounded-2xl border-dashed border-white/10">
                    <p className="text-gray-500">尚無觀影紀錄。</p>
                  </div>
                )}
                {Object.entries(groupedMovies)
                  .sort(([yearA], [yearB]) => Number(yearB) - Number(yearA))
                  .map(([year, yearMovies]) => (
                  <div key={year} className="relative mb-16">
                    {/* Year Header */}
                    <div className="flex items-baseline mb-6">
                         <h3 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-emerald-800">{year}</h3>
                         <div className="h-px bg-white/10 flex-grow ml-6"></div>
                    </div>
                    
                    {/* Grid Layout: 2 cols on mobile, 3 on md, 4 on lg, 5 on xl */}
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
                        {yearMovies.map(movie => (
                            <MovieCard 
                            key={movie.id} 
                            movie={movie} 
                            onClick={(m) => {
                                setViewingMovie(m);
                                setIsEditingPoster(false);
                                setNewRatingName(userName); // Prefill if exists
                            }} 
                            />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-w-4xl">
                {queue.map(item => (
                  <QueueCard 
                    key={item.id} 
                    item={item} 
                    onVote={handleVote}
                    onPromote={handlePromoteFromQueue} 
                  />
                ))}
                {queue.length === 0 && (
                  <div className="text-center py-20 glass rounded-2xl border-dashed border-white/10">
                    <p className="text-gray-500">清單是空的，提議一部電影吧！</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        
        {/* Floating Action Button (FAB) */}
        <button 
          onClick={() => {
              setModalMode(activeTab === 'history' ? 'add_history' : 'add_queue');
              setIsModalOpen(true);
          }}
          className="fixed bottom-8 right-8 z-40 bg-brand-accent hover:bg-brand-accentHover text-brand-dark rounded-full p-4 shadow-[0_0_30px_rgba(16,185,129,0.5)] hover:shadow-[0_0_40px_rgba(16,185,129,0.7)] hover:scale-110 transition-all duration-300"
        >
          <PlusIcon />
        </button>

      </main>

      {/* --- ADD MOVIE MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md" onClick={closeModal} />
          <div className="glass-strong w-full max-w-2xl rounded-2xl shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh] animate-fadeIn border border-white/10">
            
            <div className="p-6 border-b border-white/10 flex justify-between items-center z-10">
              <h3 className="text-xl font-bold text-white">
                {modalMode === 'add_history' ? '紀錄已觀看電影' : '提議加入待看清單'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-white transition-colors">
                <CloseIcon />
              </button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar">
              {!selectedMovieToAdd ? (
                // Search Step
                <div className="space-y-6">
                   <div className="relative">
                      <input
                        type="text"
                        placeholder="輸入電影標題搜尋 (例如: 全面啟動)..."
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-5 py-4 text-white focus:border-brand-accent focus:outline-none transition-colors"
                        value={modalSearchTerm}
                        onChange={(e) => setModalSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <button 
                        onClick={handleSearch}
                        className="absolute right-3 top-3 bg-brand-accent text-brand-dark px-4 py-1.5 rounded-lg font-bold text-sm hover:bg-brand-accentHover transition-colors"
                        disabled={isSearching}
                      >
                        {isSearching ? '搜尋中...' : '搜尋'}
                      </button>
                   </div>
                   
                   {searchResults.length > 0 && (
                     <div className="space-y-2">
                       <p className="text-xs text-gray-500 uppercase tracking-wider">選擇電影</p>
                       <div className="grid gap-3">
                         {searchResults.map((result, idx) => (
                           <div 
                            key={idx}
                            onClick={() => setSelectedMovieToAdd(result)}
                            className="flex items-start p-3 rounded-xl hover:bg-white/5 cursor-pointer border border-transparent hover:border-brand-accent/30 transition-all group"
                           >
                             <img src={result.posterUrl} alt="" className="w-12 h-16 object-cover rounded bg-gray-800" />
                             <div className="ml-4">
                               <h4 className="text-white font-medium whitespace-pre-wrap group-hover:text-brand-accent transition-colors">{result.title}</h4>
                               <p className="text-sm text-gray-500">{result.year} • {result.director}</p>
                             </div>
                           </div>
                         ))}
                       </div>
                     </div>
                   )}
                </div>
              ) : (
                // Details Step
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="w-full md:w-1/3 flex flex-col items-center">
                    <img 
                      src={customPoster || selectedMovieToAdd.posterUrl} 
                      alt={selectedMovieToAdd.title} 
                      className="w-full rounded-lg shadow-[0_0_20px_rgba(0,0,0,0.5)] mb-4 border border-white/10"
                    />
                    <button 
                      onClick={handleChangePoster}
                      className="text-xs text-brand-accent hover:text-white underline decoration-dashed underline-offset-4"
                    >
                      更換海報版本
                    </button>
                  </div>
                  
                  <div className="w-full md:w-2/3 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-white leading-tight whitespace-pre-wrap">{selectedMovieToAdd.title}</h2>
                      <p className="text-brand-muted text-sm mt-1">{selectedMovieToAdd.year} • {selectedMovieToAdd.director}</p>
                      {selectedMovieToAdd.plot === '請使用搜尋功能更新詳細資訊...' && (
                          <p className="text-amber-500 text-xs mt-2">*此項目來自待看清單，建議點擊下方「返回搜尋」以獲取完整電影資訊(演員、簡介)</p>
                      )}
                    </div>
                    
                    <div className="space-y-4 pt-2">
                         <div>
                           <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">你的名字</label>
                           <input 
                            type="text" 
                            placeholder="輸入名字"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-brand-accent focus:outline-none focus:bg-white/5 transition-all"
                           />
                         </div>

                         {modalMode === 'add_history' && (
                           <>
                             <div>
                               <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">你的評分</label>
                               <StarRating rating={userRating} onRate={setUserRating} size="lg" />
                             </div>
                             
                             <div>
                               <label className="block text-xs uppercase text-gray-500 mb-2 font-bold tracking-wider">觀影日期</label>
                               <input 
                                type="date" 
                                value={userDate}
                                onChange={(e) => setUserDate(e.target.value)}
                                className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-white text-sm focus:border-brand-accent focus:outline-none focus:bg-white/5 transition-all"
                               />
                             </div>
                           </>
                         )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 border-t border-white/10 flex justify-between items-center bg-black/20">
              {selectedMovieToAdd ? (
                <>
                  <button onClick={() => setSelectedMovieToAdd(null)} className="text-gray-400 hover:text-white text-sm">返回搜尋</button>
                  <button 
                    onClick={handleAddMovie}
                    className="bg-brand-accent hover:bg-brand-accentHover text-brand-dark font-bold px-8 py-3 rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.3)] hover:shadow-[0_0_25px_rgba(16,185,129,0.5)]"
                  >
                    {modalMode === 'add_history' ? '儲存至紀錄' : '加入清單'}
                  </button>
                </>
              ) : (
                <div />
              )}
            </div>
          </div>
        </div>
      )}

      {/* --- MOVIE DETAILS POPUP --- */}
      {viewingMovie && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-lg" onClick={() => setViewingMovie(null)} />
          <div className="glass-strong w-full max-w-4xl rounded-3xl shadow-2xl relative overflow-hidden flex flex-col md:flex-row max-h-[90vh] animate-fadeIn border border-white/10">
            
            {/* Header Actions (Close & Delete) */}
            <div className="absolute top-4 right-4 z-20 flex space-x-2">
                {/* Delete Button (Moved here for better access) */}
                <button
                    onClick={(e) => handleDeleteMovie(viewingMovie.id, e)}
                    className="bg-black/40 hover:bg-red-500/80 text-white hover:text-white p-2 rounded-full backdrop-blur-sm transition-colors group"
                    title="刪除紀錄"
                >
                    <TrashIcon />
                </button>
                {/* Close Button */}
                <button 
                  onClick={() => setViewingMovie(null)}
                  className="bg-black/40 hover:bg-black/60 text-white p-2 rounded-full backdrop-blur-sm transition-colors"
                >
                  <CloseIcon />
                </button>
            </div>

            {/* Poster Section */}
            <div className="w-full md:w-2/5 relative min-h-[300px] bg-black/50">
                {!isEditingPoster ? (
                    <>
                        <img 
                            src={viewingMovie.posterUrl} 
                            alt={viewingMovie.title} 
                            className="w-full h-full object-cover absolute inset-0"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/80 pointer-events-none" />
                        <button 
                            onClick={() => handleEditPosterClick(viewingMovie)}
                            className="absolute bottom-4 left-4 bg-black/60 hover:bg-brand-accent text-white hover:text-brand-dark backdrop-blur-sm px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center space-x-1"
                        >
                            <EditIcon />
                            <span>更換海報</span>
                        </button>
                    </>
                ) : (
                    <div className="w-full h-full p-4 overflow-y-auto absolute inset-0 bg-black/90 z-10 flex flex-col">
                        <div className="flex justify-between items-center mb-4 sticky top-0 bg-black/90 pb-2 border-b border-white/10 z-10">
                            <h4 className="text-white font-bold">選擇新海報</h4>
                            <button onClick={() => setIsEditingPoster(false)} className="text-xs text-gray-400">取消</button>
                        </div>
                        {viewingMoviePosters.length === 0 ? (
                             <div className="flex-1 flex items-center justify-center text-brand-accent">載入中...</div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                {viewingMoviePosters.map((url, i) => (
                                    <div 
                                        key={i} 
                                        onClick={() => handleSelectNewPoster(viewingMovie.id, url)}
                                        className="cursor-pointer hover:opacity-80 transition-opacity border-2 border-transparent hover:border-brand-accent rounded-lg overflow-hidden"
                                    >
                                        <img src={url} className="w-full h-auto" />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Info Section */}
            <div className="w-full md:w-3/5 p-8 flex flex-col overflow-y-auto bg-black/40 custom-scrollbar">
              <div className="mb-6 mr-16"> {/* MR for close button safety */}
                <h2 className="text-3xl md:text-4xl font-bold text-white mb-2 leading-tight whitespace-pre-wrap">{viewingMovie.title}</h2>
                <div className="flex flex-wrap items-center gap-3 text-brand-muted text-sm">
                  <span className="bg-white/10 px-2 py-0.5 rounded text-gray-300">{viewingMovie.year}</span>
                  <span>{viewingMovie.director}</span>
                  <div className="flex items-center ml-2 border-l border-white/10 pl-3">
                     <span className="text-xs text-gray-500 mr-2 uppercase font-bold tracking-wider">平均評分</span>
                     <StarRating 
                        rating={getAverageRating(viewingMovie.ratings)} 
                        readOnly
                        size="md" 
                     />
                     <span className="text-xs text-gray-400 ml-1">({viewingMovie.ratings.length})</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6 text-gray-300 flex-1">
                {/* Plot */}
                <div>
                  <h4 className="text-brand-accent text-sm font-bold uppercase tracking-wider mb-2">劇情簡介</h4>
                  <p className="leading-relaxed text-sm md:text-base opacity-90">
                    {viewingMovie.plot}
                  </p>
                </div>
                
                {/* Actors */}
                {viewingMovie.actors && (
                  <div>
                    <h4 className="text-brand-accent text-sm font-bold uppercase tracking-wider mb-2">主演</h4>
                    <p className="text-sm opacity-80">{viewingMovie.actors}</p>
                  </div>
                )}

                {/* Date & Recorder Row */}
                <div className="flex flex-wrap items-center gap-6 text-sm">
                  <div className="flex items-center">
                    <span className="text-brand-accent font-bold uppercase tracking-wider mr-2 text-xs">觀影日期:</span>
                    <span className="text-white font-mono">{new Date(viewingMovie.dateWatched).toLocaleDateString('zh-TW')}</span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-brand-accent font-bold uppercase tracking-wider mr-2 text-xs">紀錄者:</span>
                    <span className="text-white">{viewingMovie.addedBy}</span>
                  </div>
                </div>
                
                {/* Divider Line */}
                <hr className="border-white/10" />

                {/* Rating History Section */}
                <div className="bg-white/5 rounded-xl p-4 border border-white/5">
                    <h4 className="text-brand-accent text-sm font-bold uppercase tracking-wider mb-4 border-b border-white/5 pb-2">評分紀錄</h4>
                    
                    {/* List */}
                    <div className="space-y-3 mb-4 max-h-32 overflow-y-auto custom-scrollbar">
                        {viewingMovie.ratings.map((r, i) => (
                            <div key={i} className="flex items-center justify-between text-sm">
                                <div className="flex items-center space-x-2">
                                    <div className="w-6 h-6 rounded-full bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-xs font-bold text-gray-300">
                                        {r.user.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-gray-200">{r.user}</span>
                                </div>
                                <StarRating rating={r.score} readOnly size="sm" />
                            </div>
                        ))}
                    </div>

                    {/* Add/Update Rating Form */}
                    <div className="bg-black/20 rounded-lg p-3">
                        <p className="text-xs text-gray-500 mb-2">新增或更新你的評分:</p>
                        <div className="flex flex-col space-y-2">
                            <input 
                                type="text"
                                placeholder="你的名字"
                                value={newRatingName}
                                onChange={(e) => setNewRatingName(e.target.value)}
                                className="bg-black/40 border border-white/10 rounded px-3 py-2 text-xs text-white focus:border-brand-accent focus:outline-none"
                            />
                            <div className="flex justify-between items-center">
                                <StarRating rating={newRatingScore} onRate={setNewRatingScore} size="sm" />
                                <button 
                                    onClick={() => handleSubmitRating(viewingMovie.id)}
                                    disabled={!newRatingName || newRatingScore === 0}
                                    className="bg-brand-accent/20 hover:bg-brand-accent/30 text-brand-accent text-xs px-3 py-1.5 rounded transition-colors disabled:opacity-50"
                                >
                                    送出
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}