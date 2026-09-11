"""スケジュール日次スナップショット（snapshots/YYYY-MM-DD.enc.json）の閲覧・比較ツール。
シートには書き込まない。復号にはボードのパスワード（BOARD_PASSWORD か ~/.config/wein-board/board_pass）が必要。

  python3 scripts/snapshot_tool.py list
  python3 scripts/snapshot_tool.py tabs 2026-09-11
  python3 scripts/snapshot_tool.py show 2026-09-11 RealValue [キーワード]
  python3 scripts/snapshot_tool.py diff 2026-09-10 2026-09-11 RealValue
  python3 scripts/snapshot_tool.py csv  2026-09-11 RealValue out.csv
"""
import os, sys, json, csv
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import build_data as bd

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SDIR = os.path.join(ROOT, "snapshots")


def load(date):
    p = os.path.join(SDIR, f"{date}.enc.json")
    if not os.path.exists(p):
        sys.exit(f"無い: {p}")
    return json.loads(bd.decrypt_blob(json.load(open(p, encoding="utf-8"))))


def main():
    a = sys.argv[1:]
    if not a or a[0] == "list":
        for f in sorted(os.listdir(SDIR)):
            if f.endswith(".enc.json"):
                print(f[:10], os.path.getsize(os.path.join(SDIR, f)), "bytes")
        return
    cmd = a[0]
    if cmd == "tabs":
        s = load(a[1])
        for t, rows in s["tabs"].items():
            print(f"{t}: {len(rows)} rows")
    elif cmd == "show":
        s = load(a[1]); rows = s["tabs"][a[2]]; kw = a[3] if len(a) > 3 else None
        for i, r in enumerate(rows, start=1):
            line = " | ".join(str(c) for c in r)
            if kw is None or kw in line:
                print(i, line[:220])
    elif cmd == "diff":
        s1, s2 = load(a[1]), load(a[2]); tab = a[3]
        items = bd.diff_tab(tab, s1["tabs"][tab], s2["tabs"][tab])
        print(f"{a[1]} → {a[2]} [{tab}] 消失 {len(items)} 件")
        for it in items:
            print(f"  {it['kind']:<4} {it['date']:>5} {it['title'][:34]:<36} {it['detail']}")
        p, c = bd.index_rows(s1["tabs"][tab]), bd.index_rows(s2["tabs"][tab])
        added = [t for t in c if t not in p]
        print(f"  追加 {len(added)} 件: " + "・".join(t[:20] for t in added[:15]))
    elif cmd == "csv":
        s = load(a[1]); rows = s["tabs"][a[2]]
        with open(a[3], "w", newline="", encoding="utf-8-sig") as f:
            csv.writer(f).writerows(rows)
        print("wrote", a[3], len(rows), "rows")
    else:
        print(__doc__)


if __name__ == "__main__":
    main()
