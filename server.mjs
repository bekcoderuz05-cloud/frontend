import http from 'node:http';
import {readFile,stat} from 'node:fs/promises';
import {resolve,extname,dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
export function createApp({upstream=process.env.API_BASE_URL||'https://44-212-221-136.sslip.io',root=resolve(dirname(fileURLToPath(import.meta.url)),'dist')}={}){
 const base=new URL(upstream);if(!['https:','http:'].includes(base.protocol))throw new Error('API_BASE_URL http(s) bo‘lishi kerak');
 return http.createServer(async(req,res)=>{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','strict-origin-when-cross-origin');
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname==='/health'){res.writeHead(200,{'Content-Type':'application/json'});return res.end('{"ok":true}')}
   if(url.pathname.startsWith('/api/')){
    // Fixed upstream: browser cannot choose a proxy host or read local files.
    const path=url.pathname.slice(4);if(!/^\/(auth|users|chats|messages|markets|uploads|media)(\/|$)/.test(path)){res.writeHead(404);return res.end()}
    if(!['GET','POST','PUT','PATCH','DELETE'].includes(req.method)){res.writeHead(405);return res.end()}
    const chunks=[];let size=0;for await(const chunk of req){size+=chunk.length;if(size>10*1024*1024){res.writeHead(413);return res.end()}chunks.push(chunk)}
    const headers={};for(const key of ['content-type','authorization'])if(req.headers[key])headers[key]=req.headers[key];
    const remote=await fetch(base.origin+base.pathname.replace(/\/$/,'')+path+url.search,{method:req.method,headers,body:['GET','HEAD'].includes(req.method)?undefined:Buffer.concat(chunks),signal:AbortSignal.timeout(25000),redirect:'error'});
    res.writeHead(remote.status,{'Content-Type':remote.headers.get('content-type')||'application/json','Cache-Control':'no-store'});return res.end(Buffer.from(await remote.arrayBuffer()));
   }
   if(req.method!=='GET'&&req.method!=='HEAD'){res.writeHead(405);return res.end()}
   let file=resolve(root,'.'+decodeURIComponent(url.pathname));if(!file.startsWith(root+'/')&&file!==root){res.writeHead(403);return res.end()}
   try{if(!(await stat(file)).isFile())file=resolve(root,'index.html')}catch{if(extname(file)){res.writeHead(404);return res.end()}file=resolve(root,'index.html')}
   const data=await readFile(file);const types={'.html':'text/html; charset=utf-8','.js':'text/javascript','.css':'text/css','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webp':'image/webp'};
   res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream','Cache-Control':extname(file)==='.html'?'no-cache':'public, max-age=3600'});res.end(req.method==='HEAD'?undefined:data);
  }catch{if(!res.headersSent)res.writeHead(502,{'Content-Type':'application/json'});res.end(JSON.stringify({detail:'API bilan aloqa o‘rnatilmadi. Server sozlamalarini tekshiring.'}))}
 });
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))createApp().listen(Number(process.env.PORT||3000),process.env.HOST||'127.0.0.1',()=>console.log('Voha Mini App: http://'+(process.env.HOST||'127.0.0.1')+':'+(process.env.PORT||3000)));
