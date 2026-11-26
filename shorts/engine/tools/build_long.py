"""Assemble the long-film VO track and the per-episode time maps.

python3 tools/build_long.py            -> uses /mnt/project-files/vo/long_ch{1,2,3}.mp3 when present, else ep1-3 (placeholder)
Writes web/vo/long.mp3, web/vo/long_words.json, web/episodes/long_map.json

Timeline: HEAD s of silence, ch1 (cold open | COLD_GAP s | rest), GAP, ch2, GAP, ch3, TAIL.
long_map.json: for each old Short (ep1..3) a list of [old_t, new_t] anchor pairs from word alignment,
so every key/item of the Shorts can be re-timed onto the long VO.
"""
import json, os, re, subprocess, difflib, sys
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WEB = os.path.join(ROOT, 'web'); PF = '/mnt/project-files/vo'
HEAD, COLD_GAP, GAP, TAIL = 1.2, 3.4, 3.2, 7.0
COLD_END = 'trap.'  # cold open ends on "This is how Nanjing became a trap."

def norm(w): return re.sub(r'[^a-z0-9]', '', w.lower())
def load(p): return json.load(open(p))

def src(k):
    lp = os.path.join(PF, f'long_ch{k}.mp3'); lw = os.path.join(PF, f'long_ch{k}_words.json')
    if os.path.exists(lp) and os.path.exists(lw): return lp, load(lw), True
    return os.path.join(WEB, 'vo', f'ep{k}.mp3'), load(os.path.join(WEB, 'vo', f'ep{k}_words.json')), False

def dur(p): return float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).decode().strip())

pieces = []  # (file, a, b, offset_in_long)
words = []; t = HEAD; real = []
for k in (1, 2, 3):
    p, W, isnew = src(k); real.append(isnew); D = dur(p); ws = W['words']
    cuts = [(0.0, D)]
    if k == 1:
        i = next(i for i, w in enumerate(ws) if w['word'].lower().endswith(COLD_END))
        c = (ws[i]['end'] + ws[i + 1]['start']) / 2
        cuts = [(0.0, c), (c, D)]
    for j, (a, b) in enumerate(cuts):
        pieces.append((p, a, b, t))
        for w in ws:
            if a <= w['start'] < b: words.append({'word': w['word'], 'start': round(w['start'] - a + t, 3), 'end': round(w['end'] - a + t, 3), 'ch': k})
        t += b - a
        if k == 1 and j == 0: t += COLD_GAP
    if k < 3: t += GAP
total = t + TAIL

# audio: silence bed + each piece delayed into place
inp, flt = [], []
for n, (p, a, b, off) in enumerate(pieces):
    inp += ['-ss', f'{a:.3f}', '-to', f'{b:.3f}', '-i', p]
    flt.append(f'[{n}:a]aresample=44100,adelay={int(off * 1000)}|{int(off * 1000)}[a{n}]')
mix = ''.join(f'[a{n}]' for n in range(len(pieces))) + f'amix=inputs={len(pieces)}:normalize=0,apad,atrim=0:{total:.3f}[out]'
out = os.path.join(WEB, 'vo', 'long.mp3')
subprocess.check_call(['ffmpeg', '-y', '-loglevel', 'error', *inp, '-filter_complex', ';'.join(flt + [mix]), '-map', '[out]', '-ac', '2', '-b:a', '192k', out])
json.dump({'duration': round(total, 3), 'source': ['new' if r else 'shorts-placeholder' for r in real], 'words': words}, open(os.path.join(WEB, 'vo', 'long_words.json'), 'w'), indent=0)

# time maps old Short -> long
maps = {}
for k in (1, 2, 3):
    old = load(os.path.join(WEB, 'vo', f'ep{k}_words.json'))['words']; new = [w for w in words if w['ch'] == k]
    sm = difflib.SequenceMatcher(None, [norm(w['word']) for w in old], [norm(w['word']) for w in new], autojunk=False)
    pairs = []
    for blk in sm.get_matching_blocks():
        for d in range(blk.size):
            o, n = old[blk.a + d], new[blk.b + d]; pairs.append([o['start'], n['start']]); pairs.append([o['end'], n['end']])
    pairs.sort(); clean = []
    for p in pairs:  # keep monotone
        if not clean or (p[0] > clean[-1][0] + 1e-3 and p[1] > clean[-1][1] + 1e-3): clean.append(p)
    maps[f'ep{k}'] = {'pairs': clean, 'first': new[0]['start'], 'last': new[-1]['end'], 'matched': round(sm.ratio(), 3)}
maps['meta'] = {'duration': round(total, 3), 'chStart': [next(w['start'] for w in words if w['ch'] == k) for k in (1, 2, 3)],
                'coldEnd': next(w['end'] for w in words if w['word'].lower().endswith(COLD_END)), 'gap': GAP, 'coldGap': COLD_GAP, 'head': HEAD}
json.dump(maps, open(os.path.join(WEB, 'episodes', 'long_map.json'), 'w'))
print('total', round(total, 1), 's; sources', ['new' if r else 'placeholder' for r in real], {k: maps[k]['matched'] for k in ('ep1', 'ep2', 'ep3')}, maps['meta'])
