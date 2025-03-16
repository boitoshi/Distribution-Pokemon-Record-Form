/**
 * 配信ポケモンデータ管理システム
 * 作成者: あかブロス
 * 作成日: 2025-03-16
 */

// Webアプリとして公開されたときに実行される関数
function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
      .setTitle('配信ポケモンデータ入力フォーム')
      .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
      .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

/**
 * HTMLフォームから送信されたポケモンデータを保存する関数
 * @param {Object} jsonData - フォームから送信されたJSONデータ
 * @return {Object} 処理結果
 */
function savePokemonData(jsonData) {
  try {
    // スクリプトプロパティからスプレッドシートIDを取得
    const scriptProperties = PropertiesService.getScriptProperties();
    const spreadsheetId = scriptProperties.getProperty('SPREADSHEET_ID');
    
    if (!spreadsheetId) {
      throw new Error('スプレッドシートIDが設定されていません。setEnvironmentVariables()関数を実行してください。');
    }
    
    // スプレッドシートを開く
    const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
    let sheet = spreadsheet.getSheetByName('ポケモンデータ');
    
    // シートがなければ作成してヘッダーを設定
    if (!sheet) {
      sheet = spreadsheet.insertSheet('ポケモンデータ');
      
      // ヘッダー行の設定
      const headers = [
        'ID', 'ポケモン名(日)', 'ポケモン名(英)', '図鑑No.', '世代', 
        'ゲーム', 'バージョン', 'イベント名', '配信方法', '配信場所', 
        '配信開始日', '配信終了日', 'レベル', '特性', '性格', 
        '持ち物', '技1', '技2', '技3', '技4', 
        'リボン', 'その他情報', '登録日時'
      ];
      
      sheet.appendRow(headers);
      
      // ヘッダー行の書式設定
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4285F4').setFontColor('white');
      sheet.setFrozenRows(1);
    }
    
    // 日付のフォーマット
    const now = new Date();
    const formattedDate = Utilities.formatDate(now, 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
    
    // 配列データの準備
    const rowData = [
      jsonData.id,
      jsonData.name.ja,
      jsonData.name.en,
      jsonData.dexNo,
      jsonData.generation,
      jsonData.game,
      jsonData.version,
      jsonData.eventName,
      jsonData.distribution.method,
      jsonData.distribution.location,
      jsonData.distribution.startDate,
      jsonData.distribution.endDate,
      jsonData.level,
      jsonData.ability,
      jsonData.nature,
      jsonData.heldItem || '',
      jsonData.moves[0] || '',
      jsonData.moves[1] || '',
      jsonData.moves[2] || '',
      jsonData.moves[3] || '',
      jsonData.ribbons.join(', ') || '',
      jsonData.otherInfo || '',
      formattedDate
    ];
    
    // データを行として追加
    sheet.appendRow(rowData);
    
    // 行の高さを自動調整
    const lastRow = sheet.getLastRow();
    sheet.setRowHeight(lastRow, -1);
    
    // JSONデータをそのまま保存するシートも作成（データ分析用）
    let jsonSheet = spreadsheet.getSheetByName('JSONデータ');
    if (!jsonSheet) {
      jsonSheet = spreadsheet.insertSheet('JSONデータ');
      jsonSheet.appendRow(['タイムスタンプ', 'ID', 'ポケモン名', 'JSON']);
      jsonSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#4285F4').setFontColor('white');
      jsonSheet.setFrozenRows(1);
    }
    
    // JSON形式のデータを保存（フラット化して保存）
    const flattenJson = (obj, prefix = '') => {
      const result = [];
      
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          const value = obj[key];
          const newPrefix = prefix ? `${prefix}.${key}` : key;
          
          if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
            // オブジェクトの場合は再帰的に処理
            result.push(...flattenJson(value, newPrefix));
          } else {
            // プリミティブ値または配列の場合
            const category = prefix || 'root';
            const displayKey = prefix ? key : newPrefix;
            const displayValue = Array.isArray(value) ? value.join(', ') : String(value);
            
            result.push([formattedDate, jsonData.id, jsonData.name.ja, category, displayKey, displayValue]);
          }
        }
      }
      
      return result;
    };
    
    const flattenedData = flattenJson(jsonData);
    flattenedData.forEach(row => {
      jsonSheet.appendRow(row);
    });
    
    // 更新履歴を記録
    logActivity('新規データ追加', jsonData.id, jsonData.name.ja);
    
    // 成功を返す
    return {
      success: true,
      message: 'ポケモンデータを正常に保存しました！'
    };
    
  } catch (error) {
    // エラーを記録
    logError(error);
    
    // エラーを返す
    return {
      success: false,
      message: 'エラーが発生しました: ' + error.toString()
    };
  }
}

/**
 * 活動ログを記録する関数
 * @param {string} action - 実行されたアクション
 * @param {string} pokemonId - 対象のポケモンID
 * @param {string} pokemonName - 対象のポケモン名
 */
function logActivity(action, pokemonId, pokemonName) {
  try {
    const spreadsheet = SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
    );
    
    let logSheet = spreadsheet.getSheetByName('活動ログ');
    if (!logSheet) {
      logSheet = spreadsheet.insertSheet('活動ログ');
      logSheet.appendRow(['タイムスタンプ', 'ユーザー', 'アクション', 'ポケモンID', 'ポケモン名']);
      logSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#4285F4').setFontColor('white');
      logSheet.setFrozenRows(1);
    }
    
    // ユーザー情報を取得（可能な場合）
    let userName = 'システム';
    try {
      userName = Session.getActiveUser().getEmail();
    } catch (e) {
      // セッション情報が取得できない場合は無視
    }
    
    // 日本時間でのタイムスタンプ
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
    
    // ログを記録
    logSheet.appendRow([timestamp, userName, action, pokemonId, pokemonName]);
    
  } catch (e) {
    // ログ記録中のエラーは無視（メイン処理に影響させない）
    console.error('ログ記録エラー:', e);
  }
}

/**
 * エラーログを記録する関数
 * @param {Error} error - 発生したエラー
 */
function logError(error) {
  try {
    const spreadsheet = SpreadsheetApp.openById(
      PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID')
    );
    
    let errorSheet = spreadsheet.getSheetByName('エラーログ');
    if (!errorSheet) {
      errorSheet = spreadsheet.insertSheet('エラーログ');
      errorSheet.appendRow(['タイムスタンプ', 'エラーメッセージ', 'スタックトレース']);
      errorSheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#E57373').setFontColor('white');
      errorSheet.setFrozenRows(1);
    }
    
    // 日本時間でのタイムスタンプ
    const timestamp = Utilities.formatDate(new Date(), 'Asia/Tokyo', 'yyyy-MM-dd HH:mm:ss');
    
    // エラー情報を記録
    errorSheet.appendRow([
      timestamp, 
      error.toString(), 
      error.stack || '利用不可'
    ]);
    
  } catch (e) {
    // エラーログ記録中のエラーは無視
    console.error('エラーログ記録エラー:', e);
  }
}

/**
 * 環境変数を設定する関数（初回実行時のみ使用）
 * この関数は最初の1回だけ実行
 * GASのスクリプトプロパティにスプレッドシートIDを保存しているため不要
 */

// function setEnvironmentVariables() {
//   const scriptProperties = PropertiesService.getScriptProperties();
  
//   // スプレッドシートIDを設定（自分のスプレッドシートIDに置き換えてください）
//   scriptProperties.setProperty('SPREADSHEET_ID', '1ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijk');
  
//   // 設定を確認
//   console.log('スプレッドシートID設定済み:', PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID'));
// }

/**
 * 初期設定を行う関数（新規デプロイ時に実行）
 * WEB上でデプロイ済みのため不要
 */

// function initialize() {
//   // スプレッドシートIDが設定されているか確認
//   const spreadsheetId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
//   if (!spreadsheetId) {
//     throw new Error('スプレッドシートIDが設定されていません。setEnvironmentVariables()関数を先に実行してください。');
//   }
  
//   const spreadsheet = SpreadsheetApp.openById(spreadsheetId);
  
//   // 必要なシートを作成
//   if (!spreadsheet.getSheetByName('ポケモンデータ')) {
//     const sheet = spreadsheet.insertSheet('ポケモンデータ');
//     const headers = [
//       'ID', 'ポケモン名(日)', 'ポケモン名(英)', '図鑑No.', '世代', 
//       'ゲーム', 'バージョン', 'イベント名', '配信方法', '配信場所', 
//       '配信開始日', '配信終了日', 'レベル', '特性', '性格', 
//       '持ち物', '技1', '技2', '技3', '技4', 
//       'リボン', 'その他情報', '登録日時'
//     ];
//     sheet.appendRow(headers);
//     sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#4285F4').setFontColor('white');
//     sheet.setFrozenRows(1);
//   }
  
//   // JSONデータシートを作成
//   if (!spreadsheet.getSheetByName('JSONデータ')) {
//     const jsonSheet = spreadsheet.insertSheet('JSONデータ');
//     jsonSheet.appendRow(['タイムスタンプ', 'ID', 'ポケモン名', 'JSON']);
//     jsonSheet.getRange(1, 1, 1, 4).setFontWeight('bold').setBackground('#4285F4').setFontColor('white');
//     jsonSheet.setFrozenRows(1);
//   }
  
//   // ログシートを作成
//   if (!spreadsheet.getSheetByName('活動ログ')) {
//     const logSheet = spreadsheet.insertSheet('活動ログ');
//     logSheet.appendRow(['タイムスタンプ', 'ユーザー', 'アクション', 'ポケモンID', 'ポケモン名']);
//     logSheet.getRange(1, 1, 1, 5).setFontWeight('bold').setBackground('#4285F4').setFontColor('white');
//     logSheet.setFrozenRows(1);
//   }
  
//   // エラーログシートを作成
//   if (!spreadsheet.getSheetByName('エラーログ')) {
//     const errorSheet = spreadsheet.insertSheet('エラーログ');
//     errorSheet.appendRow(['タイムスタンプ', 'エラーメッセージ', 'スタックトレース']);
//     errorSheet.getRange(1, 1, 1, 3).setFontWeight('bold').setBackground('#E57373').setFontColor('white');
//     errorSheet.setFrozenRows(1);
//   }
  
//   return '初期化が完了しました。Webアプリとして公開する準備が整いました。';
// }
