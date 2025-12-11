export const isDevMode = (): boolean => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('devMode') === 'true';
};

export const setDevMode = (enabled: boolean): void => {
    if (typeof window === 'undefined') return;
    localStorage.setItem('devMode', enabled ? 'true' : 'false');
    window.dispatchEvent(new CustomEvent('devModeChanged', { detail: enabled }));
};

export const toggleDevMode = (): boolean => {
    const current = isDevMode();
    setDevMode(!current);
    return !current;
};

