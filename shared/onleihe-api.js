(() => {
    'use strict';

    const API_BASE = 'https://api.onleihe.de';
    const LOGIN_URL = `${API_BASE}/user-application/v1/auth/login`;
    const SEARCH_PATH = (onleiheId) => `${API_BASE}/ui/v1/onleihe/${onleiheId}/search`;

    const REQUEST_TIMEOUT = 15000;
    const PAGE_SIZE = 10;
    // Safety margin so a token cannot expire in the middle of a request.
    const TOKEN_EXPIRY_MARGIN_MS = 60_000;

    /** Error with a machine-readable reason, so the UI can tell failures from zero hits. */
    class OnleiheApiError extends Error {
        constructor(reason, detail) {
            super(detail ? `${reason}: ${detail}` : reason);
            this.name = 'OnleiheApiError';
            this.reason = reason;
            this.detail = detail;
        }
    }

    /** accessToken per (onleiheId, libraryId). Tokens last about 30 days. */
    const tokenCache = new Map();

    function cacheKey(onleiheId, libraryId) {
        return `${onleiheId}|${libraryId || ''}`;
    }

    /** Reads the expiry from the JWT without verifying the signature (cache control only). */
    function readTokenExpiry(accessToken) {
        try {
            const payload = accessToken.split('.')[1];
            const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
            const exp = JSON.parse(json).exp;
            return typeof exp === 'number' ? exp * 1000 : 0;
        } catch {
            return 0;
        }
    }

    async function fetchJson(url, options = {}) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
        try {
            const response = await fetch(url, { ...options, signal: controller.signal });
            const text = await response.text();
            let body = null;
            if (text) {
                try {
                    body = JSON.parse(text);
                } catch {
                    body = null;
                }
            }
            return { status: response.status, ok: response.ok, body };
        } catch (error) {
            if (error.name === 'AbortError') {
                throw new OnleiheApiError('timeout');
            }
            throw new OnleiheApiError('network', error.message);
        } finally {
            clearTimeout(timer);
        }
    }

    async function mintToken(onleiheId, libraryId) {
        const payload = { onleiheId };
        if (libraryId) {
            payload.libraryId = libraryId;
        }

        const { ok, status, body } = await fetchJson(LOGIN_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (!ok || !body?.accessToken) {
            throw new OnleiheApiError('auth', String(status));
        }
        return body.accessToken;
    }

    async function getToken(onleiheId, libraryId, { forceRefresh = false } = {}) {
        const key = cacheKey(onleiheId, libraryId);
        const cached = tokenCache.get(key);

        if (!forceRefresh && cached && cached.expiresAt - TOKEN_EXPIRY_MARGIN_MS > Date.now()) {
            return cached.accessToken;
        }

        const accessToken = await mintToken(onleiheId, libraryId);
        tokenCache.set(key, { accessToken, expiresAt: readTokenExpiry(accessToken) });
        return accessToken;
    }

    function buildSearchUrl(onleiheId, libraryId) {
        const url = new URL(SEARCH_PATH(onleiheId));
        if (libraryId) {
            url.searchParams.set('libraryId', libraryId);
        }
        return url.toString();
    }

    /** Free-text search. */
    function buildSearchBody(searchTerm, size) {
        return {
            query: [{ query: searchTerm, fields: [] }],
            facets: [{ field: 'mediaType' }],
            size,
            from: 0
        };
    }

    async function postSearch(onleiheId, libraryId, searchTerm, size, accessToken) {
        return fetchJson(buildSearchUrl(onleiheId, libraryId), {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${accessToken}`
            },
            body: JSON.stringify(buildSearchBody(searchTerm, size))
        });
    }

    function mapItem(entry) {
        const product = entry.product || {};
        const availability = entry.status?.availabilityInformation || {};
        const authors = Array.isArray(product.authors)
            ? product.authors
                  .map((a) => [a.firstName, a.lastName].filter(Boolean).join(' ').trim())
                  .filter(Boolean)
            : [];

        return {
            productId: entry.productId,
            title: product.title || '',
            subTitle: product.subTitle || '',
            authors,
            mediaType: product.mediaType || '',
            isAvailable: availability.isAvailable === true,
            copies: typeof availability.availability === 'number' ? availability.availability : null,
            unlimited: availability.unlimited === true,
            reservable: entry.status?.reservable === true,
            nextAvailabilityDate: entry.status?.nextAvailabilityDate || null
        };
    }

    function mapFacets(facets) {
        const mediaTypeFacet = Array.isArray(facets)
            ? facets.find((f) => f.facetField === 'mediaType')
            : null;
        if (!mediaTypeFacet) {
            return [];
        }
        return (mediaTypeFacet.values || [])
            .map((v) => ({ mediaType: v.value, count: Number(v.count) || 0 }))
            .filter((v) => v.count > 0);
    }

    /**
     * Checks the availability of a title in one Onleihe.
     *
     * @returns {Promise<{totalItems:number, available:boolean, items:Array, mediaTypes:Array}>}
     * @throws {OnleiheApiError} on network, auth, timeout or HTTP errors.
     *   An empty result is not an error - it is totalItems === 0.
     */
    async function checkAvailability({ onleiheId, libraryId, searchTerm, size = PAGE_SIZE }) {
        if (!onleiheId || !searchTerm) {
            throw new OnleiheApiError('invalid_request');
        }

        let accessToken = await getToken(onleiheId, libraryId);
        let response = await postSearch(onleiheId, libraryId, searchTerm, size, accessToken);

        // Renew a token once if it expired or was discarded server-side.
        if (response.status === 401 || response.status === 403) {
            accessToken = await getToken(onleiheId, libraryId, { forceRefresh: true });
            response = await postSearch(onleiheId, libraryId, searchTerm, size, accessToken);
        }

        if (!response.ok) {
            throw new OnleiheApiError('http', String(response.status));
        }
        if (!response.body || typeof response.body !== 'object') {
            throw new OnleiheApiError('malformed_response');
        }

        const content = Array.isArray(response.body.content) ? response.body.content : [];
        const items = content.map(mapItem);

        return {
            totalItems: Number(response.body.totalItems) || 0,
            available: items.some((item) => item.isAvailable),
            items,
            mediaTypes: mapFacets(response.body.facets)
        };
    }

    function buildCatalogUrl(host, searchTerm) {
        if (!host) {
            return null;
        }
        return `https://${host}/search?searchTerm=${encodeURIComponent(searchTerm)}`;
    }

    function buildProductUrl(host, productId) {
        if (!host || !productId) {
            return null;
        }
        return `https://${host}/search/mediadetail?productId=${encodeURIComponent(productId)}`;
    }

    self.OnleiheApi = { checkAvailability, buildCatalogUrl, buildProductUrl, OnleiheApiError, API_BASE };
})();
