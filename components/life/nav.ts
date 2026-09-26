import {Database,Flame,WalletCards} from 'lucide-react';
export type View='habits'|'finance'|'data';
export const navItems=[
  {id:'habits' as View,label:'הרגלים',icon:Flame},
  {id:'finance' as View,label:'כספים',icon:WalletCards},
];
export const dataNav={id:'data' as View,label:'הנתונים שלי',icon:Database};
export const viewTitles:Record<View,string>={habits:'ההרגלים שלי',finance:'הכספים שלי',data:'הנתונים שלי'};
