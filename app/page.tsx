'use client';

import { type SyntheticEvent, useEffect, useState } from 'react';
import {
  ArrowDownLeft,
  ArrowUpLeft,
  Check,
  ChevronLeft,
  CircleDollarSign,
  Flame,
  Home,
  ListTodo,
  Plus,
  Target,
  Timeline,
  Utensils,
  WalletCards,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect } from '@/components/ui/native-select';

type View = 'today' | 'finance' | 'tasks' | 'habits' | 'goals' | 'timeline';
type Task = { id: string; title: string; time?: string; done: boolean };
type Habit = {
  id: string;
  title: string;
  emoji: string;
  streak: number;
  done: boolean;
};
type Activity = {
  id: string;
  type: 'expense' | 'task' | 'habit' | 'checkin';
  title: string;
  detail: string;
  value: string;
};

const seedTasks: Task[] = [
  { id: 't1', title: 'לעבור על תקציב ספטמבר', time: '10:00', done: false },
  { id: 't2', title: 'לקבוע תור לרופא שיניים', done: false },
  { id: 't3', title: 'לשלוח סיכום שבועי', time: '16:30', done: true },
  { id: 't4', title: 'לסדר את שולחן העבודה', time: '18:00', done: false },
];
const seedHabits: Habit[] = [
  { id: 'h1', title: 'שתיית מים', emoji: '💧', streak: 12, done: true },
  { id: 'h2', title: 'קריאה 20 דק׳', emoji: '📚', streak: 7, done: false },
  { id: 'h3', title: 'הליכה', emoji: '🚶', streak: 4, done: false },
  { id: 'h4', title: 'מדיטציה', emoji: '🧘', streak: 2, done: false },
];
const seedActivity: Activity[] = [
  {
    id: 'a1',
    type: 'expense',
    title: 'ארוחת צהריים',
    detail: 'אוכל · לפני 24 דקות',
    value: '− ₪45',
  },
  {
    id: 'a2',
    type: 'task',
    title: 'שלחת סיכום שבועי',
    detail: 'משימה · 09:45',
    value: 'הושלם',
  },
  {
    id: 'a3',
    type: 'habit',
    title: 'שתיית מים',
    detail: 'הרגל · רצף של 12 ימים',
    value: '+1',
  },
  {
    id: 'a4',
    type: 'expense',
    title: 'נסיעה ברכבת',
    detail: 'תחבורה · אתמול',
    value: '− ₪18',
  },
  {
    id: 'a5',
    type: 'checkin',
    title: 'צ׳ק־אין ערב',
    detail: 'הרגשה טובה · אתמול',
    value: '4/5',
  },
];

const navItems = [
  { id: 'today' as View, label: 'היום', icon: Home },
  { id: 'finance' as View, label: 'כספים', icon: WalletCards },
  { id: 'tasks' as View, label: 'משימות', icon: ListTodo },
  { id: 'habits' as View, label: 'הרגלים', icon: Flame },
  { id: 'goals' as View, label: 'מטרות', icon: Target },
  { id: 'timeline' as View, label: 'ציר הזמן', icon: Timeline },
];

export default function HomePage() {
  const [view, setView] = useState<View>('today');
  const [tasks, setTasks] = useState(seedTasks);
  const [habits, setHabits] = useState(seedHabits);
  const [activity, setActivity] = useState(seedActivity);
  const [notice, setNotice] = useState('');
  const [taskComposer, setTaskComposer] = useState(false);
  const [expenseComposer, setExpenseComposer] = useState(false);
  const completed = tasks.filter((x) => x.done).length;
  const habitDone = habits.filter((x) => x.done).length;

  const go = (next: View) => {
    setView(next);
    setTaskComposer(false);
    setExpenseComposer(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  const toast = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2600);
  };
  const toggleTask = (id: string) =>
    setTasks((items) =>
      items.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    );
  const toggleHabit = (id: string) =>
    setHabits((items) =>
      items.map((item) =>
        item.id === id ? { ...item, done: !item.done } : item,
      ),
    );

  const addTask = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const title = fieldText(form, 'title').trim();
    if (!title) return;
    setTasks((items) => [
      {
        id: crypto.randomUUID(),
        title,
        time: fieldText(form, 'time') || undefined,
        done: false,
      },
      ...items,
    ]);
    event.currentTarget.reset();
    setTaskComposer(false);
    toast('המשימה נוספה להיום');
  };
  const addExpense = (event: SyntheticEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const amount = Number(form.get('amount'));
    const category = fieldText(form, 'category');
    const description = fieldText(form, 'description') || category;
    if (!amount || amount <= 0) return;
    setActivity((items) => [
      {
        id: crypto.randomUUID(),
        type: 'expense',
        title: description,
        detail: `${category} · עכשיו`,
        value: `− ₪${amount}`,
      },
      ...items,
    ]);
    event.currentTarget.reset();
    setExpenseComposer(false);
    toast('ההוצאה נוספה לציר הזמן');
  };

  useEffect(() => {
    const context = (
      document as Document & {
        modelContext?: {
          registerTool?: (
            tool: unknown,
            options?: { signal?: AbortSignal },
          ) => void | Promise<void>;
        };
      }
    ).modelContext;
    if (!context?.registerTool) return;
    const life = new AbortController();
    Promise.resolve(
      context.registerTool(
        {
          name: 'navigate_life_os',
          title: 'פתיחת אזור ב־Life OS',
          description: 'Navigate to a visible Life OS area.',
          inputSchema: {
            type: 'object',
            properties: {
              view: {
                type: 'string',
                enum: [
                  'today',
                  'finance',
                  'tasks',
                  'habits',
                  'goals',
                  'timeline',
                ],
              },
            },
            required: ['view'],
            additionalProperties: false,
          },
          annotations: { readOnlyHint: true, untrustedContentHint: false },
          execute(input: unknown) {
            const next = (input as { view: View }).view;
            setView(next);
            return { view: next, status: 'visible' };
          },
        },
        { signal: life.signal },
      ),
    ).catch(() => {});
    return () => life.abort();
  }, []);

  return (
    <div
      dir="rtl"
      className="min-h-screen bg-[#f5f5f7] text-[#1d1d1f] selection:bg-[#cce4ff]"
    >
      <div className="app-shell">
        <Sidebar view={view} onNavigate={go} />
        <main
          id="main-content"
          className="app-main"
        >
          <AppHeader
            view={view}
            onProfile={() => toast('הפרופיל שלך מעודכן')}
          />
          {view === 'today' && (
            <Today
              tasks={tasks}
              habits={habits}
              activity={activity}
              completed={completed}
              habitDone={habitDone}
              onTask={toggleTask}
              onHabit={toggleHabit}
              onNavigate={go}
              onNewTask={() => setTaskComposer(true)}
              onExpense={() => setExpenseComposer(true)}
              onCheckin={() => {
                setActivity((items) => [
                  {
                    id: crypto.randomUUID(),
                    type: 'checkin',
                    title: 'צ׳ק־אין יומי',
                    detail: 'הרגשה טובה · עכשיו',
                    value: '4/5',
                  },
                  ...items,
                ]);
                toast('הצ׳ק־אין נשמר');
              }}
            />
          )}
          {view === 'finance' && (
            <Finance onNewExpense={() => setExpenseComposer(true)} />
          )}
          {view === 'tasks' && (
            <Tasks
              tasks={tasks}
              onToggle={toggleTask}
              onNew={() => setTaskComposer(true)}
            />
          )}
          {view === 'habits' && (
            <Habits habits={habits} onToggle={toggleHabit} />
          )}
          {view === 'goals' && (
            <Goals onUpdate={() => toast('התקדמות המטרה עודכנה')} />
          )}
          {view === 'timeline' && <TimelineView activity={activity} />}
        </main>
        <MobileNav view={view} onNavigate={go} />
        {taskComposer && (
          <Composer title="משימה חדשה" onClose={() => setTaskComposer(false)}>
            <form onSubmit={addTask} className="space-y-4">
              <Labeled label="מה צריך לעשות?">
                <Input
                  name="title"
                  required
                  placeholder="לדוגמה: להתקשר לבנק"
                  className="h-11 bg-white"
                />
              </Labeled>
              <Labeled label="שעה (רשות)">
                <Input name="time" type="time" className="h-11 bg-white" />
              </Labeled>
              <Button type="submit" className="h-11 w-full">
                הוספת משימה
              </Button>
            </form>
          </Composer>
        )}
        {expenseComposer && (
          <Composer
            title="הוצאה חדשה"
            onClose={() => setExpenseComposer(false)}
          >
            <form onSubmit={addExpense} className="space-y-4">
              <Labeled label="סכום">
                <Input
                  name="amount"
                  type="number"
                  min="1"
                  step="0.01"
                  inputMode="decimal"
                  required
                  placeholder="0"
                  className="h-11 bg-white"
                />
              </Labeled>
              <Labeled label="קטגוריה">
                <NativeSelect
                  name="category"
                  className="w-full"
                  defaultValue="אוכל"
                >
                  <option>אוכל</option>
                  <option>תחבורה</option>
                  <option>בית</option>
                  <option>בילויים</option>
                  <option>אחר</option>
                </NativeSelect>
              </Labeled>
              <Labeled label="תיאור">
                <Input
                  name="description"
                  placeholder="מה קנית?"
                  className="h-11 bg-white"
                />
              </Labeled>
              <Button type="submit" className="h-11 w-full">
                שמירת הוצאה
              </Button>
            </form>
          </Composer>
        )}
        {notice && (
          <output
            aria-live="polite"
            className="fixed bottom-24 left-1/2 z-[70] -translate-x-1/2 whitespace-nowrap rounded-xl bg-[#1d1d1f] px-5 py-3 text-sm font-bold text-white shadow-xl lg:bottom-8"
          >
            {notice}
          </output>
        )}
      </div>
    </div>
  );
}

function Sidebar({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (v: View) => void;
}) {
  return (
    <aside className="app-sidebar">
      <Brand />
      <nav className="space-y-1" aria-label="ניווט ראשי">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            aria-current={view === id ? 'page' : undefined}
            className={`nav-item ${view === id ? 'active' : ''}`}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>
      <div className="mt-auto border-t border-[#dcd9d1] px-3 pt-5">
        <p className="text-xs font-bold text-[#46635b]">טיפ יומי</p>
        <p className="mt-2 text-sm leading-6 text-[#65736e]">
          עדכון קטן בכל יום הופך את התמונה הגדולה לברורה.
        </p>
      </div>
    </aside>
  );
}
function Brand() {
  return (
    <div className="mb-10 flex items-center gap-3 px-3">
      <div className="grid size-10 place-items-center rounded-xl bg-[#007aff] text-lg font-semibold text-white">
        L
      </div>
      <div>
        <p className="text-lg font-semibold">Life OS</p>
        <p className="text-xs text-[#71807c]">הכל במקום אחד</p>
      </div>
    </div>
  );
}
function MobileNav({
  view,
  onNavigate,
}: {
  view: View;
  onNavigate: (v: View) => void;
}) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-full items-center justify-around border-t border-black/5 bg-[#fafafa]/95 px-2 pb-[max(10px,env(safe-area-inset-bottom))] pt-2 shadow-[0_-10px_24px_rgba(30,40,37,.06)] backdrop-blur-xl lg:hidden"
      aria-label="ניווט נייד"
    >
      {navItems.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          onClick={() => onNavigate(id)}
          aria-current={view === id ? 'page' : undefined}
          className={`mobile-nav ${view === id ? 'active' : ''}`}
        >
          <span>
            <Icon />
          </span>
          {label}
        </button>
      ))}
    </nav>
  );
}
function AppHeader({ view, onProfile }: { view: View; onProfile: () => void }) {
  const title: Record<View, string> = {
    today: 'בוקר טוב, דניאל',
    finance: 'הכספים שלי',
    tasks: 'המשימות שלי',
    habits: 'ההרגלים שלי',
    goals: 'המטרות שלי',
    timeline: 'ציר הזמן',
  };
  return (
    <header className="app-header">
      <div>
        <p className="mb-1 text-xs font-semibold text-[#7c8985]">
          יום שישי, 11 בספטמבר
        </p>
        <h1 className="page-heading">
          {title[view]}
        </h1>
      </div>
      <button
        onClick={onProfile}
        aria-label="פתיחת פרופיל"
        className="grid size-11 place-items-center rounded-full bg-[#e5e5ea] text-sm font-semibold ring-4 ring-white/70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#007aff]"
      >
        דנ
      </button>
    </header>
  );
}

function Today({
  tasks,
  habits,
  activity,
  completed,
  habitDone,
  onTask,
  onHabit,
  onNavigate,
  onNewTask,
  onExpense,
  onCheckin,
}: {
  tasks: Task[];
  habits: Habit[];
  activity: Activity[];
  completed: number;
  habitDone: number;
  onTask: (id: string) => void;
  onHabit: (id: string) => void;
  onNavigate: (v: View) => void;
  onNewTask: () => void;
  onExpense: () => void;
  onCheckin: () => void;
}) {
  return (
    <>
      <BudgetHero />
      <div className="overview-grid">
        <div className="space-y-7">
          <section className="panel">
            <SectionTitle
              title="המשימות שלי"
              sub={`${completed} מתוך ${tasks.length} הושלמו`}
              action="לכל המשימות"
              onAction={() => onNavigate('tasks')}
            />
            <TaskList tasks={tasks.slice(0, 3)} onToggle={onTask} />
            <Button
              onClick={onNewTask}
              variant="ghost"
              className="mt-3 h-10 w-full justify-start rounded-xl text-[#0066cc]"
            >
              <Plus />
              משימה חדשה
            </Button>
          </section>
          <section className="panel">
            <SectionTitle
              title="פעילות אחרונה"
              sub="הכל קורה בציר זמן אחד"
              action="הצג הכל"
              onAction={() => onNavigate('timeline')}
            />
            <ActivityList activity={activity.slice(0, 3)} />
          </section>
        </div>
        <div className="space-y-7">
          <section className="panel">
            <div className="section-title">
              <div>
                <p>ההרגלים של היום</p>
                <span>
                  {habitDone} מתוך {habits.length} הושלמו
                </span>
              </div>
              <b className="text-sm text-[#587068]">
                {habitDone}/{habits.length}
              </b>
            </div>
            <HabitGrid habits={habits.slice(0, 3)} onToggle={onHabit} />
          </section>
          <GoalCard />
          <section className="grid grid-cols-2 gap-3">
            <Quick
              icon={ArrowDownLeft}
              title="הוצאה חדשה"
              sub="תיעוד מהיר"
              warm
              onClick={onExpense}
            />
            <Quick
              icon={CircleDollarSign}
              title="צ׳ק־אין"
              sub="איך היה היום?"
              onClick={onCheckin}
            />
          </section>
        </div>
      </div>
    </>
  );
}
function BudgetHero() {
  return (
    <section
      aria-label="סיכום כספי"
      className="budget-summary"
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-white/65">נשאר לך החודש</p>
          <p className="balance-value">₪3,240</p>
        </div>
        <div className="rounded-xl bg-white/10 p-3">
          <WalletCards className="size-6" />
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/15">
        <div className="h-full w-[57%] rounded-full bg-[#64d2ff]" />
      </div>
      <div className="mt-3 flex justify-between text-xs text-white/65">
        <span>נוצלו ₪4,260</span>
        <span>תקציב ₪7,500</span>
      </div>
      <div className="mt-5 grid grid-cols-2 border-t border-white/10 pt-4">
        <Metric label="הוצאות היום" value="₪127" />
        <Metric label="הוצאות החודש" value="₪4,260" divided />
      </div>
    </section>
  );
}
function Metric({
  label,
  value,
  divided,
}: {
  label: string;
  value: string;
  divided?: boolean;
}) {
  return (
    <div className={divided ? 'border-r border-white/10 pr-4' : ''}>
      <p className="text-xs text-white/55">{label}</p>
      <p className="mt-1 text-lg font-semibold">{value}</p>
    </div>
  );
}

function Finance({ onNewExpense }: { onNewExpense: () => void }) {
  const cats = [
    ['אוכל', '₪1,240', '68%'],
    ['בית', '₪980', '44%'],
    ['תחבורה', '₪620', '71%'],
    ['בילויים', '₪540', '52%'],
  ];
  return (
    <div className="content-flow">
      <div className="page-lead">
        <div>
          <h2>ספטמבר במספרים</h2>
          <p>תמונה ברורה של התקציב וההוצאות שלך החודש.</p>
        </div>
        <Button onClick={onNewExpense} className="h-10">
          <Plus />
          הוצאה חדשה
        </Button>
      </div>
      <BudgetHero />
      <section>
        <SectionTitle
          title="תקציב לפי קטגוריה"
          sub="ניצול מצטבר מתחילת החודש"
        />
        <div className="mt-5 divide-y divide-[#dfdcd4] border-y border-[#dfdcd4]">
          {cats.map(([name, amount, pct]) => (
            <div
              key={name}
              className="grid grid-cols-[1fr_auto] items-center gap-4 py-4"
            >
              <div>
                <div className="flex justify-between text-sm">
                  <b>{name}</b>
                  <span className="text-[#6f7b77]">{amount}</span>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#deded8]">
                  <div
                    className="h-full rounded-full bg-[#007aff]"
                    style={{ width: pct }}
                  />
                </div>
              </div>
              <b className="text-xs text-[#527c71]">{pct}</b>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
function Tasks({
  tasks,
  onToggle,
  onNew,
}: {
  tasks: Task[];
  onToggle: (id: string) => void;
  onNew: () => void;
}) {
  const [inbox, setInbox] = useState<'today' | 'open' | 'done'>('today');
  const shown = tasks.filter((t) =>
    inbox === 'done' ? t.done : inbox === 'open' ? !t.done : true,
  );
  return (
    <div className="content-flow">
      <div className="page-lead">
        <div>
          <h2>מרשימה לביצוע</h2>
          <p>כל מה שדורש תשומת לב, מסודר לפי הקצב שלך.</p>
        </div>
        <Button onClick={onNew} className="h-10">
          <Plus />
          משימה חדשה
        </Button>
      </div>
      <div className="filter-row" role="tablist" aria-label="סינון משימות">
        {[
          ['today', 'היום'],
          ['open', 'פתוחות'],
          ['done', 'הושלמו'],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={inbox === id}
            onClick={() => setInbox(id as typeof inbox)}
            className={inbox === id ? 'selected' : ''}
          >
            {label}
          </button>
        ))}
      </div>
      <section className="panel">
        <SectionTitle
          title={inbox === 'done' ? 'משימות שהושלמו' : 'המשימות שלך'}
          sub={`${shown.length} פריטים בתצוגה`}
        />
        <TaskList tasks={shown} onToggle={onToggle} />
        {shown.length === 0 && (
          <EmptyState
            title="אין כאן משימות"
            text="אפשר להוסיף משימה חדשה או לעבור למסנן אחר."
            action="הוספת משימה"
            onAction={onNew}
          />
        )}
      </section>
    </div>
  );
}
function Habits({
  habits,
  onToggle,
}: {
  habits: Habit[];
  onToggle: (id: string) => void;
}) {
  const done = habits.filter((x) => x.done).length;
  return (
    <div className="content-flow">
      <div className="page-lead">
        <div>
          <h2>עקביות, לא שלמות</h2>
          <p>לחיצה אחת מעדכנת את היום ושומרת על הרצף.</p>
        </div>
        <span className="summary-number">
          {done}/{habits.length}
        </span>
      </div>
      <section className="panel">
        <SectionTitle title="היום" sub="11 בספטמבר" />
        <HabitGrid habits={habits} onToggle={onToggle} />
      </section>
      <section>
        <SectionTitle title="השבוע שלך" sub="מספר הרגלים שהושלמו בכל יום" />
        <div className="mt-5 flex h-32 items-end justify-between gap-2 border-b border-[#cbc9c1] px-2">
          {[
            ['ו׳', 3],
            ['ה׳', 4],
            ['ד׳', 2],
            ['ג׳', 3],
            ['ב׳', 4],
            ['א׳', 2],
            ['ש׳', 3],
          ].map(([day, n]) => (
            <div
              key={String(day)}
              className="flex flex-1 flex-col items-center gap-2"
            >
              <div
                className="w-full max-w-9 rounded-t-md bg-[#007aff]"
                style={{ height: `${Number(n) * 22}px` }}
              />
              <span className="text-xs text-[#79847f]">{day}</span>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
function Goals({ onUpdate }: { onUpdate: () => void }) {
  return (
    <div className="content-flow">
      <div className="page-lead">
        <div>
          <h2>מה חשוב עכשיו</h2>
          <p>מטרות חודשיות וארוכות טווח, בלי לאבד את הדרך.</p>
        </div>
        <Button onClick={onUpdate} variant="outline" className="h-10">
          עדכון התקדמות
        </Button>
      </div>
      <GoalCard />
      <section>
        <SectionTitle
          title="מטרות ארוכות טווח"
          sub="הצעדים הגדולים, בקצב יציב"
        />
        <div className="mt-5 divide-y divide-[#dfdcd4] border-y border-[#dfdcd4]">
          <GoalRow title="קרן חירום" detail="₪18,500 מתוך ₪30,000" pct={62} />
          <GoalRow
            title="לסיים קורס TypeScript"
            detail="14 מתוך 24 שיעורים"
            pct={58}
          />
          <GoalRow title="ריצת 10 ק״מ" detail="7.2 ק״מ שיא נוכחי" pct={72} />
        </div>
      </section>
    </div>
  );
}
function TimelineView({ activity }: { activity: Activity[] }) {
  const [filter, setFilter] = useState<'all' | Activity['type']>('all');
  const shown =
    filter === 'all' ? activity : activity.filter((x) => x.type === filter);
  return (
    <div className="content-flow">
      <div className="page-lead">
        <div>
          <h2>הסיפור של היום</h2>
          <p>כספים, משימות, הרגלים וצ׳ק־אינים — ברצף אחד.</p>
        </div>
      </div>
      <div className="filter-row" role="tablist" aria-label="סינון ציר הזמן">
        {[
          ['all', 'הכל'],
          ['expense', 'הוצאות'],
          ['task', 'משימות'],
          ['habit', 'הרגלים'],
          ['checkin', 'צ׳ק־אין'],
        ].map(([id, label]) => (
          <button
            key={id}
            role="tab"
            aria-selected={filter === id}
            onClick={() => setFilter(id as typeof filter)}
            className={filter === id ? 'selected' : ''}
          >
            {label}
          </button>
        ))}
      </div>
      <section className="panel">
        <ActivityList activity={shown} />
        {shown.length === 0 && (
          <EmptyState
            title="אין פעילות להצגה"
            text="בחר מסנן אחר כדי לראות פעילות."
          />
        )}
      </section>
    </div>
  );
}

function TaskList({
  tasks,
  onToggle,
}: {
  tasks: Task[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="mt-4 space-y-1">
      {tasks.map((task) => (
        <button
          key={task.id}
          onClick={() => onToggle(task.id)}
          aria-pressed={task.done}
          className="row-item"
        >
          <span className={`check ${task.done ? 'done' : ''}`}>
            {task.done && <Check />}
          </span>
          <span className="flex-1 text-right">
            <span
              className={`block text-sm font-bold ${task.done ? 'text-[#8f9995] line-through' : ''}`}
            >
              {task.title}
            </span>
            {task.time && (
              <span className="mt-1 block text-xs text-[#7c8783]">
                {task.time}
              </span>
            )}
          </span>
        </button>
      ))}
    </div>
  );
}
function HabitGrid({
  habits,
  onToggle,
}: {
  habits: Habit[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="habit-grid">
      {habits.map((h) => (
        <button
          key={h.id}
          onClick={() => onToggle(h.id)}
          aria-pressed={h.done}
          className={`habit ${h.done ? 'active' : ''}`}
        >
          <span className="text-2xl">{h.emoji}</span>
          <span className="mt-2 text-xs font-semibold">{h.title}</span>
          <span className="mt-1 flex items-center gap-1 text-xs text-[#6f7c77]">
            <Flame className="size-3 text-[#d77c3d]" />
            {h.streak} ימים
          </span>
          {h.done && (
            <span className="absolute left-2 top-2 grid size-5 place-items-center rounded-full bg-[#007aff] text-white">
              <Check className="size-3" />
            </span>
          )}
        </button>
      ))}
    </div>
  );
}
function GoalCard() {
  return (
    <section className="panel">
      <div className="section-title">
        <div>
          <p>המטרה החודשית</p>
          <span>קרן חופשה ביוון</span>
        </div>
        <b className="text-sm text-[#a65b00]">68%</b>
      </div>
      <div className="mt-5 flex items-center gap-4">
        <div
          className="grid size-20 shrink-0 place-items-center rounded-full"
          style={{ background: 'conic-gradient(#ff9500 68%,#f2f2f7 0)' }}
        >
          <div className="grid size-16 place-items-center rounded-full bg-white">
            <Target className="size-6 text-[#c76b00]" />
          </div>
        </div>
        <div>
          <p className="text-xl font-semibold">₪3,400</p>
          <p className="mt-1 text-xs text-[#6f7b77]">מתוך יעד של ₪5,000</p>
          <p className="mt-3 flex items-center gap-1 text-xs font-bold text-[#248a3d]">
            <ArrowUpLeft className="size-4" />
            נשארו ₪1,600
          </p>
        </div>
      </div>
    </section>
  );
}
function GoalRow({
  title,
  detail,
  pct,
}: {
  title: string;
  detail: string;
  pct: number;
}) {
  return (
    <div className="py-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <b className="text-sm">{title}</b>
          <p className="mt-1 text-xs text-[#75807c]">{detail}</p>
        </div>
        <b className="text-sm text-[#248a3d]">{pct}%</b>
      </div>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[#deded8]">
        <div
          className="h-full rounded-full bg-[#007aff]"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
function ActivityList({ activity }: { activity: Activity[] }) {
  return (
    <div className="mt-2 divide-y divide-[#e3e0d8]">
      {activity.map((item) => {
        const Icon =
          item.type === 'expense'
            ? Utensils
            : item.type === 'task'
              ? Check
              : item.type === 'habit'
                ? Flame
                : CircleDollarSign;
        return (
          <div key={item.id} className="flex items-center gap-3 py-4">
            <div className={`activity-icon ${item.type}`}>
              <Icon />
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{item.title}</p>
              <p className="mt-1 text-xs text-[#77827e]">{item.detail}</p>
            </div>
            <span className="text-xs font-semibold">{item.value}</span>
          </div>
        );
      })}
    </div>
  );
}
function SectionTitle({
  title,
  sub,
  action,
  onAction,
}: {
  title: string;
  sub: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="section-title">
      <div>
        <p>{title}</p>
        <span>{sub}</span>
      </div>
      {action && onAction && (
        <button onClick={onAction} className="link-button">
          {action}
          <ChevronLeft />
        </button>
      )}
    </div>
  );
}
function Quick({
  icon: Icon,
  title,
  sub,
  warm,
  onClick,
}: {
  icon: typeof ArrowDownLeft;
  title: string;
  sub: string;
  warm?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`quick ${warm ? 'bg-[#fff4e8]' : 'bg-[#edf5ff]'}`}
    >
      <span className={`quick-icon ${warm ? 'bg-[#ff9500]' : 'bg-[#007aff]'}`}>
        <Icon />
      </span>
      <span>
        <b>{title}</b>
        <small>{sub}</small>
      </span>
    </button>
  );
}
function Composer({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/20 p-0 backdrop-blur-[2px] sm:items-center sm:p-6">
      <dialog
        open
        aria-modal="true"
        aria-label={title}
        className="w-full rounded-t-[24px] bg-[#ffffff] p-5 shadow-2xl sm:max-w-md sm:rounded-[20px]"
      >
        <header className="mb-5 flex items-center justify-between">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            aria-label="סגירה"
            className="grid size-10 place-items-center rounded-xl text-[#63706b] hover:bg-[#e9e7df]"
          >
            <X className="size-5" />
          </button>
        </header>
        {children}
      </dialog>
    </div>
  );
}

function fieldText(form: FormData, name: string) {
  const value = form.get(name);
  return typeof value === 'string' ? value : '';
}
function Labeled({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-2 block text-sm font-bold">{label}</span>
      {children}
    </label>
  );
}
function EmptyState({
  title,
  text,
  action,
  onAction,
}: {
  title: string;
  text: string;
  action?: string;
  onAction?: () => void;
}) {
  return (
    <div className="py-12 text-center">
      <p className="font-bold">{title}</p>
      <p className="mx-auto mt-2 max-w-sm text-sm text-[#75807c]">{text}</p>
      {action && onAction && (
        <Button onClick={onAction} variant="outline" className="mt-5">
          {action}
        </Button>
      )}
    </div>
  );
}
