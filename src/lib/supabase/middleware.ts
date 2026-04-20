import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that require an authenticated student session.
// Unauthenticated visitors are redirected to the student login page
// with a ?next= parameter so they return after logging in.
const STUDENT_PROTECTED_PREFIXES = ['/cadastro/continuar', '/aluno'];
const STUDENT_PUBLIC_PATHS = ['/aluno/login'];

function isStudentProtectedRoute(pathname: string): boolean {
  // Allow explicit public paths (login page)
  if (STUDENT_PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return false;
  }

  return STUDENT_PROTECTED_PREFIXES.some((p) => pathname.startsWith(p));
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session if expired
  const { data: { user } } = await supabase.auth.getUser();

  // Server-side guard: redirect unauthenticated users away from
  // student-protected routes. The client-side guard (useAuth) still
  // runs for role-level checks, but this prevents flashes of
  // protected UI and ensures the guard can't be bypassed by
  // disabling JavaScript.
  const { pathname } = request.nextUrl;

  if (isStudentProtectedRoute(pathname) && !user) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = '/aluno/login';
    loginUrl.searchParams.set('next', pathname + request.nextUrl.search);
    return NextResponse.redirect(loginUrl);
  }

  return supabaseResponse;
}
