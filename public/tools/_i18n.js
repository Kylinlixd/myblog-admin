/* 御器工具页共享 i18n 运行时
 * - 语言来源：localStorage('blog-locale')（与博客共享）→ navigator → zh
 * - 词典：扁平结构，键为中文原文，值为各语言译文
 * - 应用：TreeWalker 精确替换文本节点 + placeholder/title/aria-label 属性
 * - 切换：左下角语言胶囊，切换后持久化并整页刷新（静态页最可靠）
 * 用法：页面在 </body> 前引入 <script src="/tools/_i18n.js"></script> 即可。
 */
(function () {
  'use strict'
  var KEY = 'blog-locale'
  var ORDER = ['zh', 'en', 'ja', 'ko', 'es', 'fr']
  var LABEL = { zh: '中文', en: 'EN', ja: '日本語', ko: '한국어', es: 'ES', fr: 'FR' }

  function detect() {
    try {
      var saved = localStorage.getItem(KEY)
      if (ORDER.indexOf(saved) !== -1) return saved
    } catch (e) { /* 隐私模式 */ }
    var nav = ((navigator.languages && navigator.languages[0]) || navigator.language || '').split('-')[0]
    return ORDER.indexOf(nav) !== -1 ? nav : 'zh'
  }

  var locale = detect()

  /* 词典：S(en, ja, ko, es, fr) 紧凑定义；键 = 中文原文（页面中的字符串） */
  var S = function (en, ja, ko, es, fr) { return { en: en, ja: ja, ko: ko, es: es, fr: fr } }
  var DICT = {
    /* ---- 共享 ---- */
    '← 返回御器': S('← Back to Tools', '← 道具へ戻る', '← 도구로', '← Volver a Herramientas', '← Retour aux Outils'),
    '复制': S('Copy', 'コピー', '복사', 'Copiar', 'Copier'),
    '已复制': S('Copied', 'コピーしました', '복사됨', 'Copiado', 'Copié'),
    '复制全部': S('Copy all', 'すべてコピー', '모두 복사', 'Copiar todo', 'Tout copier'),
    '复制结果': S('Copy result', '結果をコピー', '결과 복사', 'Copiar resultado', 'Copier le résultat'),
    '结果': S('Result', '結果', '결과', 'Resultado', 'Résultat'),
    '计算': S('Compute', '計算', '계산', 'Calcular', 'Calculer'),
    '生成': S('Generate', '生成', '생성', 'Generar', 'Générer'),
    '下载': S('Download', 'ダウンロード', '다운로드', 'Descargar', 'Télécharger'),

    /* ---- img-press ---- */
    'img-press · 图片压缩与格式转换': S('img-press · Image Compressor', 'img-press · 画像圧縮・変換', 'img-press · 이미지 압축 변환', 'img-press · Compresor de imágenes', 'img-press · Compresseur d’images'),
    '图片压缩 · 格式转换 · 纯本地处理': S('Image compression · Format conversion · 100% local', '画像圧縮 · フォーマット変換 · 完全ローカル', '이미지 압축 · 형식 변환 · 100% 로컬', 'Compresión · Conversión · 100% local', 'Compression · Conversion · 100% local'),
    '拖拽图片到这里': S('Drag images here', 'ここに画像をドラッグ', '여기로 이미지를 끌어다 놓기', 'Arrastra imágenes aquí', 'Glissez des images ici'),
    '，或点击选择': S(', or click to browse', '、クリックで選択', ', 클릭해서 선택', ', o haz clic para elegir', ', ou cliquez pour parcourir'),
    '检测编码能力中…': S('Detecting encoder support…', 'エンコーダ対応を確認中…', '인코더 지원 확인 중…', 'Detectando soporte de codificación…', 'Détection des encodeurs pris en charge…'),
    '本浏览器可编码：': S('Encoders available in this browser: ', 'このブラウザでエンコード可能：', '이 브라우저에서 인코딩 가능: ', 'Codificadores disponibles: ', 'Encodeurs disponibles : '),
    '输出格式': S('Output format', '出力フォーマット', '출력 형식', 'Formato de salida', 'Format de sortie'),
    '质量': S('Quality', '品質', '품질', 'Calidad', 'Qualité'),
    '最长边': S('Max side', '最長辺', '최대 변', 'Lado máx.', 'Côté max'),
    '不限制': S('No limit', '無制限', '제한 없음', 'Sin límite', 'Sans limite'),
    '开始压缩': S('Compress', '圧縮開始', '압축 시작', 'Comprimir', 'Compresser'),
    '全部下载': S('Download all', 'すべてダウンロード', '모두 다운로드', 'Descargar todo', 'Tout télécharger'),
    '所有处理都在你的浏览器内完成（Canvas 原生编码），图片不会上传到任何服务器。EXIF 方向会自动修正；输出会移除全部元信息（含 GPS）。': S('All processing happens in your browser (native Canvas encoding) — images are never uploaded. EXIF orientation is fixed automatically; metadata (including GPS) is stripped from output.', 'すべての処理はブラウザ内で完結（Canvas ネイティブ エンコード）。画像はアップロードされません。EXIF 方向は自動修正、出力からメタ情報（GPS 含む）は削除されます。', '모든 처리는 브라우저에서 완료됩니다(Canvas 네이티브 인코딩). 이미지는 업로드되지 않습니다. EXIF 방향이 자동 수정되고 메타정보(GPS 포함)는 제거됩니다.', 'Todo se procesa en tu navegador (codificación nativa de Canvas); las imágenes nunca se suben. La orientación EXIF se corrige y los metadatos (incluido GPS) se eliminan.', 'Tout est traité dans votre navigateur (encodage Canvas natif) — aucune image n’est envoyée. L’orientation EXIF est corrigée; les métadonnées (GPS inclus) sont supprimées.'),
    '压缩中…': S('Compressing…', '圧縮中…', '압축 중…', 'Comprimiendo…', 'Compression…'),
    '下载': S('Download', 'ダウンロード', '다운로드', 'Descargar', 'Télécharger'),
    '保留原格式': S('Keep original', '元フォーマット維持', '원본 형식 유지', 'Mantener original', 'Garder l’original'),
    '浏览器编码失败（可能不支持该格式）': S('Browser encoding failed (format may be unsupported)', 'ブラウザでのエンコードに失敗しました（未対応の形式の可能性）', '브라우저 인코딩 실패(미지원 형식일 수 있음)', 'Error de codificación del navegador (formato posiblemente no soportado)', 'Échec de l’encodage navigateur (format peut-être non pris en charge)'),
    '原图 {size}': S('Original {size}', '元画像 {size}', '원본 {size}', 'Original {size}', 'Original {size}'),

    /* ---- codec-box ---- */
    'codec-box · 编解码工具箱': S('codec-box · Codec Toolbox', 'codec-box · エンコード道具箱', 'codec-box · 코덱 도구', 'codec-box · Caja de códecs', 'codec-box · Boîte à codecs'),
    '编解码工具箱 · 纯本地处理': S('Encode / decode · 100% local', 'エンコード・デコード · 完全ローカル', '인코딩·디코딩 · 100% 로컬', 'Codificar / decodificar · 100% local', 'Encodage / décodage · 100% local'),
    '输入要编码/解码的文本（解码支持标准与 URL-safe 变体）': S('Text to encode / decode (decoding accepts standard and URL-safe variants)', 'エンコード／デコードするテキスト（デコードは標準と URL-safe 両対応）', '인코딩/디코딩할 텍스트(디코딩은 표준·URL-safe 모두 지원)', 'Texto para codificar / decodificar (acepta variantes estándar y URL-safe)', 'Texte à encoder / décoder (décodage : variantes standard et URL-safe)'),
    '编码 →': S('Encode →', 'エンコード →', '인코딩 →', 'Codificar →', 'Encoder →'),
    '← 解码': S('← Decode', '← デコード', '← 디코딩', '← Decodificar', '← Décoder'),
    '→ \\u 转义': S('→ \\u escape', '→ \\u エスケープ', '→ \\u 이스케이프', '→ Escape \\u', '→ Échappement \\u'),
    '\\u → 文本': S('\\u → text', '\\u → テキスト', '\\u → 텍스트', '\\u → texto', '\\u → texte'),
    '输入要编码/解码的 URL 或文本': S('URL or text to encode / decode', 'エンコード／デコードする URL やテキスト', '인코딩/디코딩할 URL 또는 텍스트', 'URL o texto para codificar / decodificar', 'URL ou texte à encoder / décoder'),
    '输入文本或 \\uXXXX 转义序列': S('Text or \\uXXXX escape sequences', 'テキストまたは \\uXXXX エスケープ列', '텍스트 또는 \\uXXXX 이스케이프', 'Texto o secuencias \\uXXXX', 'Texte ou séquences \\uXXXX'),
    '粘贴 JWT（header.payload.signature），仅解码不验证签名': S('Paste a JWT (header.payload.signature) — decoded only, signature not verified', 'JWT を貼り付け（header.payload.signature）——デコードのみで署名は検証しません', 'JWT 붙여넣기(header.payload.signature) — 디코딩만 하며 서명은 검증하지 않음', 'Pega un JWT (header.payload.signature): solo se decodifica, la firma no se verifica', 'Collez un JWT (header.payload.signature) — décodage seul, signature non vérifiée'),
    '复制结果': S('Copy result', '結果をコピー', '결과 복사', 'Copiar resultado', 'Copier le résultat'),
    '已复制': S('Copied', 'コピーしました', '복사됨', 'Copiado', 'Copié'),
    '结果': S('Result', '結果', '결과', 'Resultado', 'Résultat'),
    '⚠ JWT 仅做 Base64 解码展示。签名未验证——任何知道你 payload 的人都能构造 token，鉴权必须在服务端完成。': S('⚠ JWT is only Base64-decoded for display. The signature is NOT verified — anyone who knows your payload can craft a token; authentication must happen server-side.', '⚠ JWT は Base64 デコード表示のみ。署名は未検証——payload を知る誰でも token を偽造できます。認証は必ずサーバー側で。', '⚠ JWT는 Base64 디코딩 표시일 뿐입니다. 서명은 검증되지 않았으므로 인증은 반드시 서버에서 하세요.', '⚠ El JWT solo se decodifica en Base64. La firma NO se verifica: cualquiera que conozca tu payload puede falsificar un token; la autenticación debe hacerse en el servidor.', '⚠ Le JWT est seulement décodé en Base64. La signature n’est PAS vérifiée — n’importe qui connaissant votre payload peut falsifier un token; l’authentification doit se faire côté serveur.'),
    'JWT 需至少 header.payload 两段（以 . 分隔）': S('A JWT needs at least header.payload (dot-separated)', 'JWT には最低限 header.payload（. 区切り）が必要です', 'JWT는 최소 header.payload(점 구분)이 필요합니다', 'Un JWT necesita al menos header.payload (separado por puntos)', 'Un JWT requiert au moins header.payload (séparé par un point)'),
    '无法解析为时间': S('Cannot parse as a time', '時刻として解釈できません', '시간으로 해석할 수 없습니다', 'No se puede interpretar como tiempo', 'Impossible d’interpréter comme une date'),
    '输入秒/毫秒时间戳，或 "2025-01-01 08:00" 这样的日期': S('A seconds/milliseconds timestamp, or a date like "2025-01-01 08:00"', '秒／ミリ秒のタイムスタンプ、または「2025-01-01 08:00」形式の日付', '초/밀리초 타임스탬프 또는 "2025-01-01 08:00" 형식의 날짜', 'Marca de tiempo en segundos/milisegundos, o fecha tipo "2025-01-01 08:00"', 'Horodatage en secondes/millisecondes, ou date type « 2025-01-01 08:00 »'),
    '转换': S('Convert', '変換', '변환', 'Convertir', 'Convertir'),
    'exp 过期时间': S('exp expiry', 'exp 失効時刻', 'exp 만료 시간', 'exp expiración', 'exp expiration'),
    'iat 签发时间': S('iat issued at', 'iat 発行時刻', 'iat 발행 시간', 'iat emitido', 'iat émis le'),
    'nbf 生效时间': S('nbf not before', 'nbf 有効開始', 'nbf 유효 시작', 'nbf no antes', 'nbf pas avant'),
    '已过期': S('expired', '期限切れ', '만료됨', 'expirado', 'expiré'),
    '有效期内': S('valid', '有効期内', '유효 기간 내', 'vigente', 'valide'),
    'alg     : 未声明': S('alg     : not declared', 'alg     : 未宣言', 'alg     : 미선언', 'alg     : no declarado', 'alg     : non déclaré'),
    'signature : 无（unsigned）': S('signature : none (unsigned)', 'signature : なし（unsigned）', 'signature : 없음(unsigned)', 'signature : ninguna (unsigned)', 'signature : aucune (unsigned)'),
    '（未验证，仅解码）': S(' (not verified, decoded only)', '（未検証、デコードのみ）', ' (미검증, 디코딩만)', ' (no verificado, solo decodificado)', ' (non vérifié, décodage seul)'),
    'payload 会自动解析 exp / iat / nbf 时间声明并标注是否过期。': S('The payload’s exp / iat / nbf time claims are parsed automatically and annotated as expired or valid.', 'payload の exp / iat / nbf 時刻クレームを自動解析し、期限切れかどうかを注記します。', 'payload의 exp / iat / nbf 시간 클레임을 자동 해석해 만료 여부를 표시합니다.', 'Las marcas exp / iat / nbf del payload se analizan y se anotan como expiradas o válidas.', 'Les claims exp / iat / nbf du payload sont analysés et annotés expirés ou valides.'),
    '日期时间 : {v}': S('Date time : {v}', '日時 : {v}', '날짜 시간 : {v}', 'Fecha y hora : {v}', 'Date heure : {v}'),
    'ISO 8601 : {v}': S('ISO 8601 : {v}', 'ISO 8601 : {v}', 'ISO 8601 : {v}', 'ISO 8601 : {v}', 'ISO 8601 : {v}'),
    '秒级时间戳 : {v}': S('Seconds : {v}', '秒単位 : {v}', '초 단위 : {v}', 'Segundos : {v}', 'Secondes : {v}'),
    '毫秒时间戳 : {v}': S('Milliseconds : {v}', 'ミリ秒 : {v}', '밀리초 : {v}', 'Milisegundos : {v}', 'Millisecondes : {v}'),
    '相对 now : {v} 秒（负数为过去）': S('Relative to now : {v} s (negative = past)', '現在からの差分 : {v} 秒（負で過去）', '현재 기준 : {v}초(음수는 과거)', 'Relativo a ahora : {v} s (negativo = pasado)', 'Relatif à maintenant : {v} s (négatif = passé)'),
    'alg     : {v}': S('alg     : {v}', 'alg     : {v}', 'alg     : {v}', 'alg     : {v}', 'alg     : {v}'),
    'signature : {v}': S('signature : {v}', 'signature : {v}', 'signature : {v}', 'signature : {v}', 'signature : {v}'),

    /* ---- regex-lab ---- */
    'regex-lab · 正则调试器': S('regex-lab · Regex Lab', 'regex-lab · 正則デバッガー', 'regex-lab · 정규식 랩', 'regex-lab · Laboratorio de regex', 'regex-lab · Labo regex'),
    '正则调试 · 实时高亮 · 分组捕获': S('Regex debugging · live highlighting · capture groups', '正則デバッグ · リアルタイムハイライト · キャプチャ群', '정규식 디버깅 · 실시간 하이라이트 · 캡처 그룹', 'Depuración de regex · resaltado en vivo · grupos de captura', 'Débogage regex · surlignage en direct · groupes de capture'),
    '在此输入正则，如 (?<year>\\d{4})-(\\d{2})': S('Enter a regex, e.g. (?<year>\\d{4})-(\\d{2})', '正則を入力（例: (?<year>\\d{4})-(\\d{2})）', '정규식 입력, 예: (?<year>\\d{4})-(\\d{2})', 'Introduce una regex, p. ej. (?<year>\\d{4})-(\\d{2})', 'Saisissez une regex, ex. (?<year>\\d{4})-(\\d{2})'),
    '粘贴要测试的文本…': S('Paste the text to test…', 'テストするテキストを貼り付け…', '테스트할 텍스트 붙여넣기…', 'Pega el texto a probar…', 'Collez le texte à tester…'),
    '替换为…（支持 $1 引用分组、$<name> 引用命名分组）': S('Replace with… ($1 for groups, $<name> for named groups)', '置換後…（$1 でグループ、$<name> で名前付きグループを参照）', '바꾸기…($1 그룹 참조, $<name> 이름 그룹 참조)', 'Reemplazar con… ($1 grupos, $<name> grupos con nombre)', 'Remplacer par… ($1 groupes, $<name> groupes nommés)'),
    ' g 全局': S(' g global', ' g グローバル', ' g 전역', ' g global', ' g global'),
    ' i 忽略大小写': S(' i ignore case', ' i 大小文字無視', ' i 대소문자 무시', ' i ignorar mayúsculas', ' i ignorer la casse'),
    ' m 多行': S(' m multiline', ' m 複数行', ' m 여러 줄', ' m multilínea', ' m multiligne'),
    ' s 点匹配换行': S(' s dot matches newline', ' s ドットが改行に一致', ' s 점이 줄바꿈과 일치', ' s el punto coincide con saltos', ' s le point correspond aux sauts'),
    ' u Unicode': S(' u Unicode', ' u Unicode', ' u Unicode', ' u Unicode', ' u Unicode'),
    '0 个匹配': S('0 matches', '0 件の一致', '0개 일치', '0 coincidencias', '0 correspondance'),
    '{n} 个匹配': S('{n} matches', '{n} 件の一致', '{n}개 일치', '{n} coincidencias', '{n} correspondances'),
    ' · lastIndex 结束于 {v}': S(' · lastIndex ends at {v}', ' · lastIndex 終了位置 {v}', ' · lastIndex 끝 {v}', ' · lastIndex termina en {v}', ' · lastIndex fin à {v}'),
    '输入正则与文本后，这里实时高亮匹配。': S('Matches are highlighted here live once you enter a regex and text.', '正則とテキストを入力すると、ここに一致がハイライト表示されます。', '정규식과 텍스트를 입력하면 여기에 일치 항목이 표시됩니다.', 'Las coincidencias se resaltan aquí en vivo.', 'Les correspondances sont surlignées ici en direct.'),
    '替换为…': S('Replace with…', '置換後…', '바꾸기…', 'Reemplazar con…', 'Remplacer par…'),
    '位置': S('Position', '位置', '위치', 'Posición', 'Position'),
    '匹配': S('Match', '一致', '일치', 'Coincidencia', 'Correspondance'),
    '分组': S('Groups', 'グループ', '그룹', 'Grupos', 'Groupes'),
    '（无标志）': S('(no flags)', '（フラグなし）', '(플래그 없음)', '(sin flags)', '(sans flags)'),
    '（空）': S('(empty)', '（空）', '(비어 있음)', '(vacío)', '(vide)'),
    '\\d 数字': S('\\d digit', '\\d 数字', '\\d 숫자', '\\d dígito', '\\d chiffre'),
    '\\w 词字符': S('\\w word char', '\\w 単語文字', '\\w 단어 문자', '\\w carácter de palabra', '\\w caractère de mot'),
    '\\s 空白': S('\\s whitespace', '\\s 空白', '\\s 공백', '\\s espacio en blanco', '\\s espace'),
    '中文': S('Chinese', '中文', '중국어', 'Chino', 'Chinois'),
    'IP 段': S('IP segment', 'IP セグメント', 'IP 대역', 'Segmento de IP', 'Segmento d’IP'),
    '邮箱': S('Email', 'メールアドレス', '이메일', 'Correo', 'E-mail'),
    'URL': S('URL', 'URL', 'URL', 'URL', 'URL'),
    '十六进制': S('Hexadecimal', '十六進数', '16진수', 'Hexadecimal', 'Hexadécimal'),
    '博客搭建于 2023-08-15，第一篇 kali 系列发布于 2024-03-02，重构发生在 2025-11-01。': S('The blog launched on 2023-08-15, the first kali series post was published on 2024-03-02, and the rewrite happened on 2025-11-01.', 'ブログは 2023-08-15 に開設し、最初の kali シリーズは 2024-03-02 に公開、刷新は 2025-11-01 に行われました。', '블로그는 2023-08-15에 개설되었고, 첫 kali 시리즈는 2024-03-02에 발행되었으며, 리팩터링은 2025-11-01에 있었습니다.', 'El blog se lanzó el 2023-08-15, la serie kali se publicó el 2024-03-02 y la refactorización fue el 2025-11-01.', 'Le blog a été lancé le 2023-08-15, la série kali publiée le 2024-03-02, et la refonte a eu lieu le 2025-11-01.'),

    /* ---- hash-kit ---- */
    'hash-kit · 哈希与密码工具': S('hash-kit · Hash & Password Kit', 'hash-kit · ハッシュ・パスワード', 'hash-kit · 해시·비밀번호 도구', 'hash-kit · Kit de hash y contraseñas', 'hash-kit · Kit hash & mots de passe'),
    '哈希摘要 · 密码生成 · 纯本地 WebCrypto': S('Hashing · Password generation · local WebCrypto', 'ハッシュ · パスワード生成 · ローカル WebCrypto', '해시 · 비밀번호 생성 · 로컬 WebCrypto', 'Hashes · Generación de contraseñas · WebCrypto local', 'Hachage · Génération de mots de passe · WebCrypto local'),
    '输入要计算摘要的文本…': S('Text to hash…', 'ハッシュ計算するテキスト…', '해시 계산할 텍스트…', 'Texto para calcular el hash…', 'Texte à hacher…'),
    '计算': S('Compute', '計算', '계산', 'Calcular', 'Calculer'),
    '复制全部': S('Copy all', 'すべてコピー', '모두 복사', 'Copiar todo', 'Tout copier'),
    '复制': S('Copy', 'コピー', '복사', 'Copiar', 'Copier'),
    '已复制': S('Copied', 'コピーしました', '복사됨', 'Copiado', 'Copié'),
    '或拖入文件计算文件哈希（完整性校验用）': S('or drop a file to compute its hash (integrity check)', 'またはファイルをドロップしてハッシュ計算（整合性確認）', '또는 파일을 끌어다 놓아 해시 계산(무결성 확인)', 'o suelta un archivo para calcular su hash (verificación de integridad)', 'ou déposez un fichier pour calculer son hash (contrôle d’intégrité)'),
    'SHA-1 仅用于兼容校验，已不具密码学安全性；需要防碰撞请用 SHA-256 及以上。浏览器 SubtleCrypto 不提供 MD5——正因它已不安全。': S('SHA-1 is for compatibility checks only and is no longer cryptographically secure; use SHA-256 or above for collision resistance. The browser’s SubtleCrypto does not provide MD5 — precisely because it is insecure.', 'SHA-1 は互換性確認専用で、暗号学的安全性は既にありません。衝突耐性が必要なら SHA-256 以上を。ブラウザの SubtleCrypto は MD5 を提供しません——まさに安全でないためです。', 'SHA-1은 호환성 확인용이며 더 이상 암호학적으로 안전하지 않습니다. 충돌 저항이 필요하면 SHA-256 이상을 사용하세요. 브라우저 SubtleCrypto는 MD5를 제공하지 않습니다——바로 불안전하기 때문입니다.', 'SHA-1 es solo para comprobaciones de compatibilidad y ya no es criptográficamente seguro; usa SHA-256 o superior. El SubtleCrypto del navegador no ofrece MD5 — precisamente porque es inseguro.', 'SHA-1 ne sert qu’aux contrôles de compatibilité et n’est plus cryptographiquement sûr; utilisez SHA-256 ou plus. Le SubtleCrypto du navigateur ne fournit pas MD5 — précisément parce qu’il n’est pas sûr.'),
    '密码生成器': S('Password generator', 'パスワード生成', '비밀번호 생성기', 'Generador de contraseñas', 'Générateur de mots de passe'),
    '点击生成': S('Click generate', '生成をクリック', '생성을 클릭', 'Pulsa generar', 'Cliquez sur générer'),
    '长度': S('Length', '長さ', '길이', 'Longitud', 'Longueur'),
    '排除易混淆（0O1lI）': S('Exclude ambiguous (0O1lI)', '紛らわしい文字を除外（0O1lI）', '혼동하기 쉬운 문자 제외(0O1lI)', 'Excluir ambiguos (0O1lI)', 'Exclure les ambigus (0O1lI)'),
    '至少选择一个字符集': S('Select at least one character set', '少なくとも 1 つの文字セットを選択してください', '최소 한 개의 문자 집합을 선택하세요', 'Selecciona al menos un conjunto de caracteres', 'Sélectionnez au moins un jeu de caractères'),
    '{n} 字符 · {n2} 字节': S('{n} chars · {n2} bytes', '{n} 文字 · {n2} バイト', '{n}자 · {n2}바이트', '{n} caracteres · {n2} bytes', '{n} caractères · {n2} octets'),
    '{name} · {size} · 计算中…': S('{name} · {size} · hashing…', '{name} · {size} · 計算中…', '{name} · {size} · 해시 중…', '{name} · {size} · calculando…', '{name} · {size} · calcul…'),
    '熵 {e} bit（{level}）· 字符池 {n} · ': S('Entropy {e} bit ({level}) · pool {n} · ', 'エントロピー {e} bit（{level}）· 文字プール {n} · ', '엔트로피 {e}bit({level}) · 문자 집합 {n} · ', 'Entropía {e} bit ({level}) · pool {n} · ', 'Entropie {e} bit ({level}) · pool {n} · '),
    '100 亿次/秒 离线暴力破解需约 {v}': S('Offline brute-force at 10B guesses/s would take about {v}', '100 億回/秒のオフライン総当たりには約 {v}', '초당 100억 회 오프라인 무차별 대입에는 약 {v}', 'Fuerza bruta sin conexión a 10B intentos/s tomaría unos {v}', 'Force brute hors ligne à 10G essais/s prendrait env. {v}'),
    '很弱': S('very weak', '非常に弱い', '매우 약함', 'muy débil', 'très faible'),
    '弱': S('weak', '弱い', '약함', 'débil', 'faible'),
    '中等': S('moderate', '普通', '보통', 'moderada', 'moyenne'),
    '强': S('strong', '強い', '강함', 'fuerte', 'forte'),
    '非常强': S('very strong', '非常に強い', '매우 강함', 'muy fuerte', 'très forte'),
    '远超宇宙年龄': S('far beyond the age of the universe', '宇宙の年齢をはるかに超える', '우주 나이보다 훨씬 깁니다', 'más que la edad del universo', 'bien plus que l’âge de l’univers'),
    '{v} 年': S('{v} years', '{v} 年', '{v}년', '{v} años', '{v} ans'),
    '{v} 秒': S('{v} seconds', '{v} 秒', '{v}초', '{v} segundos', '{v} secondes'),

    /* ---- json-kit ---- */
    'json-kit · JSON 工具集': S('json-kit · JSON Kit', 'json-kit · JSONキット', 'json-kit · JSON 키트', 'json-kit · Kit JSON', 'json-kit · Kit JSON'),
    'JSON 格式化 · YAML 互转 · TypeScript 类型生成': S('JSON formatting · YAML conversion · TypeScript type generation', 'JSON 整形 · YAML 変換 · TypeScript 型生成', 'JSON 포맷·YAML 변환·TypeScript 타입 생성', 'Formato JSON · Conversión YAML · Tipos TypeScript', 'Formatage JSON · Conversion YAML · Types TypeScript'),
    '输入（自动识别 JSON / YAML）': S('Input (auto-detects JSON / YAML)', '入力（JSON／YAML 自動判別）', '입력(JSON/YAML 자동 인식)', 'Entrada (detecta JSON / YAML)', 'Entrée (détection auto JSON / YAML)'),
    '格式化': S('Format', '整形', '포맷', 'Formatear', 'Formater'),
    '压缩': S('Minify', '圧縮', '압축', 'Minificar', 'Minifier'),
    '→ YAML': S('→ YAML', '→ YAML', '→ YAML', '→ YAML', '→ YAML'),
    '← YAML 转为 JSON': S('← YAML to JSON', '← YAML を JSON に', '← YAML을 JSON으로', '← YAML a JSON', '← YAML vers JSON'),
    '复制输出': S('Copy output', '出力をコピー', '출력 복사', 'Copiar salida', 'Copier la sortie'),
    '输出 → 输入': S('Output → input', '出力 → 入力', '출력 → 입력', 'Salida → entrada', 'Sortie → entrée'),
    '输出': S('Output', '出力', '출력', 'Salida', 'Sortie'),
    '左侧输入会自动识别格式：以 { 或 [ 开头按 JSON 解析，否则按 YAML 解析。': S('The input format is auto-detected: text starting with { or [ is parsed as JSON, otherwise as YAML.', '入力形式は自動判別：{ または [ で始まれば JSON、それ以外は YAML として解析します。', '입력 형식 자동 인식: { 또는 [로 시작하면 JSON, 아니면 YAML로 해석합니다.', 'El formato de entrada se detecta automáticamente: { o [ se analiza como JSON, si no como YAML.', 'Le format d’entrée est détecté automatiquement : { ou [ → JSON, sinon YAML.'),
    'YAML 转换由 js-yaml（CDN 按需加载）完成；TS 类型为本地纯前端生成。': S('YAML conversion is powered by js-yaml (CDN, loaded on demand); TypeScript types are generated entirely in the frontend.', 'YAML 変換は js-yaml（CDN 遅延読み込み）が担当。TS 型はフロントエンド内で生成します。', 'YAML 변환은 js-yaml(CDN 지연 로드)이 담당하며, TS 타입은 프런트엔드에서 생성됩니다.', 'La conversión YAML usa js-yaml (CDN bajo demanda); los tipos TypeScript se generan en el frontend.', 'La conversion YAML utilise js-yaml (CDN chargé à la demande); les types TS sont générés côté frontend.'),
    'JSON 输入': S('JSON input', 'JSON 入力', 'JSON 입력', 'Entrada JSON', 'Entrée JSON'),
    '生成 TypeScript': S('Generate TypeScript', 'TypeScript を生成', 'TypeScript 생성', 'Generar TypeScript', 'Générer TypeScript'),
    '复制': S('Copy', 'コピー', '복사', 'Copiar', 'Copier'),
    '根类型名': S('Root type name', 'ルート型名', '루트 타입 이름', 'Nombre del tipo raíz', 'Nom du type racine'),
    'TypeScript 输出': S('TypeScript output', 'TypeScript 出力', 'TypeScript 출력', 'Salida TypeScript', 'Sortie TypeScript'),
    '数组取元素并集推断；null → 可选字段；同字段多类型 → 联合类型；接口名由 key PascalCase 生成，递归嵌套。': S('Arrays infer from element unions; null → optional fields; mixed types → unions; interface names are PascalCased from keys, nested recursively.', '配列は要素のUnionから推論。null → 任意フィールド。複数型 → Union。インターフェース名は key を PascalCase にして再帰的に生成。', '배열은 요소 합집합으로 추론; null → 선택 필드; 혼합 타입 → 유니언; 인터페이스 이름은 key PascalCase로 재귀 생성.', 'Los arrays infieren de uniones de elementos; null → campos opcionales; tipos mixtos → uniones; los nombres de interfaz se PascalCasean de las claves, anidado recursivo.', 'Les tableaux infèrent des unions d’éléments; null → champs optionnels; types mixtes → unions; les noms d’interface sont PascalCase des clés, imbrication récursive.'),
    'js-yaml（CDN）尚未加载完成': S('js-yaml (CDN) has not finished loading', 'js-yaml（CDN）の読み込みが完了していません', 'js-yaml(CDN) 아직 로드되지 않았습니다', 'js-yaml (CDN) aún no ha cargado', 'js-yaml (CDN) pas encore chargé'),
    'js-yaml（CDN）尚未加载完成，请重试': S('js-yaml (CDN) has not finished loading — please retry', 'js-yaml（CDN）の読み込みが未完了です。再試行してください', 'js-yaml(CDN) 로드가 완료되지 않았습니다. 다시 시도하세요', 'js-yaml (CDN) aún no ha cargado; reintenta', 'js-yaml (CDN) pas encore chargé — réessayez'),
    '输入为空': S('Input is empty', '入力が空です', '입력이 비어 있습니다', 'La entrada está vacía', 'L’entrée est vide'),
    '已交换到输入区': S('Swapped to input', '入力に交換しました', '입력으로 교환했습니다', 'Intercambiado a la entrada', 'Interverti vers l’entrée'),
    '根级必须是对象，或包含对象的数组': S('The root must be an object, or an array of objects', 'ルートはオブジェクトか、オブジェクトの配列である必要があります', '루트는 객체이거나 객체 배열이어야 합니다', 'La raíz debe ser un objeto o un array de objetos', 'La racine doit être un objet ou un tableau d’objets'),

    /* ---- md-convert ---- */
    'md-convert · Markdown 转换器': S('md-convert · Markdown Converter', 'md-convert · Markdown 変換器', 'md-convert · Markdown 변환기', 'md-convert · Conversor Markdown', 'md-convert · Convertisseur Markdown'),
    'Markdown → HTML / Word / PDF 打印': S('Markdown → HTML / Word / PDF print', 'Markdown → HTML／Word／PDF 印刷', 'Markdown → HTML/Word/PDF 인쇄', 'Markdown → HTML / Word / impresión PDF', 'Markdown → HTML / Word / impression PDF'),
    '渲染预览': S('Render preview', 'プレビュー生成', '미리보기 렌더링', 'Renderizar vista previa', 'Rendu de l’aperçu'),
    '下载 HTML': S('Download HTML', 'HTML をダウンロード', 'HTML 다운로드', 'Descargar HTML', 'Télécharger le HTML'),
    '导出 Word (.docx)': S('Export Word (.docx)', 'Word (.docx) をエクスポート', 'Word(.docx) 내보내기', 'Exportar Word (.docx)', 'Exporter Word (.docx)'),
    '打印 / 存为 PDF': S('Print / Save as PDF', '印刷／PDF 保存', '인쇄/PDF 저장', 'Imprimir / Guardar como PDF', 'Imprimer / Enregistrer en PDF'),
    '复制 HTML': S('Copy HTML', 'HTML をコピー', 'HTML 복사', 'Copiar HTML', 'Copier le HTML'),
    'Markdown 输入': S('Markdown input', 'Markdown 入力', 'Markdown 입력', 'Entrada Markdown', 'Entrée Markdown'),
    '预览': S('Preview', 'プレビュー', '미리보기', 'Vista previa', 'Aperçu'),
    '渲染后在这里预览。': S('The rendered preview appears here.', 'レンダリング結果がここに表示されます。', '렌더링 결과가 여기에 표시됩니다.', 'La vista previa aparece aquí.', 'L’aperçu s’affiche ici.'),
    '支持拖拽 .md / .markdown 文件到输入框直接载入。': S('Drag a .md / .markdown file onto the input to load it.', '.md／.markdown ファイルを入力欄にドロップして読み込めます。', '.md/.markdown 파일을 입력 영역으로 끌어다 놓아 불러올 수 있습니다.', 'Arrastra un archivo .md / .markdown a la entrada para cargarlo.', 'Glissez un fichier .md / .markdown sur l’entrée pour le charger.'),
    '弹窗被拦截，请允许后重试': S('Popup blocked — please allow popups and retry', 'ポップアップがブロックされました。許可して再試行してください', '팝업이 차단되었습니다. 허용 후 다시 시도하세요', 'Ventana emergente bloqueada; permítela y reintenta', 'Popup bloquée — autorisez les popups et réessayez'),
    '已复制': S('Copied', 'コピーしました', '복사됨', 'Copiado', 'Copié'),

    /* ---- xlsx-convert ---- */
    '拖入 ': S('Drop ', 'ドラッグ：', '끌어다 놓기: ', 'Arrastra ', 'Glissez '),
    '.xlsx / .xls / .csv': S('.xlsx / .xls / .csv', '.xlsx / .xls / .csv', '.xlsx / .xls / .csv', '.xlsx / .xls / .csv', '.xlsx / .xls / .csv'),
    ' 文件，或点击选择': S(' files, or click to browse', ' ファイル、またはクリックで選択', ' 파일, 또는 클릭해서 선택', ' archivos, o haz clic para elegir', ' fichiers, ou cliquez pour parcourir'),
    '未载入文件': S('No file loaded', 'ファイル未読み込み', '파일未load', 'Ningún archivo cargado', 'Aucun fichier chargé'),
    '数据预览（首 100 行）': S('Data preview (first 100 rows)', 'データプレビュー（先頭 100 行）', '데이터 미리보기(첫 100행)', 'Vista previa (primeras 100 filas)', 'Aperçu des données (100 premières lignes)'),
    '导出 CSV': S('Export CSV', 'CSV をエクスポート', 'CSV 내보내기', 'Exportar CSV', 'Exporter en CSV'),
    '导出 JSON': S('Export JSON', 'JSON をエクスポート', 'JSON 내보내기', 'Exportar JSON', 'Exporter en JSON'),
    '导出 Markdown 表格': S('Export Markdown table', 'Markdown テーブルをエクスポート', 'Markdown 표 내보내기', 'Exportar tabla Markdown', 'Exporter un tableau Markdown'),
    '导出 Excel (.xlsx)': S('Export Excel (.xlsx)', 'Excel (.xlsx) をエクスポート', 'Excel(.xlsx) 내보내기', 'Exportar Excel (.xlsx)', 'Exporter Excel (.xlsx)'),
    '工作表': S('Sheet', 'シート', '시트', 'Hoja', 'Feuille'),
    '粘贴文本 → 导出': S('Paste text → export', 'テキスト貼り付け → エクスポート', '텍스트 붙여넣기 → 내보내기', 'Pegar texto → exportar', 'Coller du texte → exporter'),
    '直接粘贴 CSV / TSV（从 Excel 复制出来就是 TSV），或 JSON 数组，然后选择导出格式': S('Paste CSV / TSV directly (what Excel copies is TSV), or a JSON array, then pick an export format', 'CSV／TSV（Excel からコピーすると TSV）や JSON 配列を貼り付け、出力形式を選択', 'CSV/TSV(Excel에서 복사하면 TSV) 또는 JSON 배열을 붙여넣고 내보내기 형식을 선택', 'Pega CSV / TSV directamente (lo que copia Excel es TSV), o un array JSON, y elige el formato', 'Collez du CSV / TSV directement (ce qu’Excel copie est du TSV), ou un tableau JSON, puis choisissez le format'),
    '导出为': S('Export as', '出力形式', '내보내기', 'Exportar como', 'Exporter en'),
    'converted.xlsx': S('converted.xlsx', 'converted.xlsx', 'converted.xlsx', 'converted.xlsx', 'converted.xlsx'),

    /* ---- media-convert ---- */
    'media-convert · 音视频转换': S('media-convert · Media Converter', 'media-convert · メディア変換', 'media-convert · 미디어 변환기', 'media-convert · Conversor multimedia', 'media-convert · Convertisseur multimédia'),
    '音视频格式转换 · ffmpeg.wasm 本地运行': S('Audio / video conversion · ffmpeg.wasm running locally', '音動画変換 · ffmpeg.wasm ローカル実行', '오디오·비디오 변환 · ffmpeg.wasm 로컬 실행', 'Conversión de audio/video · ffmpeg.wasm local', 'Conversion audio/vidéo · ffmpeg.wasm en local'),
    '拖入 ': S('Drop ', 'ドラッグ：', '끌어다 놓기: ', 'Arrastra ', 'Glissez '),
    '视频 / 音频': S('video / audio', '動画／音声', '비디오/오디오', 'vídeo / audio', 'vidéo / audio'),
    ' 文件（mp4 · mov · webm · mp3 · wav …）': S(' files (mp4 · mov · webm · mp3 · wav …)', ' ファイル（mp4 · mov · webm · mp3 · wav …）', ' 파일(mp4 · mov · webm · mp3 · wav …)', ' archivos (mp4 · mov · webm · mp3 · wav …)', ' fichiers (mp4 · mov · webm · mp3 · wav …)'),
    '未选择文件': S('No file selected', 'ファイル未選択', '파일未선택', 'Ningún archivo seleccionado', 'Aucun fichier sélectionné'),
    '转换为': S('Convert to', '変換先', '변환 대상', 'Convertir a', 'Convertir en'),
    'MP4（H.264 重编码）': S('MP4 (H.264 re-encode)', 'MP4（H.264 再エンコード）', 'MP4(H.264 재인코딩)', 'MP4 (re-codificación H.264)', 'MP4 (ré-encodage H.264)'),
    'WebM（VP8/Vorbis）': S('WebM (VP8/Vorbis)', 'WebM（VP8/Vorbis）', 'WebM(VP8/Vorbis)', 'WebM (VP8/Vorbis)', 'WebM (VP8/Vorbis)'),
    'GIF 动图（480p · 10fps）': S('GIF animation (480p · 10fps)', 'GIF アニメ（480p · 10fps）', 'GIF 애니메이션(480p · 10fps)', 'GIF animado (480p · 10fps)', 'GIF animé (480p · 10fps)'),
    '仅提取音轨 → MP3': S('Extract audio → MP3', '音声抽出 → MP3', '오디오 추출 → MP3', 'Extraer audio → MP3', 'Extraire l’audio → MP3'),
    'MP3': S('MP3', 'MP3', 'MP3', 'MP3', 'MP3'),
    'WAV（无压缩）': S('WAV (uncompressed)', 'WAV（無圧縮）', 'WAV(무압축)', 'WAV (sin compresión)', 'WAV (sans compression)'),
    'OGG（Vorbis）': S('OGG (Vorbis)', 'OGG（Vorbis）', 'OGG(Vorbis)', 'OGG (Vorbis)', 'OGG (Vorbis)'),
    '开始转换': S('Convert', '変換開始', '변환 시작', 'Convertir', 'Convertir'),
    '加载 ffmpeg 核心…（首次约 25 MB）': S('Loading the ffmpeg core… (about 25 MB the first time)', 'ffmpeg コアを読み込み中…（初回約 25 MB）', 'ffmpeg 코어 불러오는 중…(첫 약 25MB)', 'Cargando el núcleo de ffmpeg… (unos 25 MB la primera vez)', 'Chargement du cœur ffmpeg… (env. 25 Mo la première fois)'),
    '转码中…': S('Transcoding…', 'トランスコード中…', '트랜스코딩 중…', 'Transcodificando…', 'Transcodage…'),
    'ffmpeg 日志': S('ffmpeg log', 'ffmpeg ログ', 'ffmpeg 로그', 'Registro de ffmpeg', 'Journal ffmpeg'),
    '下载结果': S('Download result', '結果をダウンロード', '결과 다운로드', 'Descargar resultado', 'Télécharger le résultat'),
    '完成：{a} → {b}': S('Done: {a} → {b}', '完了：{a} → {b}', '완료: {a} → {b}', 'Hecho: {a} → {b}', 'Terminé : {a} → {b}'),
    '首次转换需下载 ffmpeg 核心（约 25 MB，之后走浏览器缓存）。转码完全在你的设备上进行；大文件和慢设备请耐心等待。单线程核心无需特殊响应头，但速度慢于原生 ffmpeg。': S('The first conversion downloads the ffmpeg core (about 25 MB, cached afterwards). Transcoding happens entirely on your device; be patient with large files or slow devices. The single-threaded core needs no special response headers, but is slower than native ffmpeg.', '初回変換時に ffmpeg コア（約 25 MB、以後キャッシュ）をダウンロードします。トランスコードは完全に端末内で行われます。大きいファイルや低スペック端末はお待ちください。シングルスレッドコアは特別なレスポンスヘッダ不要ですが、ネイティブより遅いです。', '첫 변환 시 ffmpeg 코어(약 25MB, 이후 캐시)를 다운로드합니다. 트랜스코딩은 완전히 기기에서 이루어집니다. 큰 파일이나 느린 기기는 시간이 걸립니다. 싱글 스레드 코어는 특별한 응답 헤더가 필요 없지만 네이티브보다 느립니다.', 'La primera conversión descarga el núcleo de ffmpeg (unos 25 MB, cacheado después). La transcodificación ocurre íntegramente en tu dispositivo; ten paciencia con archivos grandes. El núcleo monohilo no necesita cabeceras especiales, pero es más lento que el ffmpeg nativo.', 'La première conversion télécharge le cœur ffmpeg (env. 25 Mo, mis en cache ensuite). Le transcodage se fait entièrement sur votre appareil; soyez patient avec les gros fichiers. Le cœur monothread ne nécessite pas d’en-têtes spéciaux, mais est plus lent que le ffmpeg natif.'),
    '⚠ 无法识别的媒体类型：': S('⚠ Unrecognized media type: ', '⚠ 未対応のメディアタイプ：', '⚠ 인식할 수 없는 미디어 형식: ', '⚠ Tipo de medio no reconocido: ', '⚠ Type de média non reconnu : '),
    '转码输出为空（编码器可能不支持该输入，详见日志）': S('Transcode output is empty (the encoder may not support this input — see the log)', '変換出力が空です（エンコーダが入力に未対応の可能性。詳細はログ）', '변환 출력이 비어 있습니다(인코더가 이 입력을 지원하지 않을 수 있음 — 로그 참조)', 'La salida del transcode está vacía (el codificador puede no soportar esta entrada — ver el registro)', 'La sortie du transcodage est vide (l’encodeur ne prend peut-être pas en charge cette entrée — voir le journal)'),
    'CDN 脚本加载失败：': S('CDN script failed to load: ', 'CDN スクリプトの読み込みに失敗：', 'CDN 스크립트 로드 실패: ', 'Error al cargar el script del CDN: ', 'Échec du chargement du script CDN : ')
  }

  /* ---- 翻译查找 ---- */
  function t(zh, params) {
    var entry = DICT[zh]
    var s = (entry && entry[locale]) || zh
    if (params) {
      for (var k in params) s = s.split('{' + k + '}').join(String(params[k]))
    }
    return s
  }

  /* ---- 应用：文本节点精确替换 + 常用属性 ---- */
  function apply() {
    if (locale === 'zh') return
    var map = DICT[locale]
    if (!map) return
    var walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null)
    var nodes = []
    while (walker.nextNode()) {
      var value = walker.currentNode.textContent
      if (map[value]) nodes.push([walker.currentNode, map[value]])
    }
    nodes.forEach(function (pair) { pair[0].textContent = pair[1] })
    document.querySelectorAll('[placeholder], [title], [aria-label]').forEach(function (el) {
      ;['placeholder', 'title', 'aria-label'].forEach(function (attr) {
        var value = el.getAttribute && el.getAttribute(attr)
        if (value && map[value]) el.setAttribute(attr, map[value])
      })
    })
    if (map[document.title]) document.title = map[document.title]
  }

  /* ---- 语言胶囊（固定左下角）：切换后持久化并整页刷新 ---- */
  function injectSwitcher() {
    if (document.getElementById('ti18n-switch')) return
    var wrap = document.createElement('div')
    wrap.id = 'ti18n-switch'
    wrap.style.cssText = 'position:fixed;left:14px;bottom:14px;z-index:9999;font:12px/1 -apple-system,sans-serif'
    var select = document.createElement('select')
    select.style.cssText = 'border:1px solid rgba(120,100,70,.4);border-radius:999px;padding:5px 8px;background:rgba(255,253,248,.9);color:#17263d;cursor:pointer'
    select.setAttribute('aria-label', 'Language')
    ORDER.forEach(function (code) {
      var opt = document.createElement('option')
      opt.value = code
      opt.textContent = LABEL[code]
      if (code === locale) opt.selected = true
      select.append(opt)
    })
    select.addEventListener('change', function () {
      try { localStorage.setItem(KEY, select.value) } catch (e) { /* 忽略 */ }
      window.location.reload()
    })
    wrap.append(select)
    document.body.append(wrap)
  }

  /* 动态内容自动重翻译：工具页大量文案由 JS 构建（面板/状态行/选项）。
     * 翻译后的文本不再是词典键 → 不会无限循环；防抖合并同帧多次变更。 */
  var applyQueued = false
  var observer = new MutationObserver(function () {
    if (applyQueued || locale === 'zh') return
    applyQueued = true
    requestAnimationFrame(function () {
      applyQueued = false
      apply()
    })
  })

  function boot() {
    apply()
    injectSwitcher()
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot)
  } else {
    boot()
  }

  window.TI18N = { t: t, locale: function () { return locale }, apply: apply }
})()
