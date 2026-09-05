import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { Language, translations, translateText } from '../services/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, defaultVal?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Track original English text node and attribute values across the lifetime of DOM nodes
const originalTextMap = new WeakMap<Node, string>();
const originalAttrMap = new WeakMap<Element, { placeholder?: string; title?: string }>();

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('novaax_lang');
    return (saved === 'hi' || saved === 'mr' || saved === 'en') ? saved : 'en';
  });

  const isTranslatingRef = useRef(false);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('novaax_lang', lang);
  };

  const t = (key: string, defaultVal?: string): string => {
    if (!key) return '';
    if (language === 'en') {
      return translations.en[key] || defaultVal || key;
    }
    // Check direct dictionary first
    if (translations[language]?.[key]) {
      return translations[language][key];
    }
    // Universal text translator fallback
    return translateText(key, language) || defaultVal || key;
  };

  // Global DOM Text Auto-Translator Effect
  useEffect(() => {
    const currentLang = language;
    const rootEl = document.getElementById('root') || document.body;
    if (!rootEl) return;

    const translateDOM = () => {
      if (isTranslatingRef.current) return;
      isTranslatingRef.current = true;

      try {
        const walker = document.createTreeWalker(
          rootEl,
          NodeFilter.SHOW_TEXT,
          {
            acceptNode(node) {
              const parent = node.parentElement;
              if (!parent) return NodeFilter.FILTER_REJECT;
              const tag = parent.tagName.toLowerCase();
              if (
                tag === 'script' ||
                tag === 'style' ||
                tag === 'textarea' ||
                tag === 'code' ||
                tag === 'pre'
              ) {
                return NodeFilter.FILTER_REJECT;
              }
              if (parent.closest('[data-no-translate]')) {
                return NodeFilter.FILTER_REJECT;
              }
              return NodeFilter.FILTER_ACCEPT;
            }
          }
        );

        let currentNode = walker.nextNode();
        while (currentNode) {
          const textNode = currentNode as Text;
          const currentVal = textNode.nodeValue || '';
          const trimmed = currentVal.trim();

          if (trimmed && /[a-zA-Z]/.test(trimmed)) {
            // First time seeing this text node in English? Cache its original English string
            if (!originalTextMap.has(textNode)) {
              originalTextMap.set(textNode, currentVal);
            }

            const origText = originalTextMap.get(textNode) || currentVal;

            if (currentLang === 'en') {
              if (textNode.nodeValue !== origText) {
                textNode.nodeValue = origText;
              }
            } else {
              const translated = translateText(origText, currentLang);
              if (translated && translated !== textNode.nodeValue) {
                textNode.nodeValue = translated;
              }
            }
          } else if (currentLang === 'en' && originalTextMap.has(textNode)) {
            const origText = originalTextMap.get(textNode)!;
            if (textNode.nodeValue !== origText) {
              textNode.nodeValue = origText;
            }
          }

          currentNode = walker.nextNode();
        }

        // Also translate placeholders & button/link titles
        const inputsAndBtns = rootEl.querySelectorAll<HTMLElement>(
          'input[placeholder], textarea[placeholder], button[title], a[title], [title]'
        );

        inputsAndBtns.forEach((el) => {
          if (el.closest('[data-no-translate]')) return;

          if (el.hasAttribute('placeholder')) {
            const ph = el.getAttribute('placeholder') || '';
            if (ph && /[a-zA-Z]/.test(ph)) {
              if (!originalAttrMap.has(el)) originalAttrMap.set(el, {});
              const attrs = originalAttrMap.get(el)!;
              if (!attrs.placeholder) attrs.placeholder = ph;

              if (currentLang === 'en') {
                el.setAttribute('placeholder', attrs.placeholder);
              } else {
                el.setAttribute('placeholder', translateText(attrs.placeholder, currentLang));
              }
            }
          }

          if (el.hasAttribute('title')) {
            const title = el.getAttribute('title') || '';
            if (title && /[a-zA-Z]/.test(title)) {
              if (!originalAttrMap.has(el)) originalAttrMap.set(el, {});
              const attrs = originalAttrMap.get(el)!;
              if (!attrs.title) attrs.title = title;

              if (currentLang === 'en') {
                el.setAttribute('title', attrs.title);
              } else {
                el.setAttribute('title', translateText(attrs.title, currentLang));
              }
            }
          }
        });
      } finally {
        isTranslatingRef.current = false;
      }
    };

    // Execute immediately on language change
    translateDOM();

    // Observe DOM mutations so dynamic content, routing, or data loading are translated automatically
    let timeoutId: number | null = null;
    const observer = new MutationObserver(() => {
      if (isTranslatingRef.current) return;
      if (timeoutId) window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        translateDOM();
      }, 50);
    });

    observer.observe(rootEl, {
      childList: true,
      subtree: true,
      characterData: true
    });

    return () => {
      observer.disconnect();
      if (timeoutId) window.clearTimeout(timeoutId);
    };
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
