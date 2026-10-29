import {test,expect} from '@playwright/test';
test('Telegram login sends signed init data and uses the returned Voha account',async({page})=>{
 await page.route('https://telegram.org/**',r=>r.abort());
 await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'signed-test-init-data',initDataUnsafe:{user:{id:999,first_name:'Untrusted'}},ready(){},expand(){},onEvent(){},BackButton:{show(){},hide(){},onClick(){},offClick(){}}}}});
 await page.route('**/api/markets/**',r=>r.fulfill({json:[]}));
 let logins=0;await page.route('**/api/auth/telegram',r=>{logins++;expect(r.request().postDataJSON()).toEqual({init_data:'signed-test-init-data'});return r.fulfill({json:{access_token:'server-access',refresh_token:'server-refresh',user:{id:42,first_name:'Verified',last_name:'User',phone:'tg:999'}}})});
 await page.goto('http://127.0.0.1:3000');await expect.poll(()=>logins).toBe(1);
 await page.getByRole('button',{name:'Profil',exact:true}).click();await expect(page.getByRole('heading',{name:'Verified User'})).toBeVisible();await expect(page.getByText('Telegram akkaunti',{exact:true})).toBeVisible();await expect(page.getByText('Untrusted',{exact:true})).toHaveCount(0);
});
test('Rejected Telegram signature does not log in',async({page})=>{
 await page.route('https://telegram.org/**',r=>r.abort());await page.addInitScript(()=>{window.Telegram={WebApp:{initData:'forged-data',ready(){},expand(){},onEvent(){},BackButton:{show(){},hide(){},onClick(){},offClick(){}}}}});
 await page.route('**/api/markets/**',r=>r.fulfill({json:[]}));await page.route('**/api/auth/telegram',r=>r.fulfill({status:401,json:{detail:'Telegram tasdiqlashi yaroqsiz'}}));
 await page.goto('http://127.0.0.1:3000');await expect(page.getByRole('alert')).toContainText('Telegram tasdiqlashi yaroqsiz');expect(await page.evaluate(()=>sessionStorage.getItem('voha.session'))).toBeNull();
});
