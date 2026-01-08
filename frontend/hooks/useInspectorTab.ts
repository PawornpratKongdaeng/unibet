// hooks/useInspectorTab.ts (หรือใส่ในไฟล์เดิม)
import { useEffect } from "react";

export const useInspectorTab = () => {
  useEffect(() => {
    (window as any).switchInspectorTab = (type: 'fin' | 'bet') => {
      const tabs = { fin: 't-fin', bet: 't-bet' };
      const boxes = { fin: 'box-fin', bet: 'box-bet' };

      Object.entries(tabs).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) key === type ? el.classList.add('active') : el.classList.remove('active');
      });

      Object.entries(boxes).forEach(([key, id]) => {
        const el = document.getElementById(id);
        if (el) el.style.display = key === type ? 'block' : 'none';
      });
    };
    return () => { delete (window as any).switchInspectorTab; };
  }, []);
};