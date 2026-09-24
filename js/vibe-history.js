/**
 * THE VIBE CHECK PROJECT — Card History & Persistence Engine
 * Manages client-side storage of sent affirmation cards with auto-pruning,
 * read-receipt verification via VibeCounter (core-utils.js), and telemetry integration.
 * Zero external accounts or databases required — strictly client-side.
 */

(function (window) {
    'use strict';

    const STORAGE_KEY = 'vibe_sent_cards_v1';
    const MAX_CARDS = 50;
    const OPEN_COUNTER_PREFIX = 'open:'; // read receipts live in VibeCounter (core-utils.js)

    // Theme metadata mapping for badges, styling, and categorization
    const THEME_METAS = {
        birthday: { label: 'Birthday', emoji: '🎂', gradient: 'linear-gradient(135deg, #f59e0b, #ec4899)', color: '#f59e0b' },
        anxiety: { label: 'Calm & Safe', emoji: '🩹', gradient: 'linear-gradient(135deg, #38bdf8, #818cf8)', color: '#38bdf8' },
        celebrate: { label: 'Proud Of You', emoji: '🌟', gradient: 'linear-gradient(135deg, #fbbf24, #f43f5e)', color: '#fbbf24' },
        love: { label: 'Gratitude', emoji: '💌', gradient: 'linear-gradient(135deg, #f472b6, #fb7185)', color: '#f472b6' },
        uplift: { label: 'Just Because', emoji: '✨', gradient: 'linear-gradient(135deg, #a78bfa, #c084fc)', color: '#a78bfa' },
        healing: { label: 'Healing', emoji: '🌿', gradient: 'linear-gradient(135deg, #34d399, #10b981)', color: '#34d399' },
        default: { label: 'Vibe Check', emoji: '✨', gradient: 'linear-gradient(135deg, #ff6b9d, #fec84a)', color: '#ff6b9d' }
    };

    /**
     * Safe localStorage wrapper that gracefully tolerates Private Browsing / Quota restrictions
     * with an in-memory fallback cache.
     */
    const StorageSafe = {
        _inMemoryCards: null,
        isAvailable() {
            try {
                const test = '__vibe_test__';
                window.localStorage.setItem(test, test);
                window.localStorage.removeItem(test);
                return true;
            } catch (e) {
                return false;
            }
        },
        read() {
            if (!this.isAvailable()) {
                return Array.isArray(this._inMemoryCards) ? this._inMemoryCards : [];
            }
            try {
                const data = window.localStorage.getItem(STORAGE_KEY);
                if (!data) return Array.isArray(this._inMemoryCards) ? this._inMemoryCards : [];
                const parsed = JSON.parse(data);
                const result = Array.isArray(parsed) ? parsed : [];
                this._inMemoryCards = result;
                return result;
            } catch (e) {
                console.warn('VibeHistory: Failed to parse stored cards, using in-memory cache', e);
                return Array.isArray(this._inMemoryCards) ? this._inMemoryCards : [];
            }
        },
        write(cards) {
            const trimmed = Array.isArray(cards) ? cards.slice(0, MAX_CARDS) : [];
            this._inMemoryCards = trimmed;
            if (!this.isAvailable()) return true;
            try {
                window.localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
                return true;
            } catch (e) {
                console.warn('VibeHistory: Failed to save cards to storage (quota exceeded), retained in-memory', e);
                return true;
            }
        },
        getItem(key) {
            try {
                return window.localStorage.getItem(key);
            } catch (e) {
                return null;
            }
        },
        setItem(key, val) {
            try {
                window.localStorage.setItem(key, val);
                return true;
            } catch (e) {
                return false;
            }
        },
        removeItem(key) {
            try {
                window.localStorage.removeItem(key);
                return true;
            } catch (e) {
                return false;
            }
        }
    };

    /**
     * VibeHistory Public API
     */
    const VibeHistory = {
        /**
         * Generate a collision-resistant unique card identifier.
         */
        generateId() {
            return 'vibe_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 8);
        },

        /**
         * Retrieve all saved cards, sorted newest first.
         */
        getAll() {
            const cards = StorageSafe.read();
            return cards.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
        },

        /**
         * Retrieve a single card by its ID.
         */
        get(id) {
            if (!id) return null;
            const cards = this.getAll();
            return cards.find(c => c.id === id) || null;
        },

        /**
         * Save a card record to history.
         * Schema: { id, recipient, affirmation, theme, sound, message, shareUrl, createdAt, opened }
         */
        save(card) {
            if (!card) return null;

            const record = {
                id: card.id || this.generateId(),
                recipient: (card.recipient || card.recipientName || 'Someone special').trim(),
                sender: (card.sender || card.senderName || '').trim(),
                affirmation: (card.affirmation || '').trim(),
                theme: (card.theme || card.themeGroup || 'default').toLowerCase(),
                sound: card.sound || 'chime',
                message: (card.message || card.personalMessage || '').trim(),
                shareUrl: card.shareUrl || '',
                createdAt: card.createdAt || new Date().toISOString(),
                opened: Boolean(card.opened)
            };

            const cards = StorageSafe.read();
            // Prevent duplicate entries by ID
            const existingIndex = cards.findIndex(c => c.id === record.id);
            if (existingIndex >= 0) {
                cards[existingIndex] = { ...cards[existingIndex], ...record };
            } else {
                cards.unshift(record);
            }

            StorageSafe.write(cards);

            if (window.VibeTelemetry) {
                window.VibeTelemetry.track('history_card_saved', {
                    theme: record.theme,
                    hasMessage: Boolean(record.message)
                });
                window.VibeTelemetry.setTag('saved_vibes_count', String(cards.length));
            }

            // Dispatch a local storage event so multi-tab UI stays synchronized
            try {
                window.dispatchEvent(new CustomEvent('vibe:history-updated', { detail: { card: record } }));
            } catch (e) { }

            return record;
        },

        /**
         * Delete a card from history by ID.
         */
        delete(id) {
            if (!id) return false;
            let cards = StorageSafe.read();
            const initialLen = cards.length;
            cards = cards.filter(c => c.id !== id);
            if (cards.length !== initialLen) {
                StorageSafe.write(cards);
                if (window.VibeTelemetry) {
                    window.VibeTelemetry.track('history_card_deleted', { cardId: id });
                }
                try {
                    window.dispatchEvent(new CustomEvent('vibe:history-updated', { detail: { deletedId: id } }));
                } catch (e) { }
                return true;
            }
            return false;
        },

        /**
         * Clear all stored history.
         */
        clear() {
            StorageSafe.write([]);
            if (window.VibeTelemetry) {
                window.VibeTelemetry.track('history_cleared');
            }
            try {
                window.dispatchEvent(new CustomEvent('vibe:history-updated', { detail: { cleared: true } }));
            } catch (e) { }
            return true;
        },

        /**
         * Mark a card as opened locally.
         */
        markOpened(id) {
            if (!id) return false;
            const cards = StorageSafe.read();
            const item = cards.find(c => c.id === id);
            if (item && !item.opened) {
                item.opened = true;
                StorageSafe.write(cards);
                if (window.VibeTelemetry) {
                    window.VibeTelemetry.track('history_card_opened', { cardId: id });
                }
                try {
                    window.dispatchEvent(new CustomEvent('vibe:history-updated', { detail: { card: item } }));
                } catch (e) { }
                return true;
            }
            return false;
        },

        /**
         * Ping read receipt endpoint when a recipient views a card.
         * Safe fire-and-forget beacon.
         */
        beaconOpen(id) {
            if (!id || !window.VibeCounter) return;
            window.VibeCounter.hit(OPEN_COUNTER_PREFIX + id);
        },

        /**
         * Check and sync read receipts for any cards still marked unopened.
         * Resolves with true if any cards were newly marked as opened.
         */
        async syncReadReceipts(onCardUpdated) {
            const cards = StorageSafe.read();
            const unopened = cards.filter(c => !c.opened && c.id).slice(0, 25);
            if (unopened.length === 0 || !window.VibeCounter) return false;

            // One batched request; resolves null if the counter service is disabled/unreachable
            const counts = await window.VibeCounter.getMany(unopened.map(c => OPEN_COUNTER_PREFIX + c.id));
            if (!counts) return false;

            let updatedAny = false;
            unopened.forEach(card => {
                if ((counts[window.VibeCounter._name(OPEN_COUNTER_PREFIX + card.id)] || 0) > 0) {
                    card.opened = true;
                    updatedAny = true;
                    if (typeof onCardUpdated === 'function') onCardUpdated(card);
                }
            });

            if (updatedAny) {
                StorageSafe.write(cards);
                try {
                    window.dispatchEvent(new CustomEvent('vibe:history-updated', { detail: { synced: true } }));
                } catch (e) { }
            }

            return updatedAny;
        },

        /**
         * Metadata getter for themes.
         */
        getThemeMeta(themeKey) {
            const key = (themeKey || 'default').toLowerCase();
            return THEME_METAS[key] || THEME_METAS.default;
        },

        /**
         * Human-friendly relative timestamp formatter.
         */
        formatRelativeTime(isoString) {
            if (!isoString) return 'Recently';
            try {
                const date = new Date(isoString);
                const now = new Date();
                const diffMs = now - date;
                const diffSec = Math.floor(diffMs / 1000);
                const diffMin = Math.floor(diffSec / 60);
                const diffHr = Math.floor(diffMin / 60);
                const diffDays = Math.floor(diffHr / 24);

                if (diffSec < 45) return 'Just now';
                if (diffMin < 60) return `${diffMin}m ago`;
                if (diffHr < 24) return `${diffHr}h ago`;
                if (diffDays === 1) return 'Yesterday';
                if (diffDays < 7) return `${diffDays}d ago`;

                return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
            } catch (e) {
                return 'Recently';
            }
        },

        /**
         * Sound icons helper for card display.
         */
        getSoundIcon(soundId) {
            const icons = {
                chime: '🔔',
                bell: '🎐',
                sparkle: '✨',
                musicbox: '🎶',
                harp: '🎼',
                piano: '🎹',
                celebration: '🎉',
                ocean: '🌊'
            };
            return icons[soundId] || '🎵';
        }
    };

    // Export globally
    window.VibeHistory = VibeHistory;
    window.StorageSafe = StorageSafe;

})(typeof window !== 'undefined' ? window : this);
