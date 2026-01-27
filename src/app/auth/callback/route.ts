import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server"; // Your server-side client

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // "next" allows us to redirect the user to a specific page after login
  const next = searchParams.get("next") ?? "/onboarding"; 

  if (code) {
    const supabase = await createClient();
    
    // This line exchanges the temporary Google code for a permanent user session
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    
    if (!error) {
      // Success! Send them to the onboarding setup
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // If something went wrong, send them back to login with an error
  return NextResponse.redirect(`${origin}/login?error=auth-failed`);
}