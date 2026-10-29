// Telegram ma'lumotlari faqat ko'rinish uchun. Voha identifikatsiyasi OTP bilan amalga oshadi.
declare global { interface Window { Telegram?: {WebApp:any} } }
export const tg=window.Telegram?.WebApp;
export function initTelegram(){
 if(!tg)return;tg.ready();tg.expand();
 const sync=()=>{document.documentElement.dataset.theme=tg.colorScheme;const p=tg.themeParams||{};for(const [key,value] of Object.entries(p))document.documentElement.style.setProperty('--tg-theme-'+key.replaceAll('_','-'),String(value));document.documentElement.style.setProperty('--safe-top',Math.max(tg.safeAreaInset?.top||0,tg.contentSafeAreaInset?.top||0)+'px');document.documentElement.style.setProperty('--safe-bottom',Math.max(tg.safeAreaInset?.bottom||0,tg.contentSafeAreaInset?.bottom||0)+'px')};
 sync();tg.onEvent('themeChanged',sync);tg.onEvent('safeAreaChanged',sync);tg.onEvent('contentSafeAreaChanged',sync);
}
export function haptic(){tg?.HapticFeedback?.selectionChanged()}
