/**
 * KANRI ASSIST — Cloudflare Worker CORS プロキシ
 *
 * Anthropic API への直接ブラウザアクセスはCORSでブロックされるため、
 * このWorkerがリクエストを中継してCORSヘッダーを付与します。
 *
 * 【デプロイ手順】
 * 1. https://workers.cloudflare.com にアクセス（無料アカウント可）
 * 2. 「Workers & Pages」→「Create」→「Create Worker」
 * 3. このファイルの内容をエディタに貼り付けて「Deploy」
 * 4. 発行されたURL（例: https://kanri-proxy.your-name.workers.dev）をコピー
 * 5. KANRI ASSIST の ⚙ 設定画面「プロキシURL」に貼り付け
 */

const ALLOWED_ORIGIN = '*'; // 特定ドメインのみ許可する場合: 'https://take5446.github.io'
const ANTHROPIC_API = 'https://api.anthropic.com/v1/messages';

export default {
  async fetch(request) {
    // CORSプリフライト（OPTIONSリクエスト）への応答
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: {
          'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type, x-api-key, anthropic-version, anthropic-beta, anthropic-dangerous-request-proxy',
          'Access-Control-Max-Age': '86400',
        },
      });
    }

    if (request.method !== 'POST') {
      return new Response('Method Not Allowed', { status: 405 });
    }

    // Anthropic API へリクエストを転送
    const apiResponse = await fetch(ANTHROPIC_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': request.headers.get('x-api-key') || '',
        'anthropic-version': request.headers.get('anthropic-version') || '2023-06-01',
      },
      body: request.body,
    });

    const body = await apiResponse.text();

    // CORSヘッダーを付与してレスポンスを返す
    return new Response(body, {
      status: apiResponse.status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
      },
    });
  },
};
