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
        this.role = 'GUEST';
        this.init();
    }

    init() {
        if (typeof supabase === 'undefined') {
            console.error("[Mwamini Core] FATAL: Supabase CDN script missing.");
            this.renderErrorState("CRITICAL: Database engine disconnected. Check CDN.");
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
                    params: { eventsPerSecond: 10 }
                }
            });
            console.log("[Mwamini Core] Supabase Engine Initialized.");
            this.attachAuthListeners();
        } catch (error) {
            console.error("[Mwamini Core] Initialization Failed:", error);
        }
    }

    attachAuthListeners() {
        this.supabase.auth.onAuthStateChange(async (event, session) => {
            this.session = session;
            this.user = session?.user || null;
            
            if (this.user) {
                await this.fetchUserRole();
            } else {
                this.role = 'GUEST';
            }
            
            if (event === 'SIGNED_OUT') {
                this.purgeLocalState();
                const currentPath = window.location.pathname;
                if (!currentPath.includes('login.html') && !currentPath.includes('index.html') && currentPath !== '/') {
                    window.location.replace('login.html');
                }
            }
        });
    }

    async fetchUserRole() {
        if (!this.user) return 'GUEST';
        try {
            const { data, error } = await this.supabase.from('profiles').select('role').eq('id', this.user.id).single();
            if (error && error.code !== 'PGRST116') throw error;
            this.role = data?.role ? data.role.toUpperCase() : 'OPERATOR'; 
            return this.role;
        } catch (error) {
            console.error("[Mwamini Core] Role fetch failed:", error);
            return 'GUEST';
        }
    }

    async getSecureSession() {
        const { data: { session }, error } = await this.supabase.auth.getSession();
        if (error) {
            console.error("[Mwamini Core] Session validation error:", error);
            return null;
        }
        if (session?.user) {
            this.user = session.user;
            await this.fetchUserRole();
        }
        return session;
    }

    purgeLocalState() {
        localStorage.removeItem('mwamini_app_state');
        sessionStorage.clear();
        this.user = null;
        this.session = null;
        this.role = 'GUEST';
    }

    renderErrorState(message) {
        const toast = document.createElement('div');
        toast.className = 'toast-notification active danger';
        toast.innerText = message || "CRITICAL: Secure connection to database failed.";
        document.body.appendChild(toast);
        setTimeout(() => toast.remove(), 5000);
    }
}

window.Mwamini = new MwaminiCore();
