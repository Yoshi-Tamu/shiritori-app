// server.js
import { serveDir } from "jsr:@std/http@1/file-server";
let previousWord = "しりとり";
let usedWords = ["しりとり"];
let gameOver = false;

// localhostにDenoのHTTPサーバーを展開
Deno.serve(async (_req) => {
    // パス名を取得する
    const pathname = new URL(_req.url).pathname;
    console.log(`pathname: ${pathname}`);

    // GET /shiritori: 直前の単語を返す
    if (_req.method === "GET" && pathname === "/shiritori") {
        return new Response(previousWord);
    }

    // POST /reset: ゲームリセット
    if (_req.method === "POST" && pathname === "/reset") {
        previousWord = "しりとり";
        usedWords = ["しりとり"];
        gameOver = false;

        return new Response(previousWord);
    }

    // POST /shiritori: 次の単語を受け取って保存する
    if (_req.method === "POST" && pathname === "/shiritori") {
        if (gameOver) {
            return new Response(
                JSON.stringify({
                    "errorMessage": "ゲームは終了しています",
                    "errorCode": "10004",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // リクエストのペイロードを取得
        const requestJson = await _req.json();
        // JSONの中からnextWordを取得
        const nextWord = requestJson["nextWord"];

        //重複チェック
        if (usedWords.includes(nextWord)) {
            gameOver = true;

            return new Response(
                JSON.stringify({
                    "errorMessage":
                        "すでに使用された単語です ゲームを終了します",
                    "errorCode": "10002",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        //ん　チェック
        if (nextWord.slice(-1) === "ん") {
            gameOver = true;

            return new Response(
                JSON.stringify({
                    "errorMessage":
                        "んで終わる単語は使えません ゲームを終了します",
                    "errorCode": "10003",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        //ひらがな　チェック
        if (!/^[ぁ-んー]+$/.test(nextWord)) {
            return new Response(
                JSON.stringify({
                    "errorMessage": "ひらがな以外は使えません",
                    "errorCode": "10005",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // previousWordの末尾とnextWordの先頭が同一か確認
        if (previousWord.slice(-1) === nextWord.slice(0, 1)) {
            // 同一であれば、previousWordを更新
            previousWord = nextWord;
            usedWords.push(nextWord);
        } // 同一でない単語の入力時に、エラーを返す
        else {
            return new Response(
                JSON.stringify({
                    "errorMessage": "前の単語に続いていません",
                    "errorCode": "10001",
                }),
                {
                    status: 400,
                    headers: {
                        "Content-Type": "application/json; charset=utf-8",
                    },
                },
            );
        }

        // 現在の単語を返す
        return new Response(previousWord);
    }

    // ./public以下のファイルを公開
    return serveDir(
        _req,
        {
            /*
            - fsRoot: 公開するフォルダを指定
            - urlRoot: フォルダを展開するURLを指定。今回はlocalhost:8000/に直に展開する
            - enableCors: CORSの設定を付加するか
            */
            fsRoot: "./public/",
            urlRoot: "",
            enableCors: true,
        },
    );
});
