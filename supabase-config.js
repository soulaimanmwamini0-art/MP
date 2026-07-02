/**
 * mwamini-supabase-core.js
 * Enterprise Supabase Configuration & Core State Manager
 */

const SUPABASE_URL = "https://qvnjxewqssmyngmldbmb.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2bmp4ZXdxc3NteW5nbWxkYm1iIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODI5NzE2MDMsImV4cCI6MjA5ODU0NzYwM30.iYksjZqc-wybyUAVeph8gZvHQdvLCZiwj1IPV8nRma0";

class MwaminiCore {
    constructor() {
        this.supabase = null;
        this.session = null;
        this.user = null;
        this.init();
    }

    init() {
        if (typeof supabase === 'undefined') {
            console.error("[Mwamini Core] FATAL: Supabase CDN script missing.");
            this.renderErrorState();
            return;
        }

        try {
            this.supabase = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
                auth: {
                    persistSession: true,
                    autoRefreshToken: true,
                    detectSessionInUrl: true
                },
                realtime: {
                    params: { eventsPerSecond: 10 } // Optimized for chat/telemetry
                }
            });
            console.log("[Mwamini Core] Supabase Engine Initialized.");
            this.attachAuthListeners();
        } catch (error) {
            console.error("[Mwamini Core] Initialization Failed:", error);
        }
    }

    attachAuthListeners() {
        this.supabase.auth.onAuthStateChange((event, session) => {
            this.session = session;
            this.user = session?.user || null;
            
            if (event === 'SIGNED_OUT') {
                this.purgeLocalState();
                if (!window.location.pathname.includes('login.html') && !window.location.pathname.includes('index.html')) {
                    window.location.replace('login.html');
                }
            }
        });
    }

    async getSecureSession() {
        const { data: { session }, error } = await this.supabase.auth.getSession();
        if (error) {
            console.error("[Mwamini Core] Session validation error:", error);
            return null;
        }
        return session;
    }

    purgeLocalState() {
        localStorage.removeItem('mwamini_app_state');
        sessionStorage.clear();
    }

    renderErrorState() {
        const toast = document.createElement('div');
        toast.className = 'toast-notification active danger';
        toast.innerText = "CRITICAL: Secure connection to database failed.";
        document.body.appendChild(toast);
    }
}

// Global Singleton Instance
window.Mwamini = new MwaminiCore();