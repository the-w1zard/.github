import { useEffect } from '#sauron';

/**
============================ USAGE =====================================================================
* ```JSX
* import { useNavigate } from "@remix-run/react";
* import { useKeyboardShortcuts } from "~/components/midgardr";
* 
* export default function MyRoute() {
*   const navigate = useNavigate();
* 
*   const shortcutConfig = [
*     { 
*       key: 'h', 
*       action: () => navigate("/home") 
*     },
*     { 
*       key: 'n', 
*       action: () => console.log("Creating new item...") 
*     },
*     { 
*       key: 's', 
*       action: () => alert("Search opened!") 
*     }
*   ];
* 
*   useKeyboardShortcuts(shortcutConfig);
* 
*   return (
*     <div>
*       <h1>Dashboard</h1>
*       <p>Press <strong>H</strong> for Home, <strong>N</strong> for New, <strong>S</strong> for Search.</p>
*     </div>
*   );
* }
* ```
*                                                                                                 
 */


export function useKeyboardShortcuts(shortcuts) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      // 1. Check if Alt is pressed
      if (!event.altKey) return;

      // 2. Ignore if user is typing in a text field
      const isInput = ['INPUT', 'TEXTAREA'].includes(event.target.tagName) || event.target.isContentEditable;
      if (isInput) return;

      // 3. Match the key
      const shortcut = shortcuts.find(
        (s) => s.key.toLowerCase() === event.key.toLowerCase()
      );

      if (shortcut) {
        // 4. Prevent browser default Alt behaviors
        event.preventDefault(); 
        shortcut.action(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [shortcuts]); 
}
