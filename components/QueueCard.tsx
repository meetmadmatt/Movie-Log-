import React from 'react';
import { QueueItem } from '../types';

interface QueueCardProps {
  item: QueueItem;
  onVote: (id: string, type: 'up' | 'down') => void;
  onPromote: (item: QueueItem) => void;
}

const QueueCard: React.FC<QueueCardProps> = ({ item, onVote, onPromote }) => {
  return (
    <div className="flex items-center glass-card rounded-xl p-4 mb-3 hover:bg-white/5 transition-colors group relative overflow-hidden">
      <div className="w-16 h-24 flex-shrink-0 overflow-hidden rounded-lg shadow-lg">
        <img 
          src={item.posterUrl} 
          alt={item.title} 
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
      </div>
      
      <div className="ml-5 flex-grow min-w-0 pr-12">
        <h4 className="text-white font-bold text-lg leading-tight line-clamp-2 whitespace-pre-wrap">{item.title}</h4>
        <div className="flex items-center mt-1 space-x-2">
          <span className="text-xs bg-white/10 px-2 py-0.5 rounded text-gray-300">{item.year}</span>
          <span className="text-gray-500 text-xs">提議者: {item.addedBy}</span>
        </div>
      </div>
      
      {/* Voting Section */}
      <div className="flex flex-col items-center justify-center ml-4 space-y-2 bg-black/20 p-2 rounded-lg border border-white/5">
        <button 
          onClick={() => onVote(item.id, 'up')}
          className="text-gray-400 hover:text-brand-accent transition-colors p-1 hover:bg-brand-accent/10 rounded group/btn"
          title="Vote Up"
        >
          {/* Thumbs Up Icon */}
          <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
          </svg>
        </button>
        
        <span className={`font-bold font-mono text-sm ${item.upvotes - item.downvotes > 0 ? 'text-brand-accent' : 'text-gray-400'}`}>
          {item.upvotes - item.downvotes}
        </span>
        
        <button 
          onClick={() => onVote(item.id, 'down')}
          className="text-gray-400 hover:text-red-400 transition-colors p-1 hover:bg-red-400/10 rounded group/btn"
          title="Vote Down"
        >
          {/* Thumbs Down Icon */}
          <svg className="w-5 h-5 group-hover/btn:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018a2 2 0 01.485.06L17 4m-7 10v2a2 2 0 002 2h.095c.5 0 .905-.405.905-.905 0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-10h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
          </svg>
        </button>
      </div>

      {/* Mark as Watched Button (Absolute Positioned for cleaner look) */}
      <button
        onClick={() => onPromote(item)}
        className="absolute bottom-4 right-20 md:static md:bottom-auto md:right-auto md:ml-4 bg-brand-accent/10 hover:bg-brand-accent text-brand-accent hover:text-brand-dark p-2 rounded-full transition-all duration-300 shadow-[0_0_15px_rgba(16,185,129,0.1)] hover:shadow-[0_0_20px_rgba(16,185,129,0.4)]"
        title="記錄為已觀看 (移出待看列表)"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
        </svg>
      </button>
    </div>
  );
};

export default QueueCard;