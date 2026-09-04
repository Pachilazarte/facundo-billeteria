import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

// Helper for finding category based on keywords
async function findCategory(concepto: string) {
  const normalizedConcepto = concepto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  
  const { data: categorias, error } = await supabase.from('categorias').select('id, nombre, palabras_clave');
  
  if (error || !categorias) return null;

  for (const cat of categorias) {
    if (cat.palabras_clave && cat.palabras_clave.length > 0) {
      if (cat.palabras_clave.some((kw: string) => normalizedConcepto.includes(kw.toLowerCase()))) {
        return cat.id;
      }
    }
  }
  
  // Default to "Sin clasificar"
  const defaultCat = categorias.find(c => c.nombre === 'Sin clasificar');
  return defaultCat ? defaultCat.id : null;
}

async function findPaymentMethod(metodoNombre: string) {
  const { data, error } = await supabase
    .from('metodos_pago')
    .select('id')
    .ilike('nombre', metodoNombre)
    .single();
    
  if (error || !data) return null;
  return data.id;
}

export async function POST(request: Request) {
  try {
    // 1. Auth check
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.API_SECRET_TOKEN}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse body
    const body = await request.json();
    const { monto, concepto, metodo_pago, origen } = body;

    if (!monto || !concepto || !metodo_pago || !origen) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // 3. Find IDs
    const id_categoria = await findCategory(concepto);
    const id_metodo_pago = await findPaymentMethod(metodo_pago);

    // 4. Insert
    const { data, error } = await supabase.from('gastos').insert({
      monto: parseFloat(monto),
      concepto,
      id_categoria,
      id_metodo_pago,
      origen
    }).select();

    if (error) throw error;

    return NextResponse.json({ success: true, data }, { status: 201 });
  } catch (err: any) {
    console.error('Error in webhook:', err);
    return NextResponse.json({ error: 'Internal Server Error', details: err.message }, { status: 500 });
  }
}
