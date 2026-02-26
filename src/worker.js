"use strict";

async function saveToToolsSF(data, env) {
  const kv = env && env.WUSE_KV ? env.WUSE_KV : null;
  if (!kv) {
    return { status: 'missing-config', detail: 'KV namespace not bound' };
  }
  let existing = await kv.get('tools_sf', 'json');
  let arr = Array.isArray(existing) ? existing : [];
  arr.push(data);
  await kv.put('tools_sf', JSON.stringify(arr));
  return { status: 'success', count: arr.length, data: arr };
}

async function readToolsSF(env) {
  const kv = env && env.WUSE_KV ? env.WUSE_KV : null;
  if (!kv) {
    return { status: 'missing-config', detail: 'KV namespace not bound' };
  }
  const existing = await kv.get('tools_sf', 'json');
  const data = Array.isArray(existing) ? existing : [];
  return { status: 'success', data };
}

addEventListener('fetch', event => {
  event.respondWith(handleRequest(event.request, event));
});

async function handleRequest(request, event) {
  const env = (event && event.env) ? event.env : null;
  const url = new URL(request.url);
  
  if (request.method === 'POST' && url.pathname === '/api/save-prescription') {
    let data = {};
    try {
      data = await request.json();
    } catch (e) {
      data = {};
    }
    const result = await saveToToolsSF(data, env);
    return new Response(JSON.stringify({ success: true, kv: result }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  if (request.method === 'GET' && url.pathname === '/api/read-prescriptions') {
    const read = await readToolsSF(env);
    return new Response(JSON.stringify({ success: true, kv: read }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return new Response('五色工具工作者', { status: 200 });
}
