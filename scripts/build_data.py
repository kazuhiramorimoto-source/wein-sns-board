# -*- coding: utf-8 -*-
"""スクール横串オーガニックボード data.js 自動生成
毎朝GitHub Actionsから実行。Google Sheetsを読み、data.jsを再生成してindex.htmlのキャッシュバスターを更新する。
認証: 環境変数 GOOGLE_OAUTH = {"client_id","client_secret","refresh_token"}（spreadsheets.readonly）
"""
import json, os, re, sys, urllib.request, urllib.parse
from datetime import datetime, timedelta, timezone

JST = timezone(timedelta(hours=9))
NOW = datetime.now(JST)
TODAY = NOW.date()

SCHED_ID = "1PEWkztpD7tXCUiFYGwjseb2muDkOrq-l2lpXTt5DGBs"
KPI_ID = "14TLXnMAY_8lC48yThRo5owTgi-O7esk0LeDXAszdoLA"
LEDGER_ID = "1j0gLG93jXCzH3GH7DTFVukcENR4gbc3O1NgDwUHPMCE"
INFOMA_ID = "1SYpEuUaFCg5ogRmt2L1KZ8b-Wurg1r5cCsRaox37350"  # スクール×インフォマ管理シート

# (board名, seg, シートタブ名) ※列位置はヘッダー行から検出するのでレイアウト指定は不要
SCHED_TABS = [
    ("HERO'ZZ", "school", "HERO’ZZ"),
    ("CREATOR'ZZ", "school", "CREATOR’ZZ"),
    ("RVA", "school", "RVA"),
    ("AI+", "school", "AI＋"),
    ("MERISE", "school", "MERIZE(占い)"),
    ("REAL VALUE", "talent", "RealValue"),
    ("LASTCALL", "talent", "LASTCALL"),
    ("星乃リア", "talent", "星乃リアさん運用"),
    ("ねぶたちゃん", "talent", "ねぶたちゃん運用"),
    # ("橋本さん", "talent", "橋本さん運用"),  # 2026-08-28 森本指示: 8月で運用終了のためボードから除外（再開時はコメント解除）
]
KPI_NAME_MAP = {"RVA": "RVA", "MERISE": "MERISE", "CREATOR'ZZ": "CREATOR'ZZ", "HERO'ZZ": "HERO'ZZ",
                "AI＋": "AI+", "AI+": "AI+", "REAL VALUE": "REAL VALUE", "LASTCALL": "LASTCALL",
                "星野リア": "星乃リア", "溝口勇児": "溝口勇児"}
KPI_ORDER = ["HERO'ZZ", "CREATOR'ZZ", "RVA", "AI+", "MERISE",
             "REAL VALUE", "LASTCALL", "星乃リア", "ねぶたちゃん", "溝口勇児"]
OWNERS = set("森 武本 平松 川崎 川ｻ崎 小笠原 松崎 黒河 鈴木 朝岡 稲垣 武田 平山".split())
ACTIVE = {"撮影", "編集", "修正中", "社内確認中", "納品", "企画/台本"}
SEG_SCHOOL = {"HERO'ZZ", "CREATOR'ZZ", "RVA", "AI+", "MERISE"}


def access_token():
    o = json.loads(os.environ["GOOGLE_OAUTH"])
    data = urllib.parse.urlencode({
        "client_id": o["client_id"], "client_secret": o["client_secret"],
        "refresh_token": o["refresh_token"], "grant_type": "refresh_token"}).encode()
    r = urllib.request.urlopen(urllib.request.Request("https://oauth2.googleapis.com/token", data=data))
    return json.load(r)["access_token"]


TOKEN = None  # 遅延取得（--encrypt-only ではGoogle認証不要）


def fetch(sheet_id, ranges):
    global TOKEN
    if TOKEN is None:
        TOKEN = access_token()
    q = "&".join("ranges=" + urllib.parse.quote(r, safe="") for r in ranges)
    url = f"https://sheets.googleapis.com/v4/spreadsheets/{sheet_id}/values:batchGet?{q}&majorDimension=ROWS"
    req = urllib.request.Request(url, headers={"Authorization": "Bearer " + TOKEN})
    return [vr.get("values", []) for vr in json.load(urllib.request.urlopen(req)).get("valueRanges", [])]


def cell(row, i):
    return (row[i] if i < len(row) else "").strip() if isinstance(row[i] if i < len(row) else "", str) else str(row[i] if i < len(row) else "")


def parse_md(s):
    m = re.match(r"^(\d{1,2})/(\d{1,2})$", (s or "").strip())
    if not m:
        return None
    mo, d = int(m.group(1)), int(m.group(2))
    if not (1 <= mo <= 12 and 1 <= d <= 31):
        return None
    try:
        return datetime(TODAY.year, mo, d, tzinfo=JST).date()
    except ValueError:
        return None


def link_label(h):
    h = h.replace("\n", "").strip()
    if "完パケ" in h:
        return "完パケ"
    l = h.replace("投稿リンク", "")
    l = l.strip("（）() 　").replace(" ", "").replace("＆", "/").replace("&", "/")
    return l or "リンク"


HEAD_MAP = {"title": "コンテンツ", "media": "媒体区分", "status": "状況",
            "draft": "初稿日", "deliver": "納品日", "date": "投稿日",
            "time": "時間", "editor": "編集担当"}


def detect_header(rows):
    """ヘッダー行（「状況」を含む先頭6行）から各列の位置を検出。
    タブごとにNo列の有無や列順が違い、シート側の列追加/削除で静かにズレるため、
    レイアウトを決め打ちせず必ず列名から引く。"""
    for ri, r in enumerate(rows[:6]):
        cells = [(c if isinstance(c, str) else str(c)).strip() for c in r]
        if "状況" not in cells:
            continue
        idx = {}
        for key, label in HEAD_MAP.items():
            for i, c in enumerate(cells):
                if c == label:
                    idx[key] = i
                    break
        links = [(i, link_label(c)) for i, c in enumerate(cells)
                 if ("リンク" in c or "完パケ" in c) and "キャプション" not in c]
        return ri, idx, links
    return -1, {}, []


def infer_media(title):
    """媒体区分の列が無い／空のときのフォールバック。
    RVAは2026-09-08に媒体区分列が追加されたので通常は使われない。
    ⚠️既定をショートにすると長尺（例：まさにい×ゆるみな）がショート扱いになる。"""
    t = title or ""
    if "切り抜き" in t or "ショート" in t:
        return "ショート動画"
    return "ロング動画"


def build_sched():
    ranges = [f"'{t[2]}'!A1:P500" for t in SCHED_TABS]
    tabs = fetch(SCHED_ID, ranges)
    lo, hi = TODAY - timedelta(days=7), TODAY + timedelta(days=80)
    out = []
    for (name, seg, tab), rows in zip(SCHED_TABS, tabs):
        hrow, col, lcols = detect_header(rows)
        if hrow < 0 or "title" not in col or "date" not in col:
            print("  !! %s: ヘッダー検出に失敗（列名を確認）" % name)
            out.append({"name": name, "seg": seg, "rows": []})
            continue
        g = lambda r, k: cell(r, col[k]) if k in col else ""
        items = []
        for r in rows[hrow + 1:]:
            if not r:
                continue
            title = g(r, "title")
            if not title or title.startswith("http"):
                continue
            status, media = g(r, "status"), g(r, "media")
            date, time = g(r, "date"), g(r, "time")
            draft, deliver, editor = g(r, "draft"), g(r, "deliver"), g(r, "editor")
            if not media:
                media = infer_media(title)
            dv = parse_md(date)
            if dv:
                if not (lo <= dv <= hi):
                    continue
            else:
                if status not in ACTIVE:
                    continue
                date = ""
            title = title.replace("\n", " ")[:60]
            links = []
            for ci, lb in lcols:
                v = cell(r, ci)
                if v.startswith("http"):
                    links.append([lb, v])
            drv = parse_md(draft)
            d_out = draft if (drv and draft != date) else ""
            dlv = parse_md(deliver)
            v_out = deliver if (dlv and deliver != date) else ""
            items.append([date, time, title, media, status, editor, d_out, links, v_out])
            if len(items) >= 250:
                break
        out.append({"name": name, "seg": seg, "rows": items})
    return out


def clean_kpi_name(n):
    parts = re.findall(r"（([^）]*)）", n)
    for p in parts:
        if p in OWNERS or p.endswith("さん") or p in ("今月", "今月投稿分", "自動・投稿日ベース"):
            n = n.replace("（" + p + "）", "")
    return n.strip()


def num(s):
    s = (s or "").replace(",", "").replace("%", "").strip()
    if s in ("", "-", "—"):
        return None
    try:
        return int(float(s))
    except ValueError:
        return None


def build_kpi():
    school, talent = fetch(KPI_ID, ["'スクール'!A1:F150", "'非スクール'!A1:F100"])
    basis = ""
    cases = {}
    for rows, seg in ((school, "school"), (talent, "talent")):
        cur = None
        for r in rows:
            a = cell(r, 0)
            if a == "基準日" and not basis:
                basis = cell(r, 1)
                continue
            if a.startswith("■"):
                raw = re.sub(r"^■\s*", "", a).split("（")[0].strip()
                nm = KPI_NAME_MAP.get(raw, raw)
                cur = {"name": nm, "seg": seg, "kpis": []}
                cases[nm] = cur
                continue
            if cur is None or not a or "KPI" in a and "月次" in a:
                continue
            t, pace, act = num(cell(r, 1)), num(cell(r, 2)), num(cell(r, 3))
            if t is None and pace is None and act is None:
                continue
            if not t and not act:
                continue   # 目標未設定/0かつ実績なし（計測開始前の②行など）はボードに出さない
            cur["kpis"].append([clean_kpi_name(a), t, pace, act])
    return basis, [cases[n] for n in KPI_ORDER if n in cases]


def norm_school(s):
    """インフォマシートのスクール表記をボードの案件名に寄せる（全角＋・カーリー引用符）"""
    s = (s or "").strip().replace("’", "'")
    return {"AI＋": "AI+", "MERIZE": "MERISE"}.get(s, s)


def md(s):
    """2026-07-25 / 2026/7/25 / 7/25 → "7/25"（空なら""）"""
    s = (s or "").strip()
    m = re.match(r"^(\d{4})[-/](\d{1,2})[-/](\d{1,2})", s)
    if m:
        return "%d/%d" % (int(m.group(2)), int(m.group(3)))
    m = re.match(r"^(\d{1,2})/(\d{1,2})$", s)
    return "%d/%d" % (int(m.group(1)), int(m.group(2))) if m else ""


def build_infoma():
    """スクール×インフォマ管理シート → 放送予定（④）＋台本/配信の進行（⑤⑥）"""
    cal, scr, dlv = fetch(INFOMA_ID, [
        "'④ 放送カレンダー 2026'!A1:G80",
        "'⑤ 台本進行管理'!A4:J200",
        "'⑥ 配信進行管理'!A4:J200",
    ])
    air, y, mo = [], None, None
    for r in cal:
        hm = re.match(r"^(\d{4})年\s*(\d{1,2})月", cell(r, 0))
        if hm:
            y, mo = int(hm.group(1)), int(hm.group(2))
            continue
        if not mo:
            continue
        for c in r[:7]:
            lines = [x.strip() for x in (c if isinstance(c, str) else str(c)).split("\n") if x.strip()]
            if not lines or not re.match(r"^\d{1,2}$", lines[0]):
                continue
            day, sch = int(lines[0]), ""
            for ln in lines[1:]:
                if ln.startswith("◆"):
                    sch = norm_school(ln[1:])
                elif ln.startswith("・"):
                    air.append(["%d/%d" % (mo, day), sch, ln[1:].strip()])
    prog = []
    for rows, kind in ((scr, "台本"), (dlv, "配信")):
        for r in rows:
            program, sch = cell(r, 0), norm_school(cell(r, 1))
            if not program and not sch:
                continue
            # A番組 B スクール C 撮影日/配信日 D訴求 E担当 Fステータス G期限 H残日数 Iアラート Jメモ
            prog.append([kind, program, sch, md(cell(r, 2)), cell(r, 5),
                         cell(r, 4), md(cell(r, 6)), cell(r, 8), cell(r, 9)])
    return {"air": air, "prog": prog}


def build_concepts():
    (rows,) = fetch(LEDGER_ID, ["'コンセプト'!A2:D100"])
    out = {}
    for r in rows:
        school, item, text = cell(r, 0), cell(r, 1), cell(r, 2)
        if not school or not item or not text:
            continue
        if item == "戦略ドキュメント" or "未記入" in text:
            continue
        school = {"AI＋": "AI+"}.get(school, school)
        out.setdefault(school, []).append([item, text])
    return out


def main():
    basis, kpi = build_kpi()
    sched = build_sched()
    concepts = build_concepts()
    infoma = build_infoma()
    board = {
        "updated": NOW.strftime("%Y/%m/%d %H:%M") + " 自動更新",
        "year": TODAY.year,
        "kpiBasis": basis or NOW.strftime("%Y年%-m月%-d日"),
        "concepts": concepts,
        "kpi": kpi,
        "sched": sched,
        "infoma": infoma,
    }
    js = ("// WEIN スクール横串オーガニック data.js — 自動生成 "
          + NOW.strftime("%Y-%m-%d %H:%M JST") + "\nwindow.BOARD = "
          + json.dumps(board, ensure_ascii=False, separators=(",", ":")) + ";\n")
    write_encrypted(js)
    print("OK: sched cases=%d, kpi cases=%d, concepts=%d, infoma air=%d/prog=%d, basis=%s" % (
        len(sched), len(kpi), len(concepts), len(infoma["air"]), len(infoma["prog"]), basis))
    for c in sched:
        print("  -", c["name"], len(c["rows"]), "rows")


def board_password():
    pw = os.environ.get("BOARD_PASSWORD")
    if not pw:
        p = os.path.expanduser("~/.config/wein-board/board_pass")
        if os.path.exists(p):
            pw = open(p, encoding="utf-8").read().strip()
    if not pw:
        sys.exit("ERROR: BOARD_PASSWORD 環境変数か ~/.config/wein-board/board_pass が必要です（平文data.jsは公開しない運用）")
    return pw


def write_encrypted(js):
    """data.js相当の平文JSをAES-256-GCMで暗号化してdata.enc.jsに書き出す。平文はディスクに書かない。"""
    import base64, hashlib, secrets
    from cryptography.hazmat.primitives.ciphers.aead import AESGCM
    pw = board_password()
    iterations = 300000
    salt = secrets.token_bytes(16)
    iv = secrets.token_bytes(12)
    key = hashlib.pbkdf2_hmac("sha256", pw.encode("utf-8"), salt, iterations, 32)
    ct = AESGCM(key).encrypt(iv, js.encode("utf-8"), None)
    b64 = lambda b: base64.b64encode(b).decode("ascii")
    enc = ("// WEIN スクール横串オーガニック data.enc.js — 自動生成（AES-256-GCM暗号化済み） "
           + NOW.strftime("%Y-%m-%d %H:%M JST")
           + "\nwindow.BOARD_ENC=" + json.dumps(
               {"v": 1, "it": iterations, "salt": b64(salt), "iv": b64(iv), "ct": b64(ct)},
               separators=(",", ":")) + ";\n")
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(root, "data.enc.js"), "w", encoding="utf-8") as f:
        f.write(enc)
    ipath = os.path.join(root, "index.html")
    html = open(ipath, encoding="utf-8").read()
    html = re.sub(r"data\.enc\.js\?v=[0-9A-Za-z]+", "data.enc.js?v=" + NOW.strftime("%Y%m%d%H%M"), html)
    open(ipath, "w", encoding="utf-8").write(html)


if __name__ == "__main__":
    if "--encrypt-only" in sys.argv:
        # ローカルの既存data.js（未コミット作業ファイル）を暗号化し直すだけのモード
        root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        write_encrypted(open(os.path.join(root, "data.js"), encoding="utf-8").read())
        print("OK: data.enc.js written (encrypt-only)")
    else:
        main()
