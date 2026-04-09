import { supabase } from '@/lib/supabase';

export async function POST(req) {
  try {
    const formData = await req.formData();

    const file = formData.get('file');
    const product_name = formData.get('product_name');

    if (!file) {
      return Response.json({ error: 'Arquivo obrigatório' }, { status: 400 });
    }

    // 📤 Upload para Supabase Storage
    const fileName = `${Date.now()}-${file.name}`;

    const { error: uploadError } = await supabase.storage
      .from('sds')
      .upload(fileName, file);

    if (uploadError) {
      return Response.json({ error: uploadError.message }, { status: 500 });
    }

    const { data: publicUrl } = supabase.storage
      .from('sds')
      .getPublicUrl(fileName);

    // 💾 Salvar no banco
    const { data, error } = await supabase
      .from('jobs')
      .insert([
        {
          product_name: product_name || 'Sem nome',
          file_name: fileName,
          pdf_url: publicUrl.publicUrl,
          status: 'pending',
        },
      ])
      .select();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, job: data });

  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
}
