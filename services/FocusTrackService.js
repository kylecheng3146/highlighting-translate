class FocusTrackService {
    constructor() {
        this.STORAGE_KEY = 'focusTrack';
        this.FOCUS_WORDS_KEY = 'focusTrackWords';
        this.REPORTS_KEY = 'focusTrackReports';
        this.TOPIC_IDS = {
            DOMAIN: 'domain',
            WEAK_WORDS: 'weak_words'
        };
    }

    getWeekId(date = new Date()) {
        const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
        const dayNum = d.getUTCDay() || 7;
        d.setUTCDate(d.getUTCDate() + 4 - dayNum);
        const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
        const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
        const week = String(weekNo).padStart(2, '0');
        return `${d.getUTCFullYear()}-W${week}`;
    }

    shouldRegenerateWeek(existingTrack, now = Date.now()) {
        if (!existingTrack || !existingTrack.weekId) return true;
        return existingTrack.weekId !== this.getWeekId(new Date(now));
    }

    _clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }

    _roundTarget(value) {
        return Math.max(1, Math.round(value));
    }

    _calculatePersonalizationFactor(previousTrack) {
        if (!previousTrack || !Array.isArray(previousTrack.topics) || previousTrack.topics.length === 0) {
            return 1;
        }
        const targetTotal = previousTrack.topics.reduce((sum, topic) => sum + Number(topic.target || 0), 0);
        const progressTotal = previousTrack.topics.reduce((sum, topic) => sum + Number(topic.progress || 0), 0);
        if (targetTotal <= 0) return 1;
        const completionRate = progressTotal / targetTotal;
        if (completionRate >= 0.9) return 1.15;
        if (completionRate >= 0.7) return 1.05;
        if (completionRate >= 0.4) return 1;
        return 0.85;
    }

    _buildStats(vocabList, now = Date.now()) {
        const active = (vocabList || []).filter((item) => !item.isArchived);
        const weakWords = active.filter((item) => Number(item.learningRate || 0) < 60);
        const recent = active.slice(0, 200);

        const domainCounts = new Map();
        const domainWords = new Map();
        recent.forEach((item) => {
            if (!item.sourceUrl) return;
            try {
                const url = new URL(item.sourceUrl);
                const domain = url.hostname;
                if (!domain) return;
                domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1);
                const list = domainWords.get(domain) || [];
                list.push(item);
                domainWords.set(domain, list);
            } catch (error) {
                return;
            }
        });

        const topDomainEntry = Array.from(domainCounts.entries())
            .sort((a, b) => b[1] - a[1])[0];

        return {
            activeCount: active.length,
            weakWords,
            topDomain: topDomainEntry ? topDomainEntry[0] : null,
            domainWords
        };
    }

    _buildTopics(stats, previousTrack) {
        const factor = this._clamp(this._calculatePersonalizationFactor(previousTrack), 0.8, 1.2);
        const starterMode = stats.activeCount < 20;
        const topics = [];

        if (stats.topDomain) {
            const domainItems = stats.domainWords.get(stats.topDomain) || [];
            const targetBase = starterMode ? 4 : 8;
            const target = this._roundTarget(this._clamp(domainItems.length * 0.4, 3, targetBase) * factor);
            topics.push({
                id: `${this.TOPIC_IDS.DOMAIN}:${stats.topDomain}`,
                label: this._formatDomainLabel(stats.topDomain),
                type: this.TOPIC_IDS.DOMAIN,
                target,
                progress: 0,
                reason: this._buildReason('domain', { domain: stats.topDomain }),
                words: domainItems.map((item) => String(item.text || '').toLowerCase().trim()).filter(Boolean)
            });
        }

        if (stats.weakWords.length > 0) {
            const targetBase = starterMode ? 3 : 6;
            const target = this._roundTarget(this._clamp(stats.weakWords.length * 0.3, 2, targetBase) * factor);
            topics.push({
                id: this.TOPIC_IDS.WEAK_WORDS,
                label: 'Weak Words',
                type: this.TOPIC_IDS.WEAK_WORDS,
                target,
                progress: 0,
                reason: this._buildReason('weak', { weakCount: stats.weakWords.length }),
                words: stats.weakWords.map((item) => String(item.text || '').toLowerCase().trim()).filter(Boolean)
            });
        }

        if (topics.length === 0) {
            topics.push({
                id: this.TOPIC_IDS.WEAK_WORDS,
                label: 'Starter Focus',
                type: this.TOPIC_IDS.WEAK_WORDS,
                target: 3,
                progress: 0,
                reason: this._buildReason('starter', {}),
                words: []
            });
        }

        return topics.slice(0, 2);
    }

    _formatDomainLabel(domain) {
        if (!domain) return 'Focus Domain';
        const parts = domain.split('.');
        if (parts.length <= 2) return domain;
        return parts.slice(-2).join('.');
    }

    _buildReason(type, data = {}) {
        if (type === 'domain' && data.domain) {
            return `最近閱讀多集中於 ${data.domain}`;
        }
        if (type === 'weak') {
            const count = Number(data.weakCount || 0);
            return count > 0
                ? `有 ${count} 個弱項詞彙需要加強`
                : '近期弱項詞彙需要集中強化';
        }
        if (type === 'starter') {
            return '先收藏幾個單字以啟用更完整的焦點分析';
        }
        return '根據近期學習資料自動生成';
    }

    _withSummary(track) {
        const topics = track.topics || [];
        const targetTotal = topics.reduce((sum, topic) => sum + Number(topic.target || 0), 0);
        const progressTotal = topics.reduce((sum, topic) => sum + Number(topic.progress || 0), 0);
        const score = targetTotal > 0 ? Math.round((progressTotal / targetTotal) * 100) : 0;
        const completed = topics.every((topic) => Number(topic.progress || 0) >= Number(topic.target || 0));

        return {
            ...track,
            topics: topics.map((topic) => ({
                ...topic,
                status: Number(topic.progress || 0) >= Number(topic.target || 0)
                    ? 'completed'
                    : (Number(topic.progress || 0) > 0 ? 'in_progress' : 'pending')
            })),
            completed,
            summary: {
                score,
                targetTotal,
                progressTotal
            }
        };
    }

    generateFocusTrack(vocabList, previousTrack = null, now = Date.now()) {
        const stats = this._buildStats(vocabList, now);
        const weekId = this.getWeekId(new Date(now));
        const topics = this._buildTopics(stats, previousTrack);

        const track = {
            weekId,
            generatedAt: now,
            completed: false,
            topics,
            summary: {
                score: 0,
                targetTotal: 0,
                progressTotal: 0
            }
        };

        return this._withSummary(track);
    }

    reconcileWithCurrentData(track, vocabList, now = Date.now()) {
        if (!track || !Array.isArray(track.topics)) return track;
        const stats = this._buildStats(vocabList, now);
        const nextTopics = this._buildTopics(stats, track).map((topic) => {
            const existing = track.topics.find((t) => t.id === topic.id);
            return {
                ...topic,
                progress: Number(existing?.progress || 0)
            };
        });

        return this._withSummary({
            ...track,
            topics: nextTopics
        });
    }

    applyEvent(track, event = {}) {
        if (!track || !Array.isArray(track.topics)) return track;

        const updated = {
            ...track,
            topics: track.topics.map((topic) => ({ ...topic }))
        };

        const word = String(event.word || '').toLowerCase().trim();
        const sourceUrl = event.sourceUrl || '';
        updated.topics.forEach((topic) => {
            let shouldIncrement = false;
            if (topic.type === this.TOPIC_IDS.DOMAIN && event.sourceUrl) {
                try {
                    const url = new URL(event.sourceUrl);
                    const domain = url.hostname;
                    if (domain && topic.id === `${this.TOPIC_IDS.DOMAIN}:${domain}`) {
                        shouldIncrement = true;
                    }
                } catch (error) {
                    shouldIncrement = false;
                }
            }
            if (topic.type === this.TOPIC_IDS.WEAK_WORDS) {
                if (event.weakWordImproved) {
                    shouldIncrement = true;
                } else if (word && Array.isArray(topic.words)) {
                    shouldIncrement = topic.words.includes(word);
                }
            }

            if (shouldIncrement) {
                topic.progress = Math.min(Number(topic.target || 0), Number(topic.progress || 0) + 1);
                topic.reason = this._buildEventReason(topic, { word, sourceUrl });
            }
        });

        return this._withSummary(updated);
    }

    _buildEventReason(topic, data = {}) {
        if (!topic) return this._buildReason('default');
        if (topic.type === this.TOPIC_IDS.DOMAIN && data.sourceUrl) {
            try {
                const url = new URL(data.sourceUrl);
                return `近期閱讀集中於 ${this._formatDomainLabel(url.hostname)}`;
            } catch (error) {
                return topic.reason || this._buildReason('default');
            }
        }
        if (topic.type === this.TOPIC_IDS.WEAK_WORDS && data.word) {
            return `剛完成弱項詞彙: ${data.word}`;
        }
        return topic.reason || this._buildReason('default');
    }

    buildFocusWords(track) {
        if (!track || !Array.isArray(track.topics)) return [];
        const words = track.topics.flatMap((topic) => Array.isArray(topic.words) ? topic.words : []);
        return Array.from(new Set(words.map((word) => String(word).toLowerCase().trim()).filter(Boolean)));
    }
}

if (typeof window !== 'undefined') {
    window.FocusTrackService = FocusTrackService;
} else if (typeof self !== 'undefined') {
    self.FocusTrackService = FocusTrackService;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = FocusTrackService;
}
