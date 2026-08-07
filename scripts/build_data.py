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

# (board名, seg, シートタブ名, レイアウト)
SCHED_TABS = [
    ("HERO'ZZ", "school", "HERO’ZZ", "std"),
    ("CREATOR'ZZ", "school", "CREATOR’ZZ", "no"),
    ("RVA", "school", "RVA", "no_nomedia"),
    ("AI+", "school", "AI＋", "no_ai"),
    ("MERISE", "school", "MERIZE(占い)", "std"),
    ("REAL VALUE", "talent", "RealValue", "no"),
    ("LASTCALL", "talent", "LASTCALL", "no"),
    ("星乃リア", "talent", "星乃リアさん運用", "std"),
    ("ねぶたちゃん", "talent", "ねぶたちゃん運用", "std"),
    ("橋本さん", "talent", "橋本さん運用", "std"),
]
KPI_NAME_MAP = {"RVA": "RVA", "MERISE": "MERISE", "CREATOR'ZZ": "CREATOR'ZZ", "HERO'ZZ": "HERO'ZZ",
                "AI＋": "AI+", "AI+": "AI+", "REAL VALUE": "REAL VALUE", "LASTCALL": "LASTCALL",
                "星野リア": "星乃リア", "溝口勇児": "溝口勇児"}
KPI_ORDER = ["HERO'ZZ", "CREATOR'ZZ", "RVA", "AI+", "MERISE",
             "REAL VALUE", "LASTCALL", "星乃リア", "溝口勇児"]
OWNERS = set("森 武本 平松 川崎 川ｻ崎 小笠原 松崎 黒河 朝岡 稲垣 武田 平山".split())
ACTIVE = {"撮影", "編集", "修正中", "社内確認中", "納品", "企画/台本"}
SEG_SCHOOL = {"HERO'ZZ", "CREATOR'ZZ", "RVA", "AI+", "MERISE"}


def access_token():
    o = json.loads(os.environ["GOOGLE_OAUTH"])
    data = urllib.parse.urlencode({
        "client_id": o["client_id"], "client_secret": o["client_secret"],
        "refresh_token": o["refresh_token"], "grant_type": "refresh_token"}).encode()
    r = urllib.request.urlopen(urllib.request.Request("https://oauth2.googleapis.com/token", data=data))
    return json.load(r)["access_token"]


TOKEN = access_token()


def fetch(sheet_id, ranges):
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


def detect_link_cols(rows):
    """ヘッダー行（「状況」を含む先頭5行）からリンク系列（投稿リンク・完パケ）の列位置を検出"""
    for r in rows[:5]:
        cells = [(c if isinstance(c, str) else str(c)).strip() for c in r]
        if "状況" in cells:
            return [(i, link_label(c)) for i, c in enumerate(cells)
                    if ("リンク" in c or "完パケ" in c) and "キャプション" not in c]
    return []


def build_sched():
    ranges = [f"'{t[2]}'!A1:P500" for t in SCHED_TABS]
    tabs = fetch(SCHED_ID, ranges)
    lo, hi = TODAY - timedelta(days=7), TODAY + timedelta(days=80)
    out = []
    for (name, seg, _tab, layout), rows in zip(SCHED_TABS, tabs):
        items = []
        lcols = detect_link_cols(rows)
        for r in rows:
            if not r:
                continue
            if layout == "std":
                title, media, status = cell(r, 0), cell(r, 1), cell(r, 2)
                draft, date, time = cell(r, 4), cell(r, 6), cell(r, 8)
                editor = cell(r, 9)
            elif layout == "no_nomedia":
                title, status = cell(r, 1), cell(r, 2)
                draft, date, time = cell(r, 4), cell(r, 6), cell(r, 8)
                editor = cell(r, 9)
                media = "ショート動画" if ("切り抜き" in title or "ショート" in title) else "ロング動画"
            else:  # no / no_ai
                title, media, status = cell(r, 1), cell(r, 2), cell(r, 3)
                draft, deliver, date, time = cell(r, 5), cell(r, 6), cell(r, 7), cell(r, 9)
                editor = cell(r, 10)
                if layout == "no_ai" and not parse_md(date):
                    date = deliver  # AI+はタスク行の期日が納品日列にある
            if not title or title in ("コンテンツ",) or status == "状況" or title.startswith("http"):
                continue
            if not media and layout == "std":
                media = "ロング動画" if "ロング" in title else "ショート動画"
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
            d_out = draft if (drv and draft != date and lo <= drv <= hi) else ""
            items.append([date, time, title, media, status, editor, d_out, links])
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
            cur["kpis"].append([clean_kpi_name(a), t, pace, act])
    return basis, [cases[n] for n in KPI_ORDER if n in cases]


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
    board = {
        "updated": NOW.strftime("%Y/%m/%d %H:%M") + " 自動更新",
        "year": TODAY.year,
        "kpiBasis": basis or NOW.strftime("%Y年%-m月%-d日"),
        "concepts": concepts,
        "kpi": kpi,
        "sched": sched,
    }
    js = ("// WEIN スクール横串オーガニック data.js — 自動生成 "
          + NOW.strftime("%Y-%m-%d %H:%M JST") + "\nwindow.BOARD = "
          + json.dumps(board, ensure_ascii=False, separators=(",", ":")) + ";\n")
    root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    with open(os.path.join(root, "data.js"), "w", encoding="utf-8") as f:
        f.write(js)
    ipath = os.path.join(root, "index.html")
    html = open(ipath, encoding="utf-8").read()
    html = re.sub(r"data\.js\?v=[0-9A-Za-z]+", "data.js?v=" + NOW.strftime("%Y%m%d%H%M"), html)
    open(ipath, "w", encoding="utf-8").write(html)
    print("OK: sched cases=%d, kpi cases=%d, concepts=%d, basis=%s" % (
        len(sched), len(kpi), len(concepts), basis))
    for c in sched:
        print("  -", c["name"], len(c["rows"]), "rows")


if __name__ == "__main__":
    main()
