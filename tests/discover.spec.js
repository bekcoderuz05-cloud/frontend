import {test,expect} from '@playwright/test';
const stores=[{id:7,name:'Zor market',products_count:0},{id:5,name:'Bs market',products_count:2}];
const product={id:10,name:'Bodring',price:'8000.00',unit:'kg',stock:10,is_active:true};
test.beforeEach(async({page})=>{
 await page.route('https://telegram.org/**',r=>r.abort());
 await page.route('**/api/markets/**',r=>{const path=new URL(r.request().url()).pathname;return r.fulfill({json:path.endsWith('/nearby')?stores:path.endsWith('/5')?{...stores[1],products:[product,{...product,id:11,name:'Pomidor',price:'12000.00'}]}:{...stores[0],products:[]}})});
});
test('Android layout, live catalogue search, store opening and education',async({page})=>{
 await page.setViewportSize({width:360,height:800});await page.goto('http://127.0.0.1:3000');
 await expect(page.getByRole('heading',{name:'VohaOne'})).toBeVisible();
 await expect(page.getByRole('button',{name:'Bodring, Bs market'})).toBeVisible();
 await expect(page.getByText("8 000 so'm")).toBeVisible();
 expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
 await page.screenshot({path:'test-results/discover-mobile.png',fullPage:true});
 await page.getByRole('textbox',{name:'Mahsulot yoki xizmat qidiring'}).fill('Pomidor');
 await expect(page.getByRole('button',{name:'Bodring, Bs market'})).toHaveCount(0);
 await expect(page.getByRole('button',{name:'Pomidor, Bs market'})).toBeVisible();
 await page.getByRole('button',{name:'Pomidor, Bs market'}).click();
 await expect(page.getByRole('heading',{name:'Bs market'})).toBeVisible();
 await page.getByRole('button',{name:'Orqaga',exact:true}).click();
 await page.getByRole('button',{name:'Ta’lim',exact:true}).click();
 await expect(page.getByRole('heading',{name:'Har kuni yangi so‘z.'})).toBeVisible();
});
test('API errors can be retried',async({page})=>{
 let fail=true;await page.route('**/api/markets/nearby?**',r=>r.fulfill(fail?{status:503,json:{detail:'Test API xatosi'}}:{json:stores}));
 await page.goto('http://127.0.0.1:3000');await expect(page.getByRole('alert')).toContainText('Test API xatosi');
 fail=false;await page.getByRole('button',{name:'Qayta urinish',exact:true}).click();await expect(page.getByRole('button',{name:'Bodring, Bs market'})).toBeVisible();
});
test('location coordinates reach the nearby API',async({page,context})=>{
 await context.grantPermissions(['geolocation']);await context.setGeolocation({latitude:41.31,longitude:69.28});
 await page.goto('http://127.0.0.1:3000');const request=page.waitForRequest(r=>r.url().includes('/markets/nearby?')&&r.url().includes('latitude=41.31'));
 await page.getByRole('button',{name:'Joylashuvni aniqlash'}).click();await request;await expect(page.getByText('41.310°, 69.280°')).toBeVisible();
});
