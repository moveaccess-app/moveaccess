import { NextResponse } from 'next/server';
import { createAdminSupabaseClient } from '@/lib/supabase/admin';

interface SignupBody {
  ownerName: string;
  academyName: string;
  email: string;
  password: string;
  phone?: string;
}

function validateInput(body: SignupBody): string | null {
  if (!body.ownerName || body.ownerName.trim().length < 2) {
    return 'Nome do responsável deve ter ao menos 2 caracteres';
  }
  if (!body.academyName || body.academyName.trim().length < 2) {
    return 'Nome da academia deve ter ao menos 2 caracteres';
  }
  if (!body.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
    return 'E-mail inválido';
  }
  if (!body.password || body.password.length < 6) {
    return 'Senha deve ter ao menos 6 caracteres';
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body: SignupBody = await req.json();

    const validationError = validateInput(body);
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 });
    }

    const supabase = createAdminSupabaseClient();

    // 1. Create auth user (triggers handle_new_user → profile auto-created)
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: body.email.trim().toLowerCase(),
      password: body.password,
      email_confirm: true,
      user_metadata: {
        user_type: 'staff',
        name: body.ownerName.trim(),
      },
    });

    if (authError || !authData.user) {
      const msg = authError?.message || 'Erro ao criar conta';
      const isDuplicate = msg.toLowerCase().includes('already') || msg.toLowerCase().includes('duplicate');
      return NextResponse.json(
        { error: isDuplicate ? 'Este e-mail já está cadastrado' : msg },
        { status: isDuplicate ? 409 : 400 }
      );
    }

    const userId = authData.user.id;

    // 2. Update profile with phone (if provided)
    if (body.phone) {
      await supabase.from('profiles').update({ phone: body.phone.trim() }).eq('id', userId);
    }

    // 3. Create academy
    const { data: academyData, error: academyError } = await supabase
      .from('academies')
      .insert({
        trade_name: body.academyName.trim(),
        email: body.email.trim().toLowerCase(),
        setup_completed: false,
        setup_step: 0,
      })
      .select('id')
      .single();

    if (academyError || !academyData) {
      // Rollback: delete auth user
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Erro ao criar academia. Tente novamente.' },
        { status: 500 }
      );
    }

    const academyId = academyData.id;

    // 4. Create default unit
    const { error: unitError } = await supabase.from('units').insert({
      academy_id: academyId,
      name: 'Unidade Principal',
      status: 'active',
    });

    if (unitError) {
      // Rollback
      await supabase.from('academies').delete().eq('id', academyId);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Erro ao criar unidade. Tente novamente.' },
        { status: 500 }
      );
    }

    // 5. Create academy membership
    const { error: membershipError } = await supabase.from('academy_memberships').insert({
      profile_id: userId,
      academy_id: academyId,
      is_primary: true,
    });

    if (membershipError) {
      await supabase.from('units').delete().eq('academy_id', academyId);
      await supabase.from('academies').delete().eq('id', academyId);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Erro ao vincular conta. Tente novamente.' },
        { status: 500 }
      );
    }

    // 6. Create staff profile (admin role)
    const { error: staffError } = await supabase.from('staff_profiles').insert({
      id: userId,
      role: 'admin',
      status: 'active',
    });

    if (staffError) {
      await supabase.from('academy_memberships').delete().eq('profile_id', userId);
      await supabase.from('units').delete().eq('academy_id', academyId);
      await supabase.from('academies').delete().eq('id', academyId);
      await supabase.auth.admin.deleteUser(userId);
      return NextResponse.json(
        { error: 'Erro ao configurar perfil. Tente novamente.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, academyId }, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro desconhecido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
