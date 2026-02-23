
import React, { useState, useEffect } from 'react';
import { UserData, Task } from '../types';
import { Zap, Play, CheckCircle2, Star, Youtube } from 'lucide-react';

interface TaskWallProps {
  userData: UserData;
  updateUserData: (data: Partial<UserData>) => void;
}

const TaskWall: React.FC<TaskWallProps> = ({ userData, updateUserData }) => {
  const [activeTaskId, setActiveTaskId] = useState<string | null>(null);

  const tasks: Task[] = [];

  const handleCompleteTask = (task: Task) => {
    if (userData.completedTaskIds?.includes(task.id)) return;
    if (activeTaskId === task.id) return;

    if (task.url) {
      window.open(task.url, '_blank');
    }

    setActiveTaskId(task.id);

    // 11 second countdown
    setTimeout(() => {
      const tx = {
        id: `tx_${Date.now()}`,
        amount: task.reward,
        coinAmount: task.reward,
        rewardType: task.title,
        timestamp: Date.now(),
        status: 'SUCCESS' as const,
        destinationId: task.provider,
        type: 'EARN' as const
      };

      updateUserData({
        coinBalance: userData.coinBalance + task.reward,
        lifetimeCoins: userData.lifetimeCoins + task.reward,
        transactions: [...userData.transactions, tx],
        completedTaskIds: [...(userData.completedTaskIds || []), task.id]
      });
      setActiveTaskId(null);
    }, 11000);
  };

  const availableTasks = tasks.filter(task => !userData.completedTaskIds?.includes(task.id));

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 border border-slate-800 p-8 rounded-[2.5rem] shadow-2xl">
        <h2 className="text-2xl font-gaming font-bold text-white uppercase tracking-widest mb-2">Task Wall</h2>
        <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">Complete missions to earn massive rewards</p>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {availableTasks.length === 0 ? (
          <div className="bg-slate-900 border border-slate-800 p-12 rounded-[2rem] text-center">
            <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mx-auto mb-4 opacity-20">
              <Zap className="w-8 h-8" />
            </div>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No tasks available at the moment</p>
            <p className="text-slate-600 text-[10px] mt-2 uppercase">Check back later for new missions</p>
          </div>
        ) : (
          availableTasks.map((task) => {
          const isCompleted = userData.completedTaskIds?.includes(task.id);
          
          return (
            <div 
              key={task.id}
              className={`bg-slate-900 border border-slate-800 p-6 rounded-[2rem] flex items-center justify-between group transition-all ${
                isCompleted ? 'opacity-60 grayscale' : 'hover:border-cyan-500/30 hover:bg-slate-800/20'
              }`}
            >
              <div className="flex items-center gap-5">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                  task.id === 'yt_sub' ? 'bg-red-500/10 text-red-500' :
                  task.type === 'AD' ? 'bg-red-500/10 text-red-500' : 
                  task.type === 'POLL' ? 'bg-purple-500/10 text-purple-500' : 'bg-cyan-500/10 text-cyan-500'
                }`}>
                  {task.id === 'yt_sub' ? <Youtube className="w-7 h-7" /> :
                   task.type === 'AD' ? <Play className="w-7 h-7" /> : 
                   task.type === 'POLL' ? <Star className="w-7 h-7" /> : <Zap className="w-7 h-7" />}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-white">{task.title}</h3>
                  <p className="text-xs text-slate-500 font-medium">{task.description}</p>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-2xl font-gaming font-bold text-cyan-400 mb-2">
                  +{task.reward} <span className="text-[10px] text-slate-500 font-sans">Coins</span>
                </div>
                <button
                  disabled={isCompleted || activeTaskId === task.id}
                  onClick={() => handleCompleteTask(task)}
                  className={`px-6 py-2 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${
                    isCompleted 
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed' 
                    : activeTaskId === task.id
                    ? 'bg-cyan-500/20 text-cyan-400 cursor-wait'
                    : 'bg-white text-slate-950 hover:scale-105 active:scale-95'
                  }`}
                >
                  {isCompleted ? 'Completed' : activeTaskId === task.id ? 'Processing...' : 'Start Task'}
                </button>
              </div>
            </div>
            );
          })
        )}
      </div>
    </div>
  );
};

export default TaskWall;
