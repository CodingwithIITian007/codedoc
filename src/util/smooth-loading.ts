import { funcTransport, onReady } from '@connectv/sdh/transport';

import { polyfillCustomEvent } from './custom-event';


function navigate(url: string, push=true) {
  const container = document.getElementById('-codedoc-container') as HTMLElement;

  if (container) {
    if (window.innerWidth <= 1200 && (window as any).codedocToggleToC)
      (window as any).codedocToggleToC(false);

    if (push && location.pathname === url) return;

    container.style.opacity = '0';
    if (push) history.pushState(url, '', url);
    window.dispatchEvent(new CustomEvent('navigation-start', { detail: { url } }));
    fetch(url)
    .then(response => response.text())
    .then(html => {
      const parser = new DOMParser();
      const dom = parser.parseFromString(html, 'text/html');

      const title = document.head.querySelector('title');
      if (title) title.innerHTML = dom.head.querySelector('title')?.innerHTML || title.innerHTML;

      setTimeout(() => {
        container.innerHTML = dom.getElementById('-codedoc-container')?.innerHTML || '';
        container.querySelectorAll('script').forEach(s => eval(s.textContent || ''));
  
        setTimeout(() => container.style.opacity = '1', 10);
        window.dispatchEvent(new CustomEvent('navigation', { detail: { url } }));
      }, 150);
    });
  }
  else window.location.href = url;
}


export function smoothLoading() {
  polyfillCustomEvent();
  onReady(() => {
    if (!(window as any).__smooth_loading_plugged) {
      (window as any).__smooth_loading_plugged = true;
      document.addEventListener('click', event => {
        let target = event.target as HTMLElement;
      
        while (target && !(target as any).href) {
          target = target.parentNode as HTMLElement;
        }
      
        if (target && target.getAttribute('href')?.startsWith('/')) {
          const url = target.getAttribute('href') || '';
          event.preventDefault();
          navigate(url);
          return;
        }
      });

      const isSafari = /^((?!chrome|android).)*safari/i.test(navigator.userAgent);
      window.addEventListener('popstate', event => {
        if (isSafari) window.location.href = event.state || '/';
        else navigate(event.state || '/', false);
      });
    }
  });
}

export const smoothLoading$ = funcTransport(smoothLoading);
