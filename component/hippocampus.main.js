/*
    HippoCampus
    A remember tool with swipecard.
    (C)2019 Soruto Project
    MIT Licensed.
*/
const $$ = function (e) {
    var el = document.querySelectorAll(e);
    if (el[1]) {
        return el;
    } else {
        return el[0];
    }
}
const getURLParam = function () {
    let arg = new Object;
    const pair = location.search.substring(1).split('&');
    for (let i = 0; pair[i]; i++) {
        let kv = pair[i].split('=');
        arg[kv[0]] = kv[1];
    }
    return arg;
}

//フラグ郡
let docData = {};
let nowQNum = 0;
let questionsLength = 0;

//よく使う関数群
let usefulFn = {
    "execCopy": function (string) {
        var temp = document.createElement('textarea');

        temp.value = string;
        temp.selectionStart = 0;
        temp.selectionEnd = temp.value.length;

        var s = temp.style;
        s.position = 'fixed';
        s.left = '-100%';

        document.body.appendChild(temp);
        temp.focus();
        var result = document.execCommand('copy');
        temp.blur();
        document.body.removeChild(temp);
        // true なら実行できている falseなら失敗か対応していないか
        return result;
    },


    //文字コード変換関数(transport from https://codepen.io/catprogram/pen/YXzENB.js)
    "encodeString": function (str) {
        var array = new Uint8Array(str);
        //UTF16と32は別の配列変換をかける 
        switch (Encoding.detect(array)) {
            case 'UTF16':
                array = new Uint16Array(str);
                break;
            case 'UTF32':
                array = new Uint32Array(str);
                break;
        }
        //Unicodeへ変換
        var unicodeArray = Encoding.convert(array, 'UNICODE');
        //文字列へ変換
        var text = Encoding.codeToString(unicodeArray);
        return text;
    },

    "randomNum": function (min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}
//hca独自関数
let hca = {
    //versionDefinition
    "version": "0.5(beta)",
    //switchModes
    "switchMode": function (mode) {
        if ($$("#contents > #" + mode)) {
            const windows = $$("#contents > div");
            //console.log(windows);
            for (let i = 0; i < windows.length; i++) {
                windows[i].className = "";
            }
            $$("#contents > #" + mode).className = "show";
            //additional Options
            if (mode === "editor") $$("#editorOnly").style.display = "inline";
            else $$("#editorOnly").style.display = "none";
        } else {
            console.error("hca.switchMode():存在しないmodeが指定されています");
        }
    },
    //share CSV
    "shareCSV": function () {
        var portNum = location.port;
        if (portNum !== "") {
            var port = ":" + location.port;
        } else {
            var port = "";
        }
        const string = location.protocol + "//" + location.hostname + port + location.pathname + "?q=" + LZString.compressToEncodedURIComponent($$("#csvEditor").value);
        const result = usefulFn.execCopy(string);

        if (result === true) alert("共有用URLをクリップボードにコピーしました。");
        else alert("このブラウザでは共有機能を利用できません。");
    },
    "learn": {
        "start": function (csv) {
            docData = Papa.parse(csv, {
                skipEmptyLines:true
            });
            nowQNum = 0;
            questionsLength = docData.data.length;
            $$("#answerText").style.display = "inline";
            //console.log(docData);
            hca.switchMode("learn");
            hca.learn.know();
        },
        //知ってるときの処理
        "know": function () {
            if ($$("#answerText").style.display !== "none") {
                if (docData.data.length <= nowQNum + 1) {
                    var replay = confirm("CSVファイル内の問題の個数分だけ問題を表示しました。\nもう一度最初から始めますか？");
                    if (replay) hca.learn.replay();
                    else hca.switchMode("menu");
                } else {
                    const randomNum = usefulFn.randomNum(0, questionsLength - 1);
                    //console.log(randomNum);
                    const nextQuestion = docData.data[randomNum][0];
                    const nextAnswer = docData.data[randomNum][1];
                    $$("#questionText").textContent = nextQuestion;
                    $$("#answerText").textContent = nextAnswer;
                    $$("#answerText").style.display = "none";
                    nowQNum++;
                }
            } else {
                $$("#answerText").style.display = "inline";
            }
        },
        //知らないときの処理
        "unknow": function () {

        },
        //もう一回やる処理
        "replay": function () {
            nowQNum = 0;
            $$("#answerText").style.display = "inline";
            hca.switchMode("learn");
            hca.learn.know();
        }
    }
}
window.onload = function () {
    hca.switchMode("menu");
    if (getURLParam().q) {
        hca.learn.start(LZString.decompressFromEncodedURIComponent(getURLParam().q));
    }
    //$$("#versionInfo").textContent = hca.version;
    //addEventListener
    $$("#createNew").addEventListener("click", function () {
        hca.switchMode("editor");
    });

    $$("#openFile").addEventListener("click", function () {
        $$("#openFileInput").click();
    })

    $$("#homeButton").addEventListener("click", function () {
        if ($$("#editor").className === "show") {
            if (confirm("ホーム画面に戻ると、編集中の内容が削除されますが続行しますか？")) hca.switchMode("menu");
        } else hca.switchMode("menu");
    });

    $$("#shareButton").addEventListener("click", function (e) {
        e.preventDefault();
        hca.shareCSV();
    });

    $$("#openFileintoEditor").addEventListener("click", function () {
        $$("#openFileintoEditorInput").click();
    });

    $$("#openFileintoEditorInput").addEventListener("change", function (e) {
        const file = e.target.files[0];
        let fileReader = new FileReader();
        fileReader.onload = function () {
            const text = usefulFn.encodeString(fileReader.result);
            $$("#csvEditor").value = text;
        }
        fileReader.readAsArrayBuffer(file);
    });

    $$("#eaQuestion").addEventListener("keypress", function (e) {
        if (e.keyCode === 13 && e.target.value !== "") {
            $$("#eaAnswer").focus();
        }
    });
    $$("#eaAnswer").addEventListener("keypress", function (e) {
        if (e.keyCode === 13 && e.target.value !== "") {
            $$("#addQA").click();
        }
    });

    $$("#addQA").addEventListener("click", function () {
        if ($$("#questionText").value !== "" && $$("#answerText").value !== "") {
            $$("#csvEditor").value += $$("#eaQuestion").value + "," + $$("#eaAnswer").value + "\n";
            $$("#eaQuestion").value = $$("#eaAnswer").value = "";
            $$("#eaQuestion").focus();
        } else {
            alert("入力されていない項目ガあります");
        }
    });

    $$("#clickArea").addEventListener("click", function () {
        hca.learn.know();
    })

    $$("#openFileInput").addEventListener("change", function (e) {
        const file = e.target.files[0];
        let fileReader = new FileReader();
        fileReader.onload = function () {
            const text = usefulFn.encodeString(fileReader.result);
            hca.learn.start(text);
        }
        fileReader.readAsArrayBuffer(file);
    });
}
