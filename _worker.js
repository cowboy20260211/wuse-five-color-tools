export default {
  async fetch(request, env, ctx) {
    return await handleEvent(request, env, ctx);
  }
};

async function saveToToolsSF(data, env) {
  let kv = null;
  if (env) {
    kv = env.WUSE_KV || env.wuse || env.KV;
  }
  if (!kv) {
    return { status: 'missing-config', detail: 'KV namespace not bound' };
  }
  try {
    let existing = null;
    try {
      existing = await kv.get('tools_sf');
    } catch (e) {
      existing = null;
    }
    let arr = [];
    if (existing) {
      try {
        arr = JSON.parse(existing);
        if (!Array.isArray(arr)) arr = [];
      } catch (e) {
        arr = [];
      }
    }
    arr.push(data);
    await kv.put('tools_sf', JSON.stringify(arr));
    return { status: 'success', count: arr.length, data: arr };
  } catch (err) {
    return { status: 'failed', detail: String(err) };
  }
}

async function readToolsSF(env) {
  let kv = null;
  if (env) {
    kv = env.WUSE_KV || env.wuse || env.KV;
  }
  if (!kv) {
    return { status: 'missing-config', detail: 'KV namespace not bound' };
  }
  try {
    const existing = await kv.get('tools_sf');
    let data = [];
    if (existing) {
      try {
        data = JSON.parse(existing);
        if (!Array.isArray(data)) data = [];
      } catch (e) {
        data = [];
      }
    }
    return { status: 'success', data: data };
  } catch (err) {
    return { status: 'failed', detail: String(err) };
  }
}

async function handleApiRequest(request, env) {
  const url = new URL(request.url);
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
  
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }
  
  if (url.pathname === '/api/save-prescription' && request.method === 'POST') {
    console.log('[五色工具] 收到保存处方请求');
    try {
      const data = await request.json();
      
      if (!data.name || !data.contact || !data.prescriptions) {
      return new Response(JSON.stringify({
        success: false,
        message: '缺少必要字段'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
      }
      
      const savedData = {
        name: data.name,
        contact: data.contact,
        prescriptions: data.prescriptions,
        savedAt: new Date().toISOString()
      };
      
      const result = await saveToToolsSF(savedData, env);
      
      return new Response(JSON.stringify({
        success: true,
        message: '保存成功',
        kv: result
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
      
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: '保存失败: ' + error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  
  if (url.pathname === '/api/read-prescriptions' && request.method === 'GET') {
    try {
      const result = await readToolsSF(env);
      return new Response(JSON.stringify({
        success: true,
        kv: result
      }), {
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        message: '获取失败: ' + error.message
      }), {
        status: 500,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }
  }
  
  return new Response('Not Found', { status: 404 });
}

async function handleEvent(request, env, ctx) {
  const url = new URL(request.url);
  
  if (url.pathname.startsWith('/api/')) {
    return handleApiRequest(request, env);
  }
  
  return env.ASSETS.fetch(request);
}
