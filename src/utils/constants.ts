export const KEY_PATH_REGEX = /(['"`])([^\s'"`\\](?:[^\s'"`\\]|\\.)*?)\1/;
export const DIAGNOSTIC_KEY_PATH_REGEX = /['"]([a-zA-Z0-9_-]+(?:\.[a-zA-Z0-9_-]+)+)['"]/g;
export const SUPPORTED_LANGUAGES = ['ts', 'js', 'html', 'typescript', 'javascript'];
export const DEBOUNCE_DELAY = 250; // milliseconds

export const DIAGNOSTIC_SEVERITY = {
    MISSING_KEY: {
        message: 'Missing translation key',
        severity: 'Warning'
    },
    UNUSED_KEY: {
        message: 'Unused translation key',
        severity: 'Information'
    },
    DUPLICATE_KEY: {
        message: 'Duplicate translation key',
        severity: 'Error'
    }
} as const;

export const DIAGNOSTIC_FIXES = {
    ADD_KEY: 'Add translation key',
    REMOVE_KEY: 'Remove unused key',
    RENAME_KEY: 'Rename key'
} as const;
