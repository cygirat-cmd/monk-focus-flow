import { useEffect, useMemo, useState } from 'react';
import BottomNav from '@/components/layout/BottomNav';
import { Task, TasksState, loadTasks, saveTasks } from '@/utils/storage';
import { analytics } from '@/utils/analytics';
import { useNavigate } from 'react-router-dom';

const columns: { key: keyof TasksState; label: string }[] = [
  { key: 'now', label: 'Now' },
  { key: 'next', label: 'Next' },
  { key: 'later', label: 'Later' },
];

export default function Tasks() {
  const [state, setState] = useState<TasksState>(loadTasks());
  const [newTask, setNewTask] = useState('');
  const [drag, setDrag] = useState<{ id: string; from: keyof TasksState } | null>(null);
  const nav = useNavigate();

  useEffect(() => {
    document.title = 'Tasks – Monk';
  }, []);

  useEffect(() => saveTasks(state), [state]);

  const addTask = () => {
    if (!newTask.trim()) return;
    const t: Task = { id: crypto.randomUUID(), title: newTask.trim() };
    setState((s) => ({ ...s, now: [t, ...s.now] }));
    setNewTask('');
    analytics.track({ type: 'task_added' });
  };

  const onDrop = (to: keyof TasksState) => {
    if (!drag) return;
    setState((s) => {
      const fromList = s[drag.from].filter((t) => t.id !== drag.id);
      const moved = Object.values(s).flat().find((t) => t.id === drag.id)!;
      const toList = [moved, ...s[to]];
      return { ...s, [drag.from]: fromList, [to]: toList };
    });
    setDrag(null);
  };

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <main className="mx-auto max-w-md px-4 pt-6">
        <header className="mb-4">
          <h1 className="text-xl font-semibold">Tasks</h1>
          <p className="text-sm text-muted-foreground">Quickly sort into Now / Next / Later</p>
        </header>

        <div className="flex items-center gap-2 mb-4">
          <input
            value={newTask}
            onChange={(e) => setNewTask(e.target.value)}
            placeholder="Add a task"
            className="flex-1 px-3 py-2 rounded-md border bg-card"
          />
          <button onClick={addTask} className="px-3 py-2 rounded-md bg-primary text-primary-foreground">Add</button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {columns.map((c) => (
            <section key={c.key} className="rounded-md border p-2 bg-card min-h-[320px]" onDragOver={(e) => e.preventDefault()} onDrop={() => onDrop(c.key)}>
              <h2 className="text-sm font-semibold mb-2">{c.label}</h2>
              <div className="flex flex-col gap-2">
                {state[c.key].map((t) => (
                  <article
                    key={t.id}
                    className="p-2 rounded border bg-background cursor-move"
                    draggable
                    onDragStart={() => setDrag({ id: t.id, from: c.key })}
                    onDoubleClick={() => {
                      if (c.key === 'now') {
                        // Start timer directly
                        nav('/');
                      }
                    }}
                  >
                    <p className="text-sm leading-snug">{t.title}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}
        </div>
      </main>
      <BottomNav />
    </div>
  );
}
