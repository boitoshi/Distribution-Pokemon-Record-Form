/**
 * API クライアント
 * Python FastAPI バックエンドとの通信を管理
 */

class ApiClient {
    constructor(baseUrl = 'http://localhost:8000') {
        this.baseUrl = baseUrl;
        this.defaultDatabase = 'pokemon';
    }

    /**
     * HTTP リクエストを送信
     * @param {string} url - リクエストURL
     * @param {object} options - fetch オプション
     * @returns {Promise<object>} - レスポンス
     */
    async request(url, options = {}) {
        const config = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            },
            ...options
        };

        try {
            const response = await fetch(`${this.baseUrl}${url}`, config);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            return await response.json();
        } catch (error) {
            console.error('API Request Error:', error);
            throw error;
        }
    }

    /**
     * データを作成
     * @param {object} data - 作成するデータ
     * @param {string} database - データベース名
     * @returns {Promise<object>} - レスポンス
     */
    async createData(data, database = this.defaultDatabase) {
        return this.request(`/api/${database}/data`, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    /**
     * データを取得
     * @param {string} database - データベース名
     * @param {object} params - クエリパラメータ
     * @returns {Promise<object>} - レスポンス
     */
    async getData(database = this.defaultDatabase, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = `/api/${database}/data${queryString ? `?${queryString}` : ''}`;
        return this.request(url);
    }

    /**
     * IDでデータを取得
     * @param {string} id - データID
     * @param {string} database - データベース名
     * @returns {Promise<object>} - レスポンス
     */
    async getDataById(id, database = this.defaultDatabase) {
        return this.request(`/api/${database}/data/${id}`);
    }

    /**
     * データを削除
     * @param {string} id - データID
     * @param {string} database - データベース名
     * @returns {Promise<object>} - レスポンス
     */
    async deleteData(id, database = this.defaultDatabase) {
        return this.request(`/api/${database}/data/${id}`, {
            method: 'DELETE'
        });
    }

    /**
     * 利用可能なデータベース一覧を取得
     * @returns {Promise<object>} - レスポンス
     */
    async getDatabases() {
        return this.request('/api/databases');
    }

    /**
     * ヘルスチェック
     * @returns {Promise<object>} - レスポンス
     */
    async healthCheck() {
        return this.request('/health');
    }
}

/**
 * API操作の高レベルインターフェース
 */
class PokemonApiService {
    constructor(apiClient) {
        this.api = apiClient;
    }

    /**
     * 既存のフォームデータをAPI形式に変換
     * @param {object} formData - フォームデータ
     * @returns {object} - API形式のデータ
     */
    formatFormDataForApi(formData) {
        return {
            id: formData.id,
            name: {
                ja: formData['name-ja']
            },
            shiny: formData.shiny || '',
            dexNo: formData['dex-no'].toString().padStart(4, '0'),
            generation: parseInt(formData.generation) || 0,
            game: formData.game,
            eventName: formData['event-name'],
            distribution: {
                method: formData['dist-method'],
                location: formData['dist-location'],
                startDate: formData['start-date'],
                endDate: formData['end-date'] || null
            },
            otName: formData.otName || '',
            trainerId: formData.trainerId || '',
            metLocation: formData.metLocation || '',
            ball: formData.ball || '',
            level: parseInt(formData.level) || 1,
            ability: formData.ability || '',
            nature: formData.nature || '',
            gender: formData.gender || '',
            gigantamax: formData.gigantamax || '',
            terastallize: formData.terastallize || '',
            moves: [
                formData.move1,
                formData.move2,
                formData.move3,
                formData.move4
            ].filter(move => move && move.trim() !== ''),
            heldItem: formData['held-item'] || '',
            ribbons: [
                formData.ribbon1,
                formData.ribbon2,
                formData.ribbon3
            ].filter(ribbon => ribbon && ribbon.trim() !== ''),
            otherInfo: formData['other-info'] || '',
            timestamp: new Date().toISOString()
        };
    }

    /**
     * ポケモンデータを作成
     * @param {object} formData - フォームデータ
     * @returns {Promise<object>} - レスポンス
     */
    async createPokemon(formData) {
        const apiData = this.formatFormDataForApi(formData);
        return this.api.createData(apiData);
    }

    /**
     * ポケモンデータを取得
     * @param {object} params - クエリパラメータ
     * @returns {Promise<object>} - レスポンス
     */
    async getPokemon(params = {}) {
        return this.api.getData('pokemon', params);
    }

    /**
     * ポケモンデータを削除
     * @param {string} id - ポケモンID
     * @returns {Promise<object>} - レスポンス
     */
    async deletePokemon(id) {
        return this.api.deleteData(id, 'pokemon');
    }
}

/**
 * UIフィードバック管理
 */
class UIFeedback {
    constructor() {
        this.successElement = document.getElementById('success-message');
        this.errorElement = document.getElementById('error-message');
    }

    /**
     * 成功メッセージを表示
     * @param {string} message - メッセージ
     * @param {number} duration - 表示時間（ミリ秒）
     */
    showSuccess(message, duration = 3000) {
        this.hideAll();
        this.successElement.textContent = `✅ ${message}`;
        this.successElement.style.display = 'block';
        
        setTimeout(() => {
            this.successElement.style.display = 'none';
        }, duration);
    }

    /**
     * エラーメッセージを表示
     * @param {string} message - メッセージ
     * @param {number} duration - 表示時間（ミリ秒）
     */
    showError(message, duration = 5000) {
        this.hideAll();
        this.errorElement.textContent = `❌ ${message}`;
        this.errorElement.style.display = 'block';
        
        setTimeout(() => {
            this.errorElement.style.display = 'none';
        }, duration);
    }

    /**
     * 読み込み中メッセージを表示
     * @param {string} message - メッセージ
     */
    showLoading(message = '処理中...') {
        this.hideAll();
        this.successElement.textContent = `⏳ ${message}`;
        this.successElement.style.display = 'block';
    }

    /**
     * 全メッセージを非表示
     */
    hideAll() {
        this.successElement.style.display = 'none';
        this.errorElement.style.display = 'none';
    }
}

/**
 * リトライ機能付きのAPI操作
 */
class RetryableApiService {
    constructor(apiService, maxRetries = 3, baseDelay = 1000) {
        this.apiService = apiService;
        this.maxRetries = maxRetries;
        this.baseDelay = baseDelay;
    }

    /**
     * 指数バックオフでリトライ
     * @param {Function} operation - 実行する操作
     * @param {number} attempt - 現在の試行回数
     * @returns {Promise<any>} - 操作結果
     */
    async withRetry(operation, attempt = 0) {
        try {
            return await operation();
        } catch (error) {
            if (attempt < this.maxRetries) {
                const delay = this.baseDelay * Math.pow(2, attempt);
                console.log(`リトライ ${attempt + 1}/${this.maxRetries} (${delay}ms後)`);
                
                await new Promise(resolve => setTimeout(resolve, delay));
                return this.withRetry(operation, attempt + 1);
            }
            throw error;
        }
    }

    /**
     * リトライ付きでポケモンデータを作成
     * @param {object} formData - フォームデータ
     * @returns {Promise<object>} - レスポンス
     */
    async createPokemonWithRetry(formData) {
        return this.withRetry(() => this.apiService.createPokemon(formData));
    }
}

// グローバルインスタンス
const apiClient = new ApiClient();
const pokemonService = new PokemonApiService(apiClient);
const uiFeedback = new UIFeedback();
const retryableService = new RetryableApiService(pokemonService);

// 環境に応じてベースURLを設定
if (window.location.hostname !== 'localhost') {
    // 本番環境では適切なURLに変更
    apiClient.baseUrl = 'https://your-vercel-app.vercel.app';
}