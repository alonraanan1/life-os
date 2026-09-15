import {Database,Flame,WalletCards} from 'lucide-react';
export type View='today'|'finance'|'tasks'|'habits'|'sleep'|'goals'|'timeline'|'data';
export const navItems=[
  {id:'habits' as View,label:'הרגלים',icon:Flame},
  {id:'finance' as View,label:'כספים',icon:WalletCards},
];
export const dataNav={id:'data' as View,label:'הנתונים שלי',icon:Database};
export const viewTitles:Record<View,string>={today:'ההרגלים שלי',finance:'הכספים שלי',tasks:'ההרגלים שלי',habits:'ההרגלים שלי',sleep:'ההרגלים שלי',goals:'ההרגלים שלי',timeline:'ההרגלים שלי',data:'הנתונים שלי'};
