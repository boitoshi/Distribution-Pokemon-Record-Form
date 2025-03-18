/* filepath: /Users/akabros/Documents/code/Distribution-Pokemon-Record-Form/script.js */
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
                document.getElementById('dex-no').value = selectedPokemon.dexno;
            }
        });
    })
    .catch(error => console.error('Error loading Pokémon data:', error));

document.getElementById('generation').addEventListener('change', function() {
    const generationFields = document.getElementById('generation-fields');
    if (this.value === '8' || this.value === '9') {
        generationFields.classList.remove('hidden');
    } else {
        generationFields.classList.add('hidden');
    }
});

function previewJSON() {
    const form = document.getElementById('pokemon-form');
    const jsonOutput = document.getElementById('json-output');
    
    // フォームデータの取得
    const data = formatFormData();
    
    if (!data) return; // バリデーションエラーの場合
    
    // JSONとして表示
    jsonOutput.textContent = JSON.stringify(data, null, 2);
    jsonOutput.style.display = 'block';
    
    // クリップボードコピー機能（互換性対応）
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(JSON.stringify(data))
            .then(() => {
                jsonOutput.title = 'JSONがクリップボードにコピーされました！';
                jsonOutput.style.cursor = 'pointer';
                jsonOutput.addEventListener('mouseover', () => {
                    jsonOutput.style.backgroundColor = '#e0f7fa';
                });
                jsonOutput.addEventListener('mouseout', () => {
                    jsonOutput.style.backgroundColor = '#f8f8f8';
                });
            })
            .catch(err => {
                console.error('クリップボードへのコピーに失敗しました', err);
                alert('JSONプレビューを表示しました。クリップボードへのコピーはできませんでした。');
            });
    } else {
        const textArea = document.createElement('textarea');
        textArea.value = JSON.stringify(data);
        textArea.style.position = 'fixed';
        textArea.style.opacity = '0';
        document.body.appendChild(textArea);
        textArea.select();
        
        try {
            const successful = document.execCommand('copy');
            if (successful) {
                jsonOutput.title = 'JSONがクリップボードにコピーされました！';
                jsonOutput.style.cursor = 'pointer';
                jsonOutput.addEventListener('mouseover', () => {
                    jsonOutput.style.backgroundColor = '#e0f7fa';
                });
                jsonOutput.addEventListener('mouseout', () => {
                    jsonOutput.style.backgroundColor = '#f8f8f8';
                });
            } else {
                alert('JSONプレビューを表示しました。クリップボードへのコピーはできませんでした。');
            }
        } catch (err) {
            alert('JSONプレビューを表示しました。クリップボードへのコピーはできませんでした。');
        }
        
        document.body.removeChild(textArea);
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
    
    // 日付フィールドをリセットして今日の日付に設定
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').value = today;
    document.getElementById('end-date').value = ''; // 初期値を空欄に設定

    // カレンダーボタンを押したときに日付を設定
    document.getElementById('end-date').addEventListener('focus', function() {
        if (!this.value) {
            this.value = today;
        }
    });

    // 入力フィールドの赤い枠をリセット
    const allFields = document.querySelectorAll('input, select, textarea');
    allFields.forEach(field => {
        field.style.borderColor = '#ddd';
    });
}

const GAS_URL = 'https://script.google.com/macros/s/AKfycbzMYRiM9snB5_l_465Fu83R-yEPIzJUNIfUr7K4qDDOj7SqLjF-fwCSoUUfnUb53b2H/exec';
    
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
    
   // fetchを使用してデータを送信
   fetch(GAS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
    })
    .then(response => response.json())
    .then(result => {
        loadingDiv.style.display = 'none';
        if (result.success) {
            successDiv.textContent = '✅ ' + result.message;
            successDiv.style.display = 'block';
            setTimeout(() => {
                clearForm();
            }, 3000);
        } else {
            errorDiv.textContent = '❌ ' + result.message;
            errorDiv.style.display = 'block';
        }
    })
    .catch(error => {
        loadingDiv.style.display = 'none';
        errorDiv.textContent = '❌ エラーが発生しました: ' + error;
        errorDiv.style.display = 'block';
    });
    }

// 日付入力フィールドに今日の日付をデフォルト値として設定
window.onload = function() {
    const today = new Date().toISOString().split('T')[0];
    document.getElementById('start-date').value = today;
    document.getElementById('end-date').value = ''; // 初期値を空欄に設定

    // カレンダーボタンを押したときに日付を設定
    document.getElementById('end-date').addEventListener('focus', function() {
        if (!this.value) {
            this.value = today;
        }
    });
};
