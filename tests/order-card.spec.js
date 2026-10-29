import {test,expect} from '@playwright/test';
const order={id:81,status:'pending',payment_method:'debt',total_amount:'36000.00',customer:{id:2,first_name:'Asadbek',last_name:'Valiyev'},items:[{id:1,product_name:'Bodring',quantity:3},{id:2,product_name:'Pomidor',quantity:1}]};
async function setup(page,{mine=false,fail=false,status='pending'}={}){
 await page.route('https://telegram.org/**',r=>r.abort());
 await page.addInitScript(()=>sessionStorage.setItem('voha.session',JSON.stringify({access_token:'test-access',refresh_token:'test-refresh',user:{id:1,first_name:'Owner',last_name:'Test',phone:'+998900000000'}})));
 await page.route('**/api/markets/nearby?**',r=>r.fulfill({json:[]}));
 await page.route('**/api/chats',r=>r.fulfill({json:[{id:10,name:'Buyurtmalar',peer:{id:2}}]}));
 await page.route('**/api/chats/10/messages?**',r=>r.fulfill({json:{messages:[{id:41,sender:{id:mine?1:2},message_type:'market_order',market_order:{...order,status},created_at:'2026-10-29T10:30:00Z',is_read:true},{id:42,sender:{id:2},text:'Salom',message_type:'text',created_at:'2026-10-29T10:31:00Z'}],has_more:false}}));
 await page.route('**/api/markets/me/orders/81',async r=>{expect(r.request().method()).toBe('PATCH');await new Promise(resolve=>setTimeout(resolve,150));await r.fulfill(fail?{status:409,json:{detail:'Omborda mahsulot yetarli emas'}}:{json:{...order,status:r.request().postDataJSON().status}})});
 await page.goto('http://127.0.0.1:3000');await page.getByRole('button',{name:'Chats',exact:true}).click();await page.getByRole('button',{name:'Buyurtmalar'}).click();
}
test('incoming Android order card and confirm action survive a stale poll',async({page})=>{
 await page.setViewportSize({width:360,height:800});await setup(page);const card=page.getByRole('article',{name:'Buyurtma №81'});
 await expect(card).toContainText('3 x Bodring');await expect(card).toContainText('To‘lov turi: Qarzga');await expect(card).toContainText('Umumiy narx: 36 000 so‘m');await expect(card).toContainText('Asadbek Valiyev');await expect(page.getByText('Salom',{exact:true})).toBeVisible();
 await page.screenshot({path:'test-results/order-card.png',fullPage:true});
 await card.getByRole('button',{name:'Tasdiqlash',exact:true}).click();await expect(card.getByRole('button',{name:'Bekor qilish'})).toBeDisabled();await expect(card).toContainText('Buyurtma tasdiqlandi');await expect(card.getByRole('button')).toHaveCount(0);
 await page.waitForTimeout(6200);await expect(card).toContainText('Buyurtma tasdiqlandi');expect(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth)).toBe(true);
});
test('seller can cancel',async({page})=>{await setup(page);const card=page.getByRole('article',{name:'Buyurtma №81'});await card.getByRole('button',{name:'Bekor qilish'}).click();await expect(card).toContainText('Buyurtma bekor qilindi');await expect(card.getByRole('button')).toHaveCount(0)});
test('failed update retains pending order and displays API error',async({page})=>{await setup(page,{fail:true});const card=page.getByRole('article',{name:'Buyurtma №81'});await card.getByRole('button',{name:'Tasdiqlash',exact:true}).click();await expect(card.getByRole('alert')).toContainText('Omborda mahsulot yetarli emas');await expect(card.getByRole('button',{name:'Tasdiqlash',exact:true})).toBeEnabled();await expect(card).toContainText('Yangi buyurtma')});
test('customer and terminal orders have no seller actions',async({page})=>{await setup(page,{mine:true});const card=page.getByRole('article',{name:'Buyurtma №81'});await expect(card).toHaveClass(/mine/);await expect(card.getByRole('button')).toHaveCount(0)});
