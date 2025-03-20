/* filepath: /Users/akabros/Documents/code/Distribution-Pokemon-Record-Form/script.js */
// 設定値
const CONFIG = {
    GAS_URL: 'https://script.google.com/macros/s/AKfycbyx_PN_aIaiE-4cLX6ZpH7_LgExtNoJIIBgzGqrOVDW8M3VsZThHrUdBPhWTuwVppyg/exec',
    SUCCESS_TIMEOUT: 3000,
    FEEDBACK_TIMEOUT: 2000,
    ANIMATION_TIMEOUT: 500
};

// 世代ごとのゲーム選択肢を定義
const gamesPerGeneration = {
    '1': ['赤','緑','青', 'ピカチュウ'],
    '2': ['金','銀', 'クリスタル'],
    '3': ['ルビー','サファイア', 'エメラルド', 'ファイアレッド','リーフグリーン'],
    '4': ['ダイヤモンド','パール', 'プラチナ', 'ハートゴールド','ソウルシルバー'],
    '5': ['ブラック','ホワイト', 'ブラック2','ホワイト2'],
    '6': ['X','Y', 'オメガルビー','アルファサファイア'],
    '7': ['サン','ムーン', 'ウルトラサン','ウルトラムーン', 'Let\'s Go! ピカチュウ','Let\'s Go! イーブイ'],
    '8': ['ソード','シールド', 'ブリリアントダイヤモンド','シャイニングパール', 'レジェンズアルセウス'],
    '9': ['スカーレット','バイオレット']
};

// DOMContentLoadedイベントで初期化処理をまとめる
document.addEventListener('DOMContentLoaded', function() {
    // ボタンに明示的にイベントリスナーを追加
    document.getElementById('preview-button').addEventListener('click', previewJSON);
    document.getElementById('submit-button').addEventListener('click', submitForm);
    document.getElementById('clear-button').addEventListener('click', clearForm);
    
    // 世代選択の変更イベントを設定
    const generationSelect = document.getElementById('generation');
    if (generationSelect) {
        generationSelect.addEventListener('change', updateGameCheckboxes);
        generationSelect.addEventListener('change', updateGenerationSpecificFields);
        
        // 初期ロード時、すでに世代が選択されていればゲームを表示
        if (generationSelect.value) {
            updateGameCheckboxes();
            updateGenerationSpecificFields();
        }
    }
    
    // 日付入力フィールドの初期設定
    initDateFields();
    
    // ポケモンデータの読み込み
    loadPokemonData();
});

// 世代に基づいてゲームのチェックボックスを更新
function updateGameCheckboxes() {
    const generation = document.getElementById('generation').value;
    const gameCheckboxesContainer = document.getElementById('game-checkboxes');
    
    // コンテナをクリア
    gameCheckboxesContainer.innerHTML = '';
    
    // 世代が選択されていない場合は何もしない
    if (!generation) return;
    
    // 選択された世代のゲームリストを取得
    const games = gamesPerGeneration[generation] || [];
    
    // DocumentFragmentを使用して効率的にDOM操作
    const fragment = document.createDocumentFragment();
    games.forEach(game => {
        const checkbox = document.createElement('div');
        checkbox.className = 'checkbox-item';
        
        const input = document.createElement('input');
        input.type = 'checkbox';
        const safeId = `game-${game.replace(/[^a-z0-9]/gi, '-').toLowerCase()}`;
        input.id = safeId;
        input.value = game;
        input.addEventListener('change', updateSelectedGames);
        
        const label = document.createElement('label');
        label.htmlFor = safeId;
        label.textContent = game;
        
        checkbox.appendChild(input);
        checkbox.appendChild(label);
        fragment.appendChild(checkbox);
    });
}

// 選択されたゲームを更新
function updateSelectedGames() {
    const gameCheckboxesContainer = document.getElementById('game-checkboxes');
    const checkboxes = gameCheckboxesContainer.querySelectorAll('input[type="checkbox"]:checked');
    const selectedGames = Array.from(checkboxes).map(checkbox => checkbox.value);
    
    // 選択されたゲームを隠しフィールドに設定
    document.getElementById('game').value = selectedGames.join(', ');
}
// 世代に応じた特殊フィールドの表示/非表示を切り替える
function updateGenerationSpecificFields() {
    const generation = parseInt(document.getElementById('generation').value) || 0;
    
    // キョダイマックスフィールド
    const gigantamaxField = document.getElementById('gigantamax-field');
    if (gigantamaxField) {
        gigantamaxField.style.display = generation === 8 ? 'block' : 'none';
    }
    
    // テラスタイプフィールド
    const teraField = document.getElementById('terastallize-field');
    if (teraField) {
        teraField.style.display = generation === 9 ? 'block' : 'none';
    }
}

// ポケモンデータの読み込み
function loadPokemonData() {
    fetch('pokemon_data.json')
        .then(response => response.json())
        .then(data => {
            const datalist = document.getElementById('pokemon-names');
            if (!datalist) return;
            
            data.forEach(pokemon => {
                const option = document.createElement('option');
                option.value = pokemon.name;
                datalist.appendChild(option);
            });

            // ポケモン名が選択されたときに図鑑Noを自動入力
            const nameField = document.getElementById('name-ja');
            if (nameField) {
                nameField.addEventListener('input', function() {
                    const selectedPokemon = data.find(pokemon => pokemon.name === this.value);
                    if (selectedPokemon) {
                        document.getElementById('dex-no').value = selectedPokemon.dexno;
                    }
                });
            }
        })
        .catch(error => console.error('Error loading Pokémon data:', error));
}

function previewJSON() {
    const data = formatFormData();
    if (!data) return; // バリデーションエラーの場合
    
    const jsonOutput = document.getElementById('json-output');
    
    // JSONとして表示
    jsonOutput.textContent = JSON.stringify(data, null, 2);
    jsonOutput.style.display = 'block';
    
    // モダンAPIを使用したクリップボードコピー
    navigator.clipboard.writeText(JSON.stringify(data))
        .then(() => {
            alert('JSONがクリップボードにコピーされました！');
        })
        .catch(err => {
            console.error('クリップボードへのコピーに失敗しました', err);
            alert('クリップボードへのコピーに失敗しました');
        });
}

function formatFormData() {
    const form = document.getElementById('pokemon-form');

    // フォームバリデーション
    let isValid = true;
    const requiredFields = form.querySelectorAll('[required]');
    requiredFields.forEach(field => {
        if (!field.value) {
            isValid = false;
            field.style.borderColor = '#f44336';
        } else {
            field.style.borderColor = '#ddd';
        }
    });

    // ゲーム選択のバリデーション追加
    const gameField = document.getElementById('game');
    if (!gameField.value) {
        isValid = false;
        document.getElementById('game-checkboxes').style.borderColor = '#f44336';
    } else {
        document.getElementById('game-checkboxes').style.borderColor = '#ddd';
    }

    if (!isValid) {
        alert('必須項目を入力してください');
        return null;
    }

    // バージョンが空欄の場合、ゲームの値をコピー
    if (!form.elements['version'].value) {
        form.elements['version'].value = form.elements['game'].value;
    }
    
    return {
        id: form.elements['id'].value,
        name: {
            ja: form.elements['name-ja'].value
        },
        dexNo: form.elements['dex-no'].value.padStart(4, '0'),
        generation: parseInt(form.elements['generation'].value) || 0,
        game: form.elements['game'].value,
        eventName: form.elements['event-name'].value,
        distribution: {
            method: form.elements['dist-method'].value,
            location: form.elements['dist-location'].value,
            startDate: form.elements['start-date'].value,
            endDate: form.elements['end-date'].value
        },
        level: parseInt(form.elements['level'].value) || 1,
        ability: form.elements['ability'].value,
        nature: form.elements['nature'].value,
        gender: form.elements['gender'].value,
        gigantamax: form.elements['gigantamax'] ? form.elements['gigantamax'].value : '',
        terastallize: form.elements['terastallize'] ? form.elements['terastallize'].value : '',
        moves: [
            form.elements['move1'].value,
            form.elements['move2'].value,
            form.elements['move3'].value,
            form.elements['move4'].value
        ].filter(move => move !== ""),
        heldItem: form.elements['held-item'].value,
        ribbons: [
            form.elements['ribbon1'].value,
            form.elements['ribbon2'].value,
            form.elements['ribbon3'].value
        ].filter(ribbon => ribbon !== ""),
        otherInfo: form.elements['other-info'].value,
        timestamp: new Date().toISOString()
    };
}

function clearForm() {
    document.getElementById('pokemon-form').reset();
    document.getElementById('json-output').style.display = 'none';
    document.getElementById('success-message').style.display = 'none';
    document.getElementById('error-message').style.display = 'none';
    
    // 日付フィールドを初期状態に戻す
    initDateFields();

    // 入力フィールドの赤い枠をリセット
    const allFields = document.querySelectorAll('input, select, textarea');
    allFields.forEach(field => {
        field.style.borderColor = '#ddd';
    });
    
    // ゲームチェックボックスをリセット
    document.getElementById('game-checkboxes').style.borderColor = '#ddd';
    
    // フォームがクリアされたことをユーザーに通知
    const successDiv = document.getElementById('success-message');
    successDiv.textContent = 'フォームをクリアしました';
    successDiv.style.display = 'block';
    setTimeout(() => {
        successDiv.style.display = 'none';
    }, 1500);
}

function submitForm() {
    const data = formatFormData();
    if (!data) return; // バリデーションエラーの場合

    const loadingDiv = document.getElementById('loading');
    const successDiv = document.getElementById('success-message');
    const errorDiv = document.getElementById('error-message');

    // 読み込み中表示
    loadingDiv.style.display = 'block';
    successDiv.style.display = 'none';
    errorDiv.style.display = 'none';

    console.log("送信データ:", data); // デバッグログ
    console.log("送信先URL:", GAS_URL); // デバッグログ

    // JSON形式でデータを送信（最新ブラウザ向け）
    try {
        fetch(GAS_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/plain',
            },
            body: JSON.stringify(data)
        })
        .then(response => {
            console.log("POSTレスポンスステータス:", response.status);
            if (!response.ok) {
                throw new Error('サーバーエラー: ' + response.status);
            }
            return response.text();
        })
        .then(text => {
            // テキストをJSONに変換
            let result;
            try {
                result = JSON.parse(text);
            } catch (e) {
                console.error('JSON解析エラー:', text);
                throw new Error('レスポンスの解析に失敗しました');
            }
            
            loadingDiv.style.display = 'none';
            if (result.success) {
                successDiv.textContent = '✅ ' + result.message;
                successDiv.style.display = 'block';
                setTimeout(() => {
                    clearForm();
                }, 3000);
            } else {
                errorDiv.textContent = '❌ ' + (result.message || '不明なエラーが発生しました');
                errorDiv.style.display = 'block';
            }
        })
        .catch(error => {
            console.error('Fetch Error:', error); // デバッグログ
            loadingDiv.style.display = 'none';
            errorDiv.textContent = '❌ エラーが発生しました: ' + error.message;
            errorDiv.style.display = 'block';
        });
    } catch (error) {
        console.error('送信前エラー:', error);
        loadingDiv.style.display = 'none';
        errorDiv.textContent = '❌ 送信処理中にエラーが発生しました: ' + error.message;
        errorDiv.style.display = 'block';
    }
}

// 日付入力フィールドの初期化
function initDateFields() {
    const today = new Date().toISOString().split('T')[0];
    const startDateField = document.getElementById('start-date');
    const endDateField = document.getElementById('end-date');
    
    if (startDateField) {
        startDateField.value = today;
    }
    
    if (endDateField) {
        endDateField.value = '';
        
        // カレンダーボタンを押したときに日付を設定
        endDateField.addEventListener('focus', function() {
            if (!this.value) {
                this.value = today;
            }
        });
    }
}
