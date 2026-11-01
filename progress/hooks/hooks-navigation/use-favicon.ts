import { useEffect } from "#sauron";

export function useFavicon(href: string) {
  useEffect(() => {
    if (!href) return;
    
    let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    
    link.href = href;
  }, [href]);
}
