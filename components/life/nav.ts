import {Database,Flame,Home,ListTodo,Target,Timeline,WalletCards} from 'lucide-react';
export type View='today'|'finance'|'tasks'|'habits'|'goals'|'timeline'|'data';
export const navItems=[
  {id:'today' as View,label:'היום',icon:Home},
  {id:'finance' as View,label:'כספים',icon:WalletCards},
  {id:'tasks' as View,label:'משימות',icon:ListTodo},
  {id:'habits' as View,label:'הרגלים',icon:Flame},
  {id:'goals' as View,label:'מטרות',icon:Target},
  {id:'timeline' as View,label:'ציר הזמן',icon:Timeline},
];
export const dataNav={id:'data' as View,label:'הנתונים שלי',icon:Database};
export const viewTitles:Record<View,string>={today:'היום',finance:'הכספים שלי',tasks:'המשימות שלי',habits:'ההרגלים שלי',goals:'המטרות שלי',timeline:'ציר הזמן',data:'הנתונים שלי'};
