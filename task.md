1. ポケモンデータのJSONファイルを用意
まず、ポケモン名と図鑑Noを含むJSONファイルを用意します。例えば、pokemon_data.jsonというファイルを作成し、以下のような内容にします。

[
    {"name": "フシギダネ", "dexNo": "0001"},
    {"name": "ヒトカゲ", "dexNo": "0004"},
    {"name": "ゼニガメ", "dexNo": "0007"},
    // 他のポケモンデータを追加
]

2. HTMLにサジェスト機能を追加
HTMLフォームにサジェスト機能を追加します。datalist要素を使用してサジェストを実装します。

<!DOCTYPE html>
<html lang="ja">
<head>
    <base target="_top">
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>配信ポケモンデータ入力フォーム</title>
    <style>
        /* ...既存のスタイル... */
    </style>
</head>
<body>
    <h1>配信ポケモンデータ入力フォーム</h1>
    <div class="form-container">
        <form id="pokemon-form">
            <!-- 基本情報 -->
            <div class="form-group">
                <label for="id">ID (例: 0801)</label>
                <input type="text" id="id" name="id" placeholder="世代+連番の4桁 (例: 0801)" pattern="\d{4}" required>
            </div>
            
            <div class="form-group">
                <label for="name-ja">ポケモン名 (日本語)</label>
                <input type="text" id="name-ja" name="name-ja" list="pokemon-names" required>
                <datalist id="pokemon-names"></datalist>
            </div>
            
            <div class="form-group">
                <label for="dex-no">全国図鑑No.</label>
                <input type="number" id="dex-no" name="dex-no" required>
            </div>
            
            <!-- ...その他のフォームフィールド... -->
            
            <div class="buttons">
                <button type="button" class="clear-btn" onclick="clearForm()">クリア</button>
                <button type="button" class="preview-btn" onclick="previewJSON()">JSONプレビュー</button>
                <button type="button" class="submit-btn" onclick="submitForm()">送信</button>
            </div>
        </form>
    </div>
    
    <div id="json-output" class="json-output"></div>
    <div id="loading" class="loading"></div>
    <div id="success-message" class="success-message"></div>
    <div id="error-message" class="error-message"></div>
    
    <script>
        // ポケモンデータの読み込み
        fetch('pokemon_data.json')
            .then(response => response.json())
            .then(data => {
                const datalist = document.getElementById('pokemon-names');
                data.forEach(pokemon => {
                    const option = document.createElement('option');
                    option.value = pokemon.name;
                    datalist.appendChild(option);
                });

                // ポケモン名が選択されたときに図鑑Noを自動入力
                document.getElementById('name-ja').addEventListener('input', function() {
                    const selectedPokemon = data.find(pokemon => pokemon.name === this.value);
                    if (selectedPokemon) {
                        document.getElementById('dex-no').value = selectedPokemon.dexNo;
                    }
                });
            })
            .catch(error => console.error('Error loading Pokémon data:', error));
        
        function previewJSON() {
            const form = document.getElementById('pokemon-form');
            const jsonOutput = document.getElementById('json-output');
            
            // フォームデータの取得
            const data = formatFormData();
            
            // JSONとして表示
            jsonOutput.textContent = JSON.stringify(data, null, 2);
            jsonOutput.style.display = 'block';
            
            // クリップボードコピー機能（互換性対応）
            try {
                if (navigator.clipboard && navigator.clipboard.writeText) {
                    navigator.clipboard.writeText(JSON.stringify(data))
                        .then(() => alert('JSONがクリップボードにコピーされました！'))
                        .catch(err => {
                            console.error('クリップボードへのコピーに失敗しました', err);
                            alert('JSONプレビューを表示しました。クリップボードへのコピーはできませんでした。');
                        });
                } else {
                    // 古いブラウザやPermission APIが使えない場合の代替手段
                    const textArea = document.createElement('textarea');
                    textArea.value = JSON.stringify(data);
                    textArea.style.position = 'fixed';
                    textArea.style.opacity = '0';
                    document.body.appendChild(textArea);
                    textArea.select();
                    
                    try {
                        const successful = document.execCommand('copy');
                        if (successful) {
                            alert('JSONがクリップボードにコピーされました！');
                        } else {
                            alert('JSONプレビューを表示しました。クリップボードへのコピーはできませんでした。');
                        }
                    } catch (err) {
                        alert('JSONプレビューを表示しました。クリップボードへのコピーはできませんでした。');
                    }
                    
                    document.body.removeChild(textArea);
                }
            } catch (err) {
                alert('JSONプレビューを表示しました。');
            }
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
            
            if (!isValid) {
                alert('必須項目を入力してください');
                return null;
            }
            
            return {
                id: form.elements['id'].value,
                name: {
                    ja: form.elements['name-ja'].value
                },
                dexNo: form.elements['dex-no'].value.padStart(4, '0'),
                generation: parseInt(form.elements['generation'].value) || 0,
                game: form.elements['game'].value,
                version: form.elements['version'].value,
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
            
            // 日付フィールドをリセットして今日の日付に設定
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('start-date').value = today;
            document.getElementById('end-date').value = today;
            
            // 入力フィールドの赤い枠をリセット
            const allFields = document.querySelectorAll('input, select, textarea');
            allFields.forEach(field => {
                field.style.borderColor = '#ddd';
            });
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
            
            // Google Apps Scriptの関数を呼び出す
            google.script.run
                .withSuccessHandler(function(result) {
                    loadingDiv.style.display = 'none';
                    
                    if (result.success) {
                        successDiv.textContent = '✅ ' + result.message;
                        successDiv.style.display = 'block';
                        // フォームをリセット
                        setTimeout(() => {
                            clearForm();
                        }, 3000);
                    } else {
                        errorDiv.textContent = '❌ ' + result.message;
                        errorDiv.style.display = 'block';
                    }
                })
                .withFailureHandler(function(error) {
                    loadingDiv.style.display = 'none';
                    errorDiv.textContent = '❌ エラーが発生しました: ' + error;
                    errorDiv.style.display = 'block';
                })
                .savePokemonData(data);
        }
        
        // 日付入力フィールドに今日の日付をデフォルト値として設定
        window.onload = function() {
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('start-date').value = today;
            document.getElementById('end-date').value = today;
        }
    </script>
</body>
</html>
